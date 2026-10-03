import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';

const DashboardFeed = ({ role, city, userState, userId, userBloodGroup, donorPhone }: { role: string, city: string, userState?: string, userId: string, userBloodGroup?: string, donorPhone?: string }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(() => !!(city || userState) && role === 'donor');
    const [prevDeps, setPrevDeps] = useState({ role, city, userState, userId, userBloodGroup });

    if (
        role !== prevDeps.role ||
        city !== prevDeps.city ||
        userState !== prevDeps.userState ||
        userId !== prevDeps.userId ||
        userBloodGroup !== prevDeps.userBloodGroup
    ) {
        setPrevDeps({ role, city, userState, userId, userBloodGroup });
        setLoading(role === 'donor' && !!(city || userState));
    }

    useEffect(() => {
        if (!city && !userState) {
            return;
        }
        if (role !== 'donor') {
            return;
        }

        const q = query(
            collection(db, 'requests'),
            where('status', 'in', ['pending', 'accepted', 'confirmed'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((docSnap) => {
                const r = docSnap.data();
                const bR = r.bloodGroup || r.blood_group;
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
                const requesterId = r.requesterId || r.requester_id;
                const targetedDonorId = r.targetedDonorId || r.targeted_donor_id;

                if (requesterId !== userId && isLocationMatch && isCompatible) {
                    if (targetedDonorId && targetedDonorId !== userId) return;
                    list.push({
                        id: docSnap.id,
                        ...r,
                        patientName: r.patientName || r.patient_name,
                        bloodGroup: bR,
                        requesterId: requesterId,
                        targetedDonorId: targetedDonorId,
                        createdAt: r.createdAt || r.created_at,
                        donorId: r.donorId || r.donor_id,
                        donorName: r.donorName || r.donor_name,
                        donorPhone: r.donorPhone || r.donor_phone,
                        completedAt: r.completedAt || r.completed_at,
                        acceptedBy: r.acceptedBy || r.accepted_by,
                        acceptedAt: r.acceptedAt || r.accepted_at,
                        confirmedBy: r.confirmedBy || r.confirmed_by,
                        donorContact: r.donorContact || r.donor_contact,
                        acceptedDonors: r.acceptedDonors || r.accepted_donors || {},
                        isCompatible,
                        isLocationMatch
                    });
                }
            });
            setItems(list);
            setLoading(false);
        }, (err) => {
            console.error("DashboardFeed onSnapshot error:", err);
            setLoading(false);
        });

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
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const i = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(i);
    }, []);

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

    let timeLeft = '';
    if (computedStatus === 'accepted' && myAcceptTime) {
        const remaining = myAcceptTime + fiveMins - now;
        if (remaining <= 0) {
            timeLeft = 'Expired';
        } else {
            const m = Math.floor(remaining / 60000);
            const s = Math.floor((remaining % 60000) / 1000);
            timeLeft = `${m}:${s < 10 ? '0' : ''}${s}`;
        }
    }

    const handleAccept = async () => {
        try {
            const updatedDonors = { ...item.acceptedDonors, [userId]: Date.now() };
            await updateDoc(doc(db, 'requests', item.id), {
                acceptedDonors: updatedDonors
            });
        } catch (e) {
            console.error('Failed to accept:', e);
            alert('Failed to accept. Please try again.');
        }
    };

    const handleConfirm = async () => {
        try {
            await updateDoc(doc(db, 'requests', item.id), {
                status: 'confirmed',
                confirmedBy: userId,
                donorContact: donorPhone || null
            });
        } catch (e) {
            console.error('Error confirming:', e);
        }
    };

    const handleCancel = async () => {
        try {
            if (isLegacyAccepted) {
                await updateDoc(doc(db, 'requests', item.id), {
                    status: 'pending',
                    acceptedBy: null,
                    acceptedAt: null
                });
            } else {
                const updatedDonors = { ...item.acceptedDonors };
                delete updatedDonors[userId];
                await updateDoc(doc(db, 'requests', item.id), {
                    acceptedDonors: updatedDonors
                });
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
            await updateDoc(doc(db, 'requests', item.id), {
                status: 'pending',
                confirmedBy: null,
                donorContact: null,
                acceptedBy: null,
                acceptedAt: null,
                acceptedDonors: updatedDonors
            });
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
