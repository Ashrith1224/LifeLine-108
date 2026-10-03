import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useLocation, Link } from 'react-router-dom';

const FloatingNotifier = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [recentMessages, setRecentMessages] = useState<any[]>([]);

    useEffect(() => {
        if (!currentUser) return;
        const nowAtLoad = Date.now();

        const q = query(
            collection(db, 'requests'),
            where('status', '==', 'confirmed')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.forEach((docSnap) => {
                const r = docSnap.data();
                const requesterId = r.requesterId || r.requester_id;
                const confirmedBy = r.confirmedBy || r.confirmed_by;

                // Only requests where the current user is requester or confirmed donor
                if (requesterId === currentUser.uid || confirmedBy === currentUser.uid) {
                    const lastMsgAt = Number(r.lastMessageAt || r.last_message_at) || 0;
                    const lastMsgBy = r.lastMessageBy || r.last_message_by;
                    const lastMsgText = r.lastMessageText || r.last_message_text;

                    if (lastMsgAt && lastMsgBy !== currentUser.uid && lastMsgAt > nowAtLoad) {
                        if (location.pathname === `/contact/${docSnap.id}`) return;

                        setRecentMessages((prev: any[]) => {
                            const withoutOld = prev.filter(m => m.id !== docSnap.id);
                            return [...withoutOld, {
                                id: docSnap.id,
                                text: lastMsgText || 'New incoming activity...',
                                time: lastMsgAt,
                                name: requesterId === currentUser.uid ? (r.donorName || r.donor_name) : (r.patientName || r.patient_name)
                            }];
                        });
                    }
                }
            });
        }, (err) => {
            console.error("FloatingNotifier error:", err);
        });

        return () => unsubscribe();
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
