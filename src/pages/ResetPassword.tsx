import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getFriendlyErrorMessage } from '../utils/errorUtils';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { updateUserPassword } = useAuth();
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            setError('');
            setMsg('');
            setLoading(true);
            await updateUserPassword(null, password);
            setMsg("Password updated successfully! Redirecting...");
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (e: any) {
            console.error(e);
            setError(getFriendlyErrorMessage(e));
        }
        setLoading(false);
    }

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card glass" style={{ maxWidth: '400px', width: '100%' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>Create New Password</h2>
                {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>{error}</div>}
                {msg && <div style={{ background: '#d1e7dd', color: '#0f5132', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px' }}>{msg}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontWeight: '500' }}>New Password</label>
                        <input 
                            type="password" 
                            required 
                            minLength={6}
                            placeholder="Min 6 characters"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>
                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ fontWeight: '500' }}>Confirm Password</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="Re-enter password"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                        />
                    </div>
                    <button disabled={loading} className="btn btn-primary" type="submit" style={{ width: '100%', fontSize: '1.1rem' }}>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
