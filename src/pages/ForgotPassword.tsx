import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getFriendlyErrorMessage } from '../utils/errorUtils';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP
    const { resetPassword, verifyRecoveryOtp } = useAuth();
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleRequestOtp(e: React.FormEvent) {
        e.preventDefault();
        try {
            setError('');
            setMsg('');
            setLoading(true);
            await resetPassword(email);
            setMsg("A 6-digit recovery OTP code has been sent to your email. Check your Inbox and Spam folder.");
            setStep(2);
        } catch (e: any) {
            console.error(e);
            setError(getFriendlyErrorMessage(e));
        }
        setLoading(false);
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        try {
            setError('');
            setMsg('');
            setLoading(true);
            await verifyRecoveryOtp(email, otp);
            setMsg("Code verified! Redirecting to password reset page...");
            setTimeout(() => {
                navigate('/reset-password');
            }, 1500);
        } catch (e: any) {
            console.error(e);
            setError("Invalid or expired OTP code. Please try again.");
        }
        setLoading(false);
    }

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card glass" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>
                    {step === 1 ? "Reset Password" : "Enter Verification Code"}
                </h2>
                {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>{error}</div>}
                {msg && <div style={{ background: '#d1e7dd', color: '#0f5132', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>{msg}</div>}

                {step === 1 ? (
                    <form onSubmit={handleRequestOtp}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontWeight: '500' }}>Email Address</label>
                            <input 
                                type="email" 
                                required 
                                placeholder="name@example.com"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                            />
                        </div>
                        <button disabled={loading} className="btn btn-primary" type="submit" style={{ width: '100%', fontSize: '1.1rem' }}>
                            {loading ? "Sending..." : "Send OTP Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontWeight: '500' }}>6-Digit OTP Code</label>
                            <input 
                                type="text" 
                                required 
                                maxLength={6}
                                placeholder="Enter 6-digit code"
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem', 
                                    borderRadius: '8px', 
                                    border: '1px solid #ccc', 
                                    marginTop: '0.5rem',
                                    fontSize: '1.25rem',
                                    letterSpacing: '0.25rem',
                                    textAlign: 'center'
                                }} 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only allow numbers
                            />
                        </div>
                        <button disabled={loading} className="btn btn-primary" type="submit" style={{ width: '100%', fontSize: '1.1rem' }}>
                            {loading ? "Verifying..." : "Verify & Reset"}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <button 
                                type="button" 
                                disabled={loading}
                                onClick={handleRequestOtp}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                            >
                                Resend OTP Code
                            </button>
                        </div>
                    </form>
                )}

                <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {step === 2 && (
                        <button 
                            type="button" 
                            onClick={() => setStep(1)} 
                            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            &larr; Back to Email Entry
                        </button>
                    )}
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Login</Link>
                    <div>
                        Need an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Register</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
