import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';

const DashboardFeed = ({ role, city, userState, userId, userBloodGroup, donorPhone }: { role: string, city: string, userState?: string, userId: string, userBloodGroup?: string, donorPhone?: string }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!city && !userState) {
            setLoading(false);
            return;
        }

        let unsubscribe = () => { };

        setLoading(true);
        if (role === 'donor') {
            const fetchNearbyRequests = async () => {
                const { data, error } = await supabase
                    .from('requests')
                    .select('*')
                    .in('status', ['pending', 'accepted', 'confirmed']);

                if (data && !error) {
                    const list: any[] = [];
                    data.forEach((r: any) => {
                        const bR = r.blood_group;
                        const bD = userBloodGroup;
                        let isCompatible = false;
                        if (bD === 'O-') isCompatible = true;
                        else if (bD === 'O+' && ['A+', 'B+', 'AB+', 'O+'].includes(bR)) isCompatible = true;
                        else if (bD === 'A-' && ['A+', 'A-', 'AB+', 'AB-'].includes(bR)) isCompatible = true;
                        else if (bD === 'A+' && ['A+', 'AB+'].includes(bR)) isCompatible = true;
                        else if (bD === 'B-' && ['B+', 'B-', 'AB+', 'AB-'].includes(bR)) isCompatible = true;
                        else if (bD === 'B+' && ['B+', 'AB+'].includes(bR)) isCompatible = true;
                        else if (bD === 'AB-' && ['AB+', 'AB-'].includes(bR)) isCompatible = true;
                        else if (bD === 'AB+' && bR === 'AB+') isCompatible = true;

                        const isLocationMatch = (r.state && userState) ? (r.state === userState) : (r.city && city && r.city.toLowerCase() === city.toLowerCase());

                        if (r.requester_id !== userId && isLocationMatch && isCompatible) {
                            if (r.targeted_donor_id && r.targeted_donor_id !== userId) return;
                            list.push({
                                ...r,
                                patientName: r.patient_name,
                                bloodGroup: r.blood_group,
                                requesterId: r.requester_id,
                                targetedDonorId: r.targeted_donor_id,
                                createdAt: r.created_at,
                                donorId: r.donor_id,
                                donorName: r.donor_name,
                                donorPhone: r.donor_phone,
                                completedAt: r.completed_at,
                                acceptedBy: r.accepted_by,
                                acceptedAt: r.accepted_at,
                                confirmedBy: r.confirmed_by,
                                donorContact: r.donor_contact,
                                acceptedDonors: r.accepted_donors,
                                isCompatible,
                                isLocationMatch
                            });
                        }
                    });
                    setItems(list);
                }
                setLoading(false);
            };

            fetchNearbyRequests();

            const channel = supabase
                .channel('nearby-requests-channel')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
                    fetchNearbyRequests();
                })
                .subscribe();

            unsubscribe = () => {
                channel.unsubscribe();
            };
        } else {
            setItems([]);
            setLoading(false);
        }

        return () => unsubscribe();
    }, [role, city, userState, userId, userBloodGroup]);

    if (loading) return <div>Loading nearby activity...</div>;

    if (!city && !userState) return <div style={{ color: '#888' }}>Please update your profile with a State/City to see nearby activity.</div>;

    let displayItems = items;
    if (role === 'donor') {
        displayItems = items.filter((item: any) => {
            if (item.status === 'confirmed' && item.confirmedBy !== userId) return false;
            if (item.status === 'accepted' && item.acceptedBy !== userId) return false;
            return true;
        });
    }

    if (role !== 'donor') return null;
    if (displayItems.length === 0) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {displayItems.map((item: any) => (
                <RequestCard key={item.id} item={item} userId={userId} donorPhone={donorPhone} userBloodGroup={userBloodGroup} />
            ))}
        </div>
    );
};

export default DashboardFeed;

