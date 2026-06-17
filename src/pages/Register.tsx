import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import { getAllStates, getDistricts } from 'india-state-district';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [phone, setPhone] = useState('');
    const [bloodGroup, setBloodGroup] = useState('A+');
    const [stateCode, setStateCode] = useState('');
    const [stateName, setStateName] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');
    const [role, setRole] = useState('donor');

    // Derived districts list
    const availableDistricts = stateCode ? getDistricts(stateCode) : [];

    const { signup, sendEmailVerification, logout, signInWithGoogle } = useAuth();

    // Restored variables
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleGoogleSignup() {
        try {
            setError('');
            setLoading(true);
            await signInWithGoogle();
            // Redirect to profile to complete details since Google doesn't provide blood group/phone
            navigate('/profile?mode=onboarding');
        } catch (error: any) {
            console.error(error);
            setError(getFriendlyErrorMessage(error));
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (password.length < 6) {
            return setError("Password must be at least 6 characters.");
        }

        if (!/^\d{10}$/.test(phone)) {
            return setError("Phone number must be exactly 10 digits.");
        }

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            setError('');
            setLoading(true);
            const res = await signup(email, password);
            const user = res.user;

            // 1. Send Email Verification
            await sendEmailVerification(user);

            // 2. Create User Profile (Initial state)
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: user.uid,
                name,
                email,
                phone: `${countryCode}${phone}`, // Store full number
                blood_group: bloodGroup,
                state: stateName,
                district,
                city,
                role,
                donor_type: role === 'donor' ? 'volunteer' : null,
                kyc_status: role === 'donor' ? 'none' : null,
                available: role === 'donor', // Automatically available
                email_verified: false
            });

            if (profileError) throw profileError;

            // 3. Force Logout & Navigate to Login
            await logout();
            alert("Account created successfully! A verification link has been sent to your email. Please verify your email before logging in (Check Spam Folder).");
            navigate('/login');

        } catch (err: any) {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
        }
        setLoading(false);
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'url(https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=2000&auto=format&fit=crop) center/cover no-repeat',
            padding: '2rem 1rem',
            position: 'relative'
        }}>
            {/* Dark Overlay for readability */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}></div>

            <div className="card glass animate-slide-up" style={{ maxWidth: '600px', width: '100%', position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.9)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>Create Account</h2>
                {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>{error}</div>}

                <button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="btn"
                    style={{ width: '100%', marginBottom: '1rem', background: 'white', color: '#333', border: '1px solid #ddd', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
                    Sign up with Google
                </button>
                <div style={{ textAlign: 'center', margin: '1rem 0', color: '#aaa' }}>OR</div>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: '500' }}>Full Name</label>
                        <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: '500' }}>Email</label>
                        <input type="email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Password</label>
                        <input type="password" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Confirm Password</label>
                        <input type="password" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Phone Number</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <select
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                    width: '100px',
                                    background: '#f9f9f9',
                                    flexShrink: 0
                                }}
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                            >
                                <option value="+91">🇮🇳 +91</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+971">🇦🇪 +971</option>
                                <option value="+61">🇦🇺 +61</option>
                                <option value="+65">🇸🇬 +65</option>
                                <option value="+33">🇫🇷 +33</option>
                                <option value="+49">🇩🇪 +49</option>
                            </select>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                <input
                                    type="tel"
                                    required
                                    placeholder="9876543210"
                                    maxLength={10}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                        </div>
                        <small style={{ color: '#666', fontSize: '0.8rem' }}>Select country code and enter mobile number.</small>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                        <div>
                            <label style={{ fontWeight: '500' }}>State</label>
                            <select
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                                value={stateCode}
                                onChange={(e) => {
                                    setStateCode(e.target.value);
                                    setStateName(e.target.options[e.target.selectedIndex].text);
                                    setDistrict(''); // reset district
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
                                disabled={!stateCode}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem', background: !stateCode ? '#f5f5f5' : 'white' }}
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                            >
                                <option value="" disabled>Select District</option>
                                {availableDistricts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>City / Local Area</label>
                        <input type="text" required placeholder="Type your local area..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Blood Group</label>
                        <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>I am a</label>
                        <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="donor">Donor</option>
                            <option value="requester">Patient / Requester</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem' }}>
                        <input type="checkbox" required id="consent" style={{ width: '20px', height: '20px' }} />
                        <label htmlFor="consent" style={{ fontSize: '0.9rem' }}>
                            I agree to the <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>. LifeLine-108 is a facilitator, not a medical organization.
                        </label>
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                        <button disabled={loading} className="btn btn-primary" type="submit" style={{ width: '100%', fontSize: '1.1rem' }}>
                            {loading ? 'Processing...' : 'Sign Up & Verify'}
                        </button>
                    </div>
                </form>
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Login</Link>
                </div>
            </div >
        </div >
    );
}

export default Register;
