import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getFriendlyErrorMessage } from '../utils/errorUtils';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const { resetPassword } = useAuth();
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setError('');
            setMsg('');
            setLoading(true);
            await resetPassword(email);
            setMsg("Check your inbox for password reset instructions.");
        } catch (e: any) {
            console.error(e);
            setError(getFriendlyErrorMessage(e));
        }
        setLoading(false);
    }

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card glass" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>Reset Password</h2>
                {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>{error}</div>}
                {msg && <div style={{ background: '#d1e7dd', color: '#0f5132', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>{msg}</div>}

                <form onSubmit={handleSubmit}>
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
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
