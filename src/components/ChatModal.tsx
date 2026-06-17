import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

interface ChatModalProps {
    requestId: string;
    currentUserId: string;
    closeModal: () => void;
    otherName: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ requestId, currentUserId, closeModal, otherName }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('request_id', requestId)
                .order('created_at', { ascending: true });
            if (data && !error) {
                setMessages(data.map(m => ({
                    ...m,
                    senderId: m.sender_id,
                    createdAt: m.created_at
                })));
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
        };

        fetchMessages();

        const channel = supabase
            .channel(`chat-${requestId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` }, () => {
                fetchMessages();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [requestId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const { error } = await supabase.from('messages').insert({
                request_id: requestId,
                text: newMessage,
                sender_id: currentUserId,
                created_at: Date.now()
            });
            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', height: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Secure Chat with {otherName}</h3>
                    <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>&times;</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', padding: '0.5rem' }}>
                    {messages.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '2rem' }}>
                            Your phone numbers are hidden for privacy. Please communicate here securely.
                        </p>
                    )}
                    {messages.map(msg => {
                        const isMe = msg.senderId === currentUserId;
                        return (
                            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', background: isMe ? '#d32f2f' : '#f5f5f5', color: isMe ? 'white' : 'black', padding: '0.6rem 1rem', borderRadius: '16px', maxWidth: '80%', borderBottomRightRadius: isMe ? '0' : '16px', borderBottomLeftRadius: isMe ? '16px' : '0' }}>
                                {msg.text}
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{ flex: 1, padding: '0.8rem', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: '20px', padding: '0 1.2rem' }}>Send</button>
                </form>
            </div>
        </div>
    );
};

export default ChatModal;
