import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { useLocation, Link } from 'react-router-dom';

const FloatingNotifier = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [recentMessages, setRecentMessages] = useState<any[]>([]);

    useEffect(() => {
        if (!currentUser) return;
        const nowAtLoad = Date.now();

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('status', 'confirmed')
                .or(`requester_id.eq.${currentUser.uid},confirmed_by.eq.${currentUser.uid}`);

            if (data && !error) {
                data.forEach((r: any) => {
                    const lastMsgAt = Number(r.last_message_at) || 0;
                    if (lastMsgAt && r.last_message_by !== currentUser.uid && lastMsgAt > nowAtLoad) {
                        if (location.pathname === `/contact/${r.id}`) return;

                        setRecentMessages((prev: any[]) => {
                            const withoutOld = prev.filter(m => m.id !== r.id);
                            return [...withoutOld, {
                                id: r.id,
                                text: r.last_message_text || 'New incoming activity...',
                                time: lastMsgAt,
                                name: r.requester_id === currentUser.uid ? r.donor_name : r.patient_name
                            }];
                        });
                    }
                });
            }
        };

        fetchNotifications();

        const channel = supabase
            .channel('floating-notifier-channel')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [currentUser, location.pathname]);

    // Cleanup old messages after 15 seconds
    useEffect(() => {
        if (recentMessages.length === 0) return;
        const interval = setInterval(() => {
            const now = Date.now();
            setRecentMessages(prev => prev.filter(m => (now - m.time) < 15000));
        }, 5000);
        return () => clearInterval(interval);
    }, [recentMessages]);

    const handleDismiss = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setRecentMessages(prev => prev.filter(m => m.id !== id));
    };

    if (recentMessages.length === 0) return null;

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {recentMessages.map(msg => (
                <Link key={msg.id} to={`/contact/${msg.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: 'white',
                        borderLeft: '5px solid #d32f2f',
                        padding: '1rem',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        minWidth: '280px',
                        maxWidth: '350px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        animation: 'slideIn 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#d32f2f', fontSize: '1rem' }}>Message from {msg.name || 'Room'}</strong>
                            <button
                                onClick={(e) => handleDismiss(msg.id, e)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888', padding: '0 5px' }}
                            >
                                &times;
                            </button>
                        </div>
                        <p style={{ margin: 0, color: '#444', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            "{msg.text}"
                        </p>
                        <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            Tap to securely view &rarr;
                        </div>
                    </div>
                </Link>
            ))}
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default FloatingNotifier;
