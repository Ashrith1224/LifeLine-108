import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaTint, FaMapMarkerAlt, FaPhone, FaShieldAlt, FaIdBadge } from 'react-icons/fa';



const Dashboard = () => {
    const { currentUser, logout, sendEmailVerification } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const navigate = useNavigate();

    // Verification State
    const [msg, setMsg] = useState('');




    useEffect(() => {
        async function fetchProfile() {
            if (currentUser) {
                const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.uid).single();
                if (data && !error) {
                    setProfile({
                        ...data,
                        bloodGroup: data.blood_group,
                        donorType: data.donor_type,
                        kycStatus: data.kyc_status,
                        emailVerified: data.email_verified,
                        createdAt: data.created_at
                    });
                }
            }
        }
        fetchProfile();
    }, [currentUser]);





    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    }

    async function handleSendEmail() {
        if (!currentUser) return;
        try {
            await sendEmailVerification(currentUser);
            setMsg("Verification email sent! Check your inbox.");
        } catch (e: any) {
            setMsg("Error sending email: " + e.message);
        }
    }


    if (!currentUser) return <div className="container">Please log in.</div>;

    return (
        <div className="container" style={{ padding: '3rem 0' }}>
            <div className="card glass" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '2px solid #f0f0f0', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #b71c1c 100%)', color: 'white', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(211,47,47,0.3)' }}>
                            {profile?.bloodGroup || <FaUser />}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2rem', color: '#1a1a1a' }}>Dashboard</h2>
                            <p style={{ margin: '0.3rem 0 0', color: '#666', fontSize: '1.1rem' }}>Manage your settings and availability</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => navigate('/profile')} className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.6rem 1.5rem' }}>Edit Profile</button>
                        <button onClick={handleLogout} className="btn btn-outline" style={{ borderColor: '#d32f2f', color: '#d32f2f', fontSize: '1rem', padding: '0.6rem 1.5rem' }}>Logout</button>
                    </div>
                </div>

                {msg && <div style={{ padding: '1rem', background: '#e3f2fd', color: '#0d47a1', borderRadius: '8px', marginBottom: '1rem' }}>{msg}</div>}

                {/* Verification Warnings */}
                {!currentUser.emailVerified && (
                    <div style={{ padding: '1rem', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '8px', marginBottom: '2rem', color: '#b71c1c' }}>
                        <strong>Action Required:</strong>
                        <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
                            <li>
                                Please verify your email address.
                                <button onClick={handleSendEmail} style={{ marginLeft: '10px', fontSize: '0.8rem', cursor: 'pointer', background: 'none', border: 'underline', color: '#b71c1c', textDecoration: 'underline' }}>Resend Email</button>
                            </li>
                        </ul>
                    </div>
                )}

                {profile && (
                    <div style={{ display: 'grid', gap: '2rem' }}>

                        {/* 1. Profile Summary Card */}
                        <div style={{ padding: '2rem', background: 'white', borderRadius: '16px', border: '1px solid #e0e0e0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: '#333', borderBottom: '2px solid #f5f5f5', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
                                <FaIdBadge color="var(--primary)" /> Profile Details
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                                <div style={{ background: '#fafafa', padding: '1.2rem', borderRadius: '10px', border: '1px solid #eee' }}>
                                    <small style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}><FaTint /> Blood Group</small>
                                    <div style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: '800' }}>{profile.bloodGroup}</div>
                                </div>
                                <div style={{ background: '#fafafa', padding: '1.2rem', borderRadius: '10px', border: '1px solid #eee' }}>
                                    <small style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}><FaShieldAlt /> Role</small>
                                    <div style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '1.1rem', color: '#333' }}>{profile.role}</div>
                                </div>
                                <div style={{ background: '#fafafa', padding: '1.2rem', borderRadius: '10px', border: '1px solid #eee' }}>
                                    <small style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}><FaMapMarkerAlt /> City</small>
                                    <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#333' }}>{profile.city}</div>
                                </div>
                                <div style={{ background: '#fafafa', padding: '1.2rem', borderRadius: '10px', border: '1px solid #eee' }}>
                                    <small style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}><FaPhone /> Phone</small>
                                    <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#333' }}>{profile.phone}</div>
                                </div>
                                {profile.role === 'donor' && (
                                    <div style={{ background: profile.available ? '#e8f5e9' : '#fafafa', padding: '1.2rem', borderRadius: '10px', border: '1px solid #eee' }}>
                                        <small style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Availability</small>
                                        <div style={{ color: profile.available ? '#2e7d32' : '#757575', fontWeight: 'bold', fontSize: '1.1rem' }}>{profile.available ? '● Available' : '○ Offline'}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Status Toggle (Donors ONLY) */}
                        {profile.role === 'donor' && (
                            <div style={{ padding: '2rem', background: profile.available ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : '#fafafa', borderRadius: '16px', border: profile.available ? '1px solid #a5d6a7' : '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                <div>
                                    <h3 style={{ marginBottom: '0.5rem', color: profile.available ? '#1b5e20' : '#616161', fontSize: '1.4rem' }}>Visibility Status</h3>
                                    <p style={{ margin: 0, fontSize: '1rem', color: profile.available ? '#2e7d32' : '#757575' }}>
                                        {profile.available
                                            ? "You are currently online and visible to patients nearby."
                                            : "You are currently hidden from search results."}
                                    </p>
                                </div>
                                <button
                                    className="btn"
                                    style={{
                                        background: profile.available ? '#white' : '#2e7d32',
                                        color: profile.available ? '#d32f2f' : 'white',
                                        border: profile.available ? '2px solid #d32f2f' : 'none',
                                        minWidth: '180px',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        padding: '0.8rem 2rem',
                                        boxShadow: profile.available ? 'none' : '0 4px 10px rgba(46,125,50,0.3)'
                                    }}
                                    onClick={async () => {
                                        if (!currentUser.emailVerified) return alert("Verify email first.");
                                        try {
                                            const newStatus = !profile.available;
                                            const { error } = await supabase.from('profiles').update({ available: newStatus }).eq('id', currentUser.uid);
                                            if (error) throw error;
                                            setProfile({ ...profile, available: newStatus });
                                        } catch (e) { console.error(e); }
                                    }}
                                >
                                    {profile.available ? 'Go Offline' : 'Go Online'}
                                </button>
                            </div>

                        )}





                        {/* 4. Removed Feeds from Dashboard explicitly per request */}
                    </div>
                )}

            </div>


        </div >
    );
};

export default Dashboard;


