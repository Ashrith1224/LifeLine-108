import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import { getAllStates, getDistricts } from 'india-state-district';

const Profile = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        stateCode: '',
        stateName: '',
        district: '',
        city: '',
        phone: '',
        bloodGroup: 'A+'
    });

    const [donorType, setDonorType] = useState('volunteer');
    const [userRole, setUserRole] = useState('');

    const [createPassword, setCreatePassword] = useState('');
    const [confirmCreatePassword, setConfirmCreatePassword] = useState('');

    useEffect(() => {
        if (currentUser) {
            supabase.from('profiles').select('*').eq('id', currentUser.uid).single().then(({ data, error }) => {
                if (data && !error) {
                    const stateCodeFound = getAllStates().find(s => s.name === data.state)?.code || '';
                    setFormData({
                        name: data.name || '',
                        stateCode: stateCodeFound,
                        stateName: data.state || '',
                        district: data.district || '',
                        city: data.city || '',
                        phone: data.phone ? data.phone.replace('+91', '') : '', // Extract just the 10 digits
                        bloodGroup: data.blood_group || 'A+'
                    });

                    setUserRole(data.role || '');

                    if (data.role === 'donor') {
                        setDonorType(data.donor_type || 'volunteer');
                    }
                }
            });
        }
    }, [currentUser]);

    const [searchParams] = useSearchParams();
    const isOnboarding = searchParams.get('mode') === 'onboarding';

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!currentUser) return;

        if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
            return setMsg("Failed: Phone number must be exactly 10 digits.");
        }

        setLoading(true);
        try {
            // If Onboarding, handle Password Creation
            if (isOnboarding && createPassword) {
                if (createPassword !== confirmCreatePassword) {
                    setLoading(false);
                    return setMsg("Failed: Passwords do not match.");
                }
                if (createPassword.length < 6) {
                    setLoading(false);
                    return setMsg("Failed: Password must be at least 6 characters.");
                }
                await updateUserPassword(currentUser, createPassword);
            }

            const payload = {
                name: formData.name,
                phone: formData.phone ? `+91${formData.phone}` : '',
                state: formData.stateName,
                district: formData.district,
                city: formData.city,
                blood_group: formData.bloodGroup
            };
            const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', currentUser.uid);
            if (updateError) throw updateError;
            setMsg("Profile updated successfully!");

            // If onboarding, redirect to dashboard after save
            if (isOnboarding) {
                window.location.assign("/dashboard"); // Force reload/redirect to clear context state
            }
        } catch (error: any) {
            console.error(error);
            setMsg("Failed to update profile: " + getFriendlyErrorMessage(error));
        }
        setLoading(false);
    }

    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const { updateUserPassword, reauthenticate, deleteAccount } = useAuth();


    async function handlePasswordChange(e: React.FormEvent) {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return setMsg("Failed: Passwords do not match.");
        }
        if (passwordData.newPassword.length < 6) {
            return setMsg("Failed: Password must be at least 6 characters.");
        }

        setPassLoading(true);
        try {
            // 1. Verify Old Password
            await reauthenticate(currentUser, passwordData.oldPassword);

            // 2. Update to New Password
            await updateUserPassword(currentUser, passwordData.newPassword);

            setMsg("Password updated successfully!");
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error(error);
            setMsg(getFriendlyErrorMessage(error));
        }
        setPassLoading(false);
    }

    return (
        <div className="container" style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="card glass" style={{ maxWidth: '600px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👋</div>
                    <h2 style={{ color: 'var(--primary)', margin: 0 }}>
                        {isOnboarding ? 'Welcome to LifeLine!' : `Hello, ${formData.name || 'Hero'}!`}
                    </h2>
                    <p style={{ color: '#666' }}>
                        {isOnboarding ? "Let's get you set up to save lives." : "Manage your profile and settings here."}
                    </p>
                </div>
                {!isOnboarding && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ fontSize: '0.9rem' }}>Back to Dashboard</button>
                    </div>
                )}

                {msg && <div style={{ padding: '0.75rem', background: msg.includes('Failed') ? '#f8d7da' : '#d1e7dd', color: msg.includes('Failed') ? '#721c24' : '#0f5132', borderRadius: '4px', marginBottom: '1rem' }}>{msg}</div>}

                {/* KYC Status Banner */}
                {!isOnboarding && userRole === 'donor' && donorType === 'member' && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #c8e6c9', color: '#2e7d32', textAlign: 'center', fontWeight: 'bold' }}>
                        <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>⭐</span> Verified Member Donor
                    </div>
                )}
                {!isOnboarding && userRole === 'donor' && donorType === 'volunteer' && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ffe0b2' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#e65100' }}>⭐ Upgrade to Member Donor</h4>
                        <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>To become a Verified Member Donor, KYC verification and blood tests are conducted manually offline. Please contact an Administrator to schedule your verification and upgrade your profile.</p>
                    </div>
                )}

                <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ fontWeight: '500' }}>Full Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Your Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Email Address</label>
                        <input
                            type="email"
                            disabled
                            value={currentUser?.email || ''}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem', background: '#f5f5f5', color: '#888', cursor: 'not-allowed' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Phone Number</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ padding: '0.75rem', background: '#eee', borderRadius: '8px', border: '1px solid #ccc', color: '#555' }}>+91</span>
                            <input
                                type="tel"
                                required
                                placeholder="9876543210"
                                maxLength={10}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontWeight: '500' }}>State</label>
                            <select
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                                value={formData.stateCode}
                                onChange={(e) => {
                                    const nextStateCode = e.target.value;
                                    const nextStateName = e.target.options[e.target.selectedIndex].text;
                                    setFormData({ ...formData, stateCode: nextStateCode, stateName: nextStateName, district: '' });
                                }}
                            >
                                <option value="" disabled>Select State</option>
                                {getAllStates().map((s) => (
                                    <option key={s.code} value={s.code}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontWeight: '500' }}>District</label>
                            <select
                                required
                                disabled={!formData.stateCode}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem', background: !formData.stateCode ? '#f5f5f5' : 'white' }}
                                value={formData.district}
                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                            >
                                <option value="" disabled>Select District</option>
                                {(formData.stateCode ? getDistricts(formData.stateCode) : []).map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>City / Local Area</label>
                        <input
                            type="text"
                            required
                            placeholder="Your Local Area"
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Blood Group</label>
                        <select
                            value={formData.bloodGroup}
                            onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                        >
                            {!formData.bloodGroup && <option value="">Select Blood Group</option>}
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>

                    {isOnboarding && (
                        <>
                            <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--primary)' }}>Create a Password</label>
                                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                                    Set a password to login with your email/password in addition to Google.
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontWeight: '500' }}>Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="New Password"
                                        value={createPassword}
                                        onChange={e => setCreatePassword(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontWeight: '500' }}>Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Confirm Password"
                                        value={confirmCreatePassword}
                                        onChange={e => setConfirmCreatePassword(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {!isOnboarding && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setShowChangePassword(!showChangePassword)}
                                className="btn btn-outline"
                                style={{ width: '100%', marginBottom: '1rem' }}
                            >
                                {showChangePassword ? 'Cancel Change Password' : 'Change Password'}
                            </button>

                            {showChangePassword && (
                                <div style={{ animation: 'fadeIn 0.3s' }}>
                                    <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontWeight: '500' }}>Old Password</label>
                                            <input
                                                type="password"
                                                required
                                                placeholder="Current Password"
                                                value={passwordData.oldPassword}
                                                onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: '500' }}>New Password</label>
                                            <input
                                                type="password"
                                                required
                                                placeholder="New Password"
                                                value={passwordData.newPassword}
                                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontWeight: '500' }}>Confirm Password</label>
                                            <input
                                                type="password"
                                                required
                                                placeholder="Confirm New Password"
                                                value={passwordData.confirmPassword}
                                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                                            />
                                        </div>
                                        <button disabled={passLoading} type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                            {passLoading ? 'Updating...' : 'Update Password'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    <button disabled={loading} type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        {loading ? 'Saving...' : isOnboarding ? 'Complete Registration' : 'Save Changes'}
                    </button>
                </form>

                {/* DANGER ZONE */}
                {!isOnboarding && (
                    <div style={{ marginTop: '3rem', borderTop: '1px solid #ffcdd2', paddingTop: '2rem' }}>
                        <h3 style={{ color: '#c62828', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Danger Zone</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button
                            onClick={async () => {
                                if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
                                if (!window.confirm("This will permanently delete your profile and data. Are you absolutely sure?")) return;

                                try {
                                    setLoading(true);
                                    await deleteAccount(currentUser);
                                    alert("Account deleted.");
                                    navigate('/login');
                                } catch (error: any) {
                                    console.error(error);
                                    setMsg("Failed to delete account: " + getFriendlyErrorMessage(error));
                                    setLoading(false);
                                }
                            }}
                            className="btn btn-outline"
                            style={{ borderColor: '#c62828', color: '#c62828', width: '100%' }}
                        >
                            Delete Account
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Profile;
