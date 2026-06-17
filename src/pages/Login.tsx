import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getFriendlyErrorMessage } from '../utils/errorUtils';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, logout, sendEmailVerification, signInWithGoogle } = useAuth();
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [unverifiedUser, setUnverifiedUser] = useState<any>(null);
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setError('');
            setMsg('');
            setLoading(true);
            const userCredential = await login(email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                setUnverifiedUser(user); // Keep reference to user to resend email
                await logout();
                setError("Email not verified. Please check your inbox.");
                setLoading(false);
                return;
            }

            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
        }
        setLoading(false);
    }

    async function handleGoogleLogin() {
        try {
            setError('');
            setLoading(true);
            await signInWithGoogle();
            // Check if profile is complete? 
            // Since context update is async, we can just default to dashboard.
            // If incomplete, the RequireProfile guard will catch them and send them to onboarding!
            // BUT, for better UX, if we know they are likely new (or we can check the doc), we could send them directly.
            navigate('/');
        } catch (error: any) {
            console.error(error);
            setError(getFriendlyErrorMessage(error));
        }
        setLoading(false);
    }

    async function handleResendEmail() {
        if (!unverifiedUser) return;
        try {
            setMsg("Sending verification email...");
            await sendEmailVerification(unverifiedUser);
            setMsg("Verification email sent! Please check your Inbox and Spam folder.");
            setError("");
        } catch (e: any) {
            console.error(e);
            setError("Failed to send email: " + getFriendlyErrorMessage(e));
            setMsg("");
        }
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

            <div className="card glass animate-slide-up" style={{ maxWidth: '400px', width: '100%', position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.85)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>Login</h2>

                {error && (
                    <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>
                        {error}
                        {error.includes("not verified") && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <button
                                    onClick={handleResendEmail}
                                    style={{ background: 'none', border: 'none', color: '#721c24', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                                >
                                    Resend Verification Email
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {msg && <div style={{ background: '#d1e7dd', color: '#0f5132', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>{msg}</div>}

                <form onSubmit={handleSubmit}>
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="btn"
                        style={{ width: '100%', marginBottom: '1rem', background: 'white', color: '#333', border: '1px solid #ddd', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
                        Sign in with Google
                    </button>
                    <div style={{ textAlign: 'center', margin: '1rem 0', color: '#aaa' }}>OR</div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontWeight: '500' }}>Email</label>
                        <input type="email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontWeight: '500' }}>Password</label>
                        <input type="password" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button disabled={loading} className="btn btn-primary" type="submit" style={{ width: '100%', fontSize: '1.1rem' }}>Log In</button>
                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                        <Link to="/forgot-password" style={{ color: '#666', fontSize: '0.9rem', textDecoration: 'underline' }}>
                            Forgot Password?
                        </Link>
                    </div>
                </form>
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    Need an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Register</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
