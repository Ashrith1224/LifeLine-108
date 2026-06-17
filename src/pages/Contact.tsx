import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { JitsiMeeting } from '@jitsi/react-sdk';

const Contact = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [requestData, setRequestData] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'both' | 'chat' | 'call'>(window.innerWidth > 768 ? 'both' : 'chat');

    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchReq = async () => {
            if (!id) return;
            const { data, error } = await supabase.from('requests').select('*').eq('id', id).single();
            if (data && !error) {
                setRequestData({
                    ...data,
                    patientName: data.patient_name,
                    bloodGroup: data.blood_group,
                    requesterId: data.requester_id,
                    targetedDonorId: data.targeted_donor_id,
                    createdAt: data.created_at,
                    donorId: data.donor_id,
                    donorName: data.donor_name,
                    donorPhone: data.donor_phone,
                    completedAt: data.completed_at,
                    acceptedBy: data.accepted_by,
                    acceptedAt: data.accepted_at,
                    confirmedBy: data.confirmed_by,
                    donorContact: data.donor_contact,
                    acceptedDonors: data.accepted_donors
                });
            }
            setLoading(false);
        };
        fetchReq();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('request_id', id)
                .order('created_at', { ascending: true });
            if (data && !error) {
                setMessages(data.map((m: any) => ({
                    ...m,
                    senderId: m.sender_id,
                    createdAt: m.created_at
                })));
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        };

        fetchMessages();

        const channel = supabase
            .channel(`chat-room-${id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${id}` }, () => {
                fetchMessages();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [id]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !id || !currentUser) return;

        try {
            const { error: msgError } = await supabase.from('messages').insert({
                request_id: id,
                text: newMessage,
                sender_id: currentUser.uid,
                created_at: Date.now()
            });
            if (msgError) throw msgError;

            const { error: reqError } = await supabase
                .from('requests')
                .update({
                    last_message_at: Date.now(),
                    last_message_by: currentUser.uid,
                    last_message_text: newMessage
                })
                .eq('id', id);
            if (reqError) throw reqError;

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleShareLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            if (!id || !currentUser) return;
            const { latitude, longitude } = position.coords;
            const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            const messageText = `📍 I've shared my location: ${locationUrl}`;

            try {
                const { error: msgError } = await supabase.from('messages').insert({
                    request_id: id,
                    text: messageText,
                    sender_id: currentUser.uid,
                    created_at: Date.now()
                });
                if (msgError) throw msgError;

                const { error: reqError } = await supabase
                    .from('requests')
                    .update({
                        last_message_at: Date.now(),
                        last_message_by: currentUser.uid,
                        last_message_text: "📍 Shared a location"
                    })
                    .eq('id', id);
                if (reqError) throw reqError;
            } catch (error) {
                console.error('Error sending location:', error);
                alert('Failed to share location.');
            }
        }, (error) => {
            console.error('Error getting location:', error);
            alert('Unable to retrieve your location. Please check your permissions.');
        });
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading secure room...</div>;
    if (!requestData || !currentUser) return <div className="container" style={{ padding: '2rem' }}>Room not found or unauthorized.</div>;

    // Verify access
    const isRequester = requestData.requesterId === currentUser.uid;
    const isDonorsAcceptedMap = requestData.acceptedDonors?.[currentUser.uid] !== undefined;
    const isLegacyAccepted = requestData.acceptedBy === currentUser.uid;
    const isDonor = requestData.confirmedBy === currentUser.uid || isDonorsAcceptedMap || isLegacyAccepted;
    if (!isRequester && !isDonor) {
        return <div className="container" style={{ padding: '2rem' }}>You do not have access to this communication room.</div>;
    }

    const otherName = isRequester ? requestData.donorName || 'Donor' : requestData.patientName || 'Patient';
    const roomName = `lifeline-108-secure-call-${id}`;

    return (
        <div className="container" style={{ padding: '2rem 0', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Secure Room</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Connected with: <strong>{otherName}</strong></p>
                </div>
                <div>
                    <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>&larr; Back</button>
                </div>
            </div>

            {/* Mobile View Toggles */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('call')}
                    className={`btn ${activeTab === 'call' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                >
                    📞 Secure Call
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                >
                    💬 Secure Chat
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '1.5rem', overflow: 'hidden', flexDirection: window.innerWidth > 768 ? 'row' : 'column' }}>

                {/* VIDEO CALL SECTION */}
                {(activeTab === 'both' || activeTab === 'call') && (
                    <div style={{ flex: 2, background: '#111', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '0.8rem', background: '#222', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#4caf50', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                            Video/Audio Feed
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <JitsiMeeting
                                domain="meet.jit.si"
                                roomName={roomName}
                                configOverwrite={{
                                    startWithAudioMuted: false,
                                    startWithVideoMuted: true,
                                    disableModeratorIndicator: true,
                                    startScreenSharing: false,
                                    enableEmailInStats: false,
                                    prejoinPageEnabled: false,
                                    disableDeepLinking: true,
                                    requireDisplayName: false
                                }}
                                interfaceConfigOverwrite={{
                                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                                    SHOW_JITSI_WATERMARK: false,
                                    SHOW_WATERMARK_FOR_GUESTS: false,
                                    SHOW_BRAND_WATERMARK: false,
                                    DEFAULT_BACKGROUND: '#111',
                                    DEFAULT_LOGO_URL: '',
                                    HIDE_INVITE_MORE_HEADER: true
                                }}
                                userInfo={{
                                    displayName: isRequester ? 'Patient / Requester' : 'Donor / Hero',
                                    email: ''
                                }}
                                getIFrameRef={(iframeRef) => {
                                    iframeRef.style.height = '100%';
                                    iframeRef.style.width = '100%';
                                    iframeRef.style.border = 'none';
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* CHAT SECTION */}
                {(activeTab === 'both' || activeTab === 'chat') && (
                    <div style={{ flex: 1, background: 'white', border: '1px solid #eee', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid #eee', background: '#fcfcfc', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Direct Messages</h3>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {messages.length === 0 && (
                                <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '2rem', fontSize: '0.9rem' }}>
                                    Your phone numbers are hidden. Please communicate here securely.
                                </p>
                            )}
                            {messages.map(msg => {
                                const isMe = msg.senderId === currentUser.uid;

                                const renderText = (text: string) => {
                                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                                    return text.split(urlRegex).map((part, i) => {
                                        if (part.match(urlRegex)) {
                                            return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: isMe ? 'white' : '#1976d2', textDecoration: 'underline', fontWeight: 'bold' }}>{part.includes('maps') ? '📍 View Location on Map' : part}</a>;
                                        }
                                        return part;
                                    });
                                };

                                return (
                                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', background: isMe ? '#d32f2f' : '#f5f5f5', color: isMe ? 'white' : 'black', padding: '0.6rem 1rem', borderRadius: '16px', maxWidth: '85%', borderBottomRightRadius: isMe ? '0' : '16px', borderBottomLeftRadius: isMe ? '16px' : '0', fontSize: '0.9rem', wordBreak: 'break-word' }}>
                                        {renderText(msg.text)}
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', padding: '0.8rem', borderTop: '1px solid #eee', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={handleShareLocation}
                                title="Share Location"
                                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.5rem', color: '#1976d2' }}
                            >
                                📍
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ borderRadius: '20px', padding: '0 1rem' }}>Send</button>
                        </form>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
                }
            `}</style>
        </div>
    );
};

export default Contact;
