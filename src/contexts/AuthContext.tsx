import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    sendPasswordResetEmail,
    sendEmailVerification as firebaseSendEmailVerification,
    deleteUser,
    onAuthStateChanged,
    type User
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

const AuthContext = createContext<any>(null);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    function mapProfile(data: any, uid: string) {
        if (!data) return null;
        return {
            ...data,
            id: uid,
            uid: uid,
            bloodGroup: data.bloodGroup || data.blood_group || '',
            donorType: data.donorType || data.donor_type || 'volunteer',
            kycStatus: data.kycStatus || data.kyc_status || 'none',
            emailVerified: data.emailVerified !== undefined ? data.emailVerified : false,
            createdAt: data.createdAt || data.created_at || new Date().toISOString()
        };
    }

    async function fetchProfile(userId: string) {
        try {
            const docRef = doc(db, 'profiles', userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const profile = mapProfile(docSnap.data(), userId);
                setUserRole(profile.role || null);
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

    async function signup(email: string, password: string) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential;
    }

    async function login(email: string, password: string) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    }

    async function signInWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        // Check if profile exists, if not initialize a base profile doc
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
            await setDoc(profileRef, {
                id: user.uid,
                name: user.displayName || '',
                email: user.email || '',
                role: 'donor',
                available: true,
                donorType: 'volunteer',
                kycStatus: 'none',
                emailVerified: user.emailVerified,
                createdAt: new Date().toISOString()
            });
        }
        return result;
    }

    function logout() {
        return signOut(auth);
    }

    function updateUserPassword(_user: any, newPassword: string) {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user.");
        return updatePassword(user, newPassword);
    }

    async function reauthenticate(user: any, password: string) {
        const authUser = auth.currentUser;
        if (!authUser || !authUser.email) throw new Error("No authenticated user to reauthenticate.");
        const credential = EmailAuthProvider.credential(authUser.email || user?.email, password);
        await reauthenticateWithCredential(authUser, credential);
        return true;
    }

    function resetPassword(email: string) {
        return sendPasswordResetEmail(auth, email);
    }

    function sendEmailVerification(user?: any) {
        const authUser = auth.currentUser || user;
        if (!authUser) throw new Error("No user to send email verification.");
        return firebaseSendEmailVerification(authUser);
    }

    function linkPhone(_user: any, _phoneNumber: string, _appVerifier: any) {
        return Promise.resolve();
    }

    function verifyPhoneCode(confirmationResult: any, _code: string) {
        return Promise.resolve(confirmationResult);
    }

    async function deleteAccount(user: any) {
        const uid = user?.uid || auth.currentUser?.uid;
        if (uid) {
            // 1. Delete public profile data from Firestore
            await deleteDoc(doc(db, 'profiles', uid));
        }

        // 2. Delete Auth user account
        if (auth.currentUser) {
            return deleteUser(auth.currentUser);
        }
    }

    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;

        // Safety fallback timer to prevent permanent blank screen if network is slow
        const safetyTimer = setTimeout(() => {
            setLoading(false);
        }, 4000);

        try {
            const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
                clearTimeout(safetyTimer);
                if (user) {
                    setCurrentUser(user);
                    
                    // Realtime subscription to the user's profile document
                    const profileRef = doc(db, 'profiles', user.uid);
                    unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const profile = mapProfile(docSnap.data(), user.uid);
                            setUserRole(profile.role || null);
                            setUserProfile(profile);
                        } else {
                            setUserRole(null);
                            setUserProfile(null);
                        }
                        setLoading(false);
                    }, (err) => {
                        console.error("Profile onSnapshot error:", err);
                        setLoading(false);
                    });
                } else {
                    if (unsubscribeProfile) {
                        unsubscribeProfile();
                        unsubscribeProfile = null;
                    }
                    setCurrentUser(null);
                    setUserRole(null);
                    setUserProfile(null);
                    setLoading(false);
                }
            }, (error) => {
                console.error("onAuthStateChanged error:", error);
                clearTimeout(safetyTimer);
                setLoading(false);
            });

            return () => {
                clearTimeout(safetyTimer);
                unsubscribeAuth();
                if (unsubscribeProfile) unsubscribeProfile();
            };
        } catch (e) {
            console.error("Auth init exception:", e);
            setTimeout(() => setLoading(false), 0);
        }
    }, []);

    const isProfileComplete = Boolean(userProfile && userProfile.phone && userProfile.bloodGroup);

    const value = {
        currentUser,
        userRole,
        userProfile,
        isProfileComplete,
        loading,
        fetchProfile,
        signup,
        login,
        logout,
        sendEmailVerification,
        resetPassword,
        updateUserPassword,
        reauthenticate,
        linkPhone,
        verifyPhoneCode,
        signInWithGoogle,
        deleteAccount
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'var(--primary, #d32f2f)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2rem',
                    boxShadow: '0 8px 25px rgba(211,47,47,0.3)',
                    animation: 'pulse 1.5s infinite'
                }}>
                    🩸
                </div>
                <h3 style={{ marginTop: '1.5rem', color: '#1a1a1a', fontWeight: '700', fontSize: '1.4rem' }}>LifeLine-108</h3>
                <p style={{ color: '#888', fontSize: '0.95rem', marginTop: '0.2rem' }}>Connecting Donors & Patients...</p>
                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7); }
                        70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(211, 47, 47, 0); }
                        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
