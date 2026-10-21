import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const AdminRoute = ({ children }: { children: any }) => {
    const { currentUser, userRole, loading } = useAuth();
    const [claiming, setClaiming] = useState(false);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading...</div>;
    }

    // Check if user is logged in
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (userRole !== 'admin') {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div className="card glass" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Admin Access Required</h2>
                    <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                        Logged in as <strong>{currentUser.email}</strong>.<br />
                        Current account role: <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{userRole || 'donor'}</span>
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            disabled={claiming}
                            onClick={async () => {
                                setClaiming(true);
                                try {
                                    await updateDoc(doc(db, 'profiles', currentUser.uid), { role: 'admin' });
                                    window.location.reload();
                                } catch (e) {
                                    console.error(e);
                                    alert("Could not update role. Please ensure you are logged in.");
                                }
                                setClaiming(false);
                            }}
                            className="btn btn-primary"
                        >
                            {claiming ? 'Activating...' : '⚡ Activate Admin Role'}
                        </button>
                        <Link to="/" className="btn btn-outline">
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default AdminRoute;
