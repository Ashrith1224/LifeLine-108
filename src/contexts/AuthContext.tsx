import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext<any>(null);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    async function fetchProfile(userId: string) {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                // Map snake_case database fields to camelCase properties for backward compatibility
                const profile = {
                    ...data,
                    uid: data.id,
                    bloodGroup: data.blood_group,
                    donorType: data.donor_type,
                    kycStatus: data.kyc_status,
                    emailVerified: data.email_verified,
                    createdAt: data.created_at,
                };
                setUserRole(data.role);
                setUserProfile(profile);
            } else {
                setUserRole(null);
                setUserProfile(null);
            }
        } catch (err) {
            console.error("Error fetching user profile:", err);
            setUserRole(null);
            setUserProfile(null);
        }
    }

    function mapUser(user: any) {
        if (!user) return null;
        return {
            ...user,
            uid: user.id,
            emailVerified: user.email_confirmed_at != null || user.confirmed_at != null
        };
    }

    async function signup(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return { user: mapUser(data.user) };
    }

    async function login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { user: mapUser(data.user) };
    }

    async function signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    prompt: 'select_account'
                },
                redirectTo: window.location.origin + '/profile?mode=onboarding'
            }
        });
        if (error) throw error;
        return data;
    }

    function logout() {
        return supabase.auth.signOut();
    }

    function updateUserPassword(_user: any, newPassword: string) {
        return supabase.auth.updateUser({ password: newPassword });
    }

    async function reauthenticate(user: any, password: string) {
        // Reauthenticate by signing in again with password
        const { error } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: password
        });
        if (error) throw error;
        return true;
    }

    function resetPassword(email: string) {
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
    }

    async function verifyRecoveryOtp(email: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery'
        });
        if (error) throw error;
        return data;
    }

    function sendEmailVerification(_user: any) {
        // Supabase sends verification email automatically on signup.
        return Promise.resolve();
    }

    function linkPhone(_user: any, phoneNumber: string, _appVerifier: any) {
        return supabase.auth.updateUser({ phone: phoneNumber });
    }

    function verifyPhoneCode(confirmationResult: any, _code: string) {
        return Promise.resolve(confirmationResult);
    }

    async function deleteAccount(user: any) {
        // 1. Delete public profile data
        await supabase.from('profiles').delete().eq('id', user.id);

        // 2. Sign out (Admin deletes the auth user from the dashboard)
        return supabase.auth.signOut();
    }

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const user = session?.user ?? null;
            if (user) {
                setCurrentUser(mapUser(user));
                fetchProfile(user.id).then(() => setLoading(false));
            } else {
                setCurrentUser(null);
                setUserRole(null);
                setUserProfile(null);
                setLoading(false);
            }
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const user = session?.user ?? null;
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && window.location.hash.includes('type=recovery'))) {
                window.location.hash = '#/reset-password';
            }
            if (user) {
                setCurrentUser(mapUser(user));
                await fetchProfile(user.id);
            } else {
                setCurrentUser(null);
                setUserRole(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const isProfileComplete = userProfile && userProfile.phone && userProfile.bloodGroup;

    const value = {
        currentUser,
        userRole,
        userProfile,
        isProfileComplete,
        signup,
        login,
        logout,
        sendEmailVerification,
        resetPassword,
        verifyRecoveryOtp,
        updateUserPassword,
        reauthenticate,
        linkPhone,
        verifyPhoneCode,
        signInWithGoogle,
        deleteAccount
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
