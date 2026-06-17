import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const Navbar = () => {
    const { currentUser, isProfileComplete, logout, userRole } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            supabase.from('profiles').select('*').eq('id', currentUser.uid).single().then(({ data, error }) => {
                if (data && !error) {
                    setProfile(data);
                }
            });
        }
    }, [currentUser]);

    const handleHomeClick = async (e: React.MouseEvent) => {
        if (currentUser && !isProfileComplete) {
            e.preventDefault();
            await logout();
            navigate('/');
            setIsOpen(false);
        } else {
            setIsOpen(false);
        }
    };

    return (
        <nav className="navbar glass">
            <div className="container flex-between">
                <Link to="/" onClick={handleHomeClick} className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo.png" alt="LifeLine-108 Logo" style={{ height: '48px', borderRadius: '50%' }} />
                    LifeLine-108
                </Link>

                <button
                    className="mobile-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Menu"
                >
                    ☰
                </button>

                <div className={`nav-links ${isOpen ? 'open' : ''}`}>
                    <Link to="/" onClick={handleHomeClick} className="nav-link">Home</Link>
                    <Link to="/blood-banks" onClick={() => setIsOpen(false)} className="nav-link">Blood Banks</Link>
                    {currentUser && (
                        <Link to="/my-requests" onClick={() => setIsOpen(false)} className="nav-link">
                            My Activity
                        </Link>
                    )}

                    {isInstallable && (
                        <button onClick={handleInstallClick} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            📲 Install App
                        </button>
                    )}

                    {currentUser && userRole === 'admin' && (
                        <Link to="/admin" onClick={() => setIsOpen(false)} className="nav-link" style={{ color: 'var(--primary)' }}>
                            Admin Panel
                        </Link>
                    )}

                    {currentUser ? (
                        <>
                            {isProfileComplete ? (
                                <div
                                    onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: 'var(--shadow-md)'
                                    }}
                                    title="Go to Dashboard"
                                >
                                    {profile?.name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase()}
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('/profile?mode=onboarding')}
                                    className="btn btn-primary"
                                >
                                    Complete Signup
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost" onClick={() => setIsOpen(false)}>Login</Link>
                            <Link to="/register" className="btn btn-primary" onClick={() => setIsOpen(false)}>Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