const RequestCard = ({ item, userId, donorPhone, userBloodGroup }: { item: any, userId: string, donorPhone?: string, userBloodGroup?: string }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [ticker, setTicker] = useState(0);

    useEffect(() => {
        const i = setInterval(() => setTicker((t: number) => t + 1), 1000);
        return () => clearInterval(i);
    }, []);

    const now = Date.now();
    const fiveMins = 5 * 60 * 1000;

    const isLegacyAccepted = item.status === 'accepted' && item.acceptedBy === userId;
    const myAcceptTime = item.acceptedDonors?.[userId] || (isLegacyAccepted ? item.acceptedAt : null);
    const isMyAcceptExpired = myAcceptTime && (now - myAcceptTime > fiveMins);

    let computedStatus = item.status;
    if (item.status === 'pending') {
        if (myAcceptTime && !isMyAcceptExpired) computedStatus = 'accepted';
    } else if (item.status === 'confirmed') {
        computedStatus = item.confirmedBy === userId ? 'confirmed' : 'hidden';
    } else if (item.status === 'accepted') {
        if (isLegacyAccepted) {
            computedStatus = isMyAcceptExpired ? 'pending' : 'accepted';
        } else {
            computedStatus = 'hidden';
        }
    }

    useEffect(() => {
        if (isMyAcceptExpired && item.status === 'pending' && item.acceptedDonors?.[userId]) {
            const updatedDonors = { ...item.acceptedDonors };
            delete updatedDonors[userId];
            supabase.from('requests').update({
                accepted_donors: updatedDonors
            }).eq('id', item.id).then(({ error }) => { if (error) console.error(error); });
        } else if (isMyAcceptExpired && isLegacyAccepted) {
            supabase.from('requests').update({
                status: 'pending',
                accepted_by: null,
                accepted_at: null
            }).eq('id', item.id).then(({ error }) => { if (error) console.error(error); });
        }
    }, [isMyAcceptExpired, item.status, isLegacyAccepted, item.id, userId, item.acceptedDonors]);

    useEffect(() => {
        if (computedStatus === 'accepted' && myAcceptTime) {
            const remaining = myAcceptTime + fiveMins - now;
            if (remaining <= 0) {
                setTimeLeft('Expired');
            } else {
                const m = Math.floor(remaining / 60000);
                const s = Math.floor((remaining % 60000) / 1000);
                setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
            }
        }
    }, [ticker, computedStatus, myAcceptTime, now, fiveMins]);

    const handleAccept = async () => {
        try {
            const updatedDonors = { ...item.acceptedDonors, [userId]: Date.now() };
            const { error } = await supabase
                .from('requests')
                .update({
                    accepted_donors: updatedDonors
                })
                .eq('id', item.id);
            if (error) throw error;
        } catch (e) {
            console.error('Failed to accept:', e);
            alert('Failed to accept. Please try again.');
        }
    };

    const handleConfirm = async () => {
        try {
            const { error } = await supabase
                .from('requests')
                .update({
                    status: 'confirmed',
                    confirmed_by: userId,
                    donor_contact: donorPhone || null
                })
                .eq('id', item.id);
            if (error) throw error;
        } catch (e) {
            console.error('Error confirming:', e);
        }
    };

    const handleCancel = async () => {
        try {
            if (isLegacyAccepted) {
                await supabase
                    .from('requests')
                    .update({
                        status: 'pending',
                        accepted_by: null,
                        accepted_at: null
                    })
                    .eq('id', item.id);
            } else {
                const updatedDonors = { ...item.acceptedDonors };
                delete updatedDonors[userId];
                await supabase
                    .from('requests')
                    .update({
                        accepted_donors: updatedDonors
                    })
                    .eq('id', item.id);
            }
        } catch (e) {
            console.error('Error canceling:', e);
        }
    };

    const handleCancelConfirmation = async () => {
        if (!window.confirm("Are you sure you want to cancel your confirmation? The patient will be notified.")) return;
        try {
            const updatedDonors = { ...item.acceptedDonors };
            delete updatedDonors[userId];
            await supabase
                .from('requests')
                .update({
                    status: 'pending',
                    confirmed_by: null,
                    donor_contact: null,
                    accepted_by: null,
                    accepted_at: null,
                    accepted_donors: updatedDonors
                })
                .eq('id', item.id);
        } catch (e) {
            console.error('Error canceling confirmation:', e);
        }
    };

    if (computedStatus === 'hidden') return null;

    return (
        <div className="card" style={{ padding: '1.5rem', borderLeft: `4px solid #d32f2f` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, color: '#d32f2f' }}>URGENT: {item.bloodGroup}</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {item.targetedDonorId === userId && (
                        <span style={{ fontSize: '0.8rem', background: '#e3f2fd', padding: '2px 8px', borderRadius: '4px', color: '#1976d2', fontWeight: 'bold' }}>🎯 DIRECT FOR YOU</span>
                    )}
                    <span style={{ fontSize: '0.8rem', background: '#ffebee', padding: '2px 8px', borderRadius: '4px', color: '#c62828' }}>{item.urgency}</span>
                </div>
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{item.hospital}</p>
            <p style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 1rem 0' }}>Patient: {item.patientName}</p>

            {computedStatus === 'pending' && (
                <>
                    {!item.isCompatible && (
                        <div style={{ background: '#ffebee', color: '#c62828', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold', textAlign: 'center' }}>
                            ⚠️ Warning: Your blood ({userBloodGroup}) is not an exact match for {item.bloodGroup}.
                        </div>
                    )}
                    <p style={{ fontSize: '0.85rem', color: '#666', background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginBottom: '0.5rem' }}>
                        🔒 Contact hidden. Accept to view details and call patient.
                    </p>
                    <button onClick={handleAccept} className="btn btn-primary" style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem', marginTop: '0.5rem' }}>
                        Accept Request
                    </button>
                </>
            )}

            {computedStatus === 'accepted' && (
                <div style={{ background: '#fff9c4', padding: '1rem', borderRadius: '8px', border: '1px solid #fbc02d', marginTop: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#f57f17' }}>⏱ Respond within: {timeLeft}</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: '#333' }}>Step 2: Message the patient to confirm dispatch securely. System auto-cancels if time expires.</p>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Link to={`/contact/${item.id}`} className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem', background: '#333', color: 'white', display: 'flex', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                            💬 Open Secure Room
                        </Link>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleConfirm} className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}>I Confirm I'm Going</button>
                        <button onClick={handleCancel} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem' }}>Cancel</button>
                    </div>
                </div>
            )}

            {computedStatus === 'confirmed' && (
                <div style={{ background: '#e8f5e9', padding: '1rem', borderRadius: '8px', border: '1px solid #c8e6c9', marginTop: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#2e7d32' }}>✅ You are confirmed. Proceed to hospital.</p>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/contact/${item.id}`} className="btn btn-primary" style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem', background: '#2e7d32', color: 'white', display: 'flex', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                            💬 Enter Secure Room
                        </Link>
                        <button onClick={handleCancelConfirmation} className="btn" style={{ background: '#f5f5f5', color: '#d32f2f', border: '1px solid #d32f2f', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
