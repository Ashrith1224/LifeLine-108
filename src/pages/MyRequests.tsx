import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { jsPDF } from "jspdf";
import { LOGO_BASE64 } from '../assets/logoBase64';
import DashboardFeed from '../components/DashboardFeed';
import { Link } from 'react-router-dom';

const MyRequests = () => {
    const { currentUser, userProfile } = useAuth();
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [donationHistory, setDonationHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'requests' | 'impact' | 'emergencies'>(userProfile?.role === 'donor' ? 'emergencies' : 'requests');

    // Confirmation State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedReqForConfirm, setSelectedReqForConfirm] = useState<any>(null);
    const [donorSearchTerm, setDonorSearchTerm] = useState('');
    const [foundDonors, setFoundDonors] = useState<any[]>([]);
    const [selectedDonorId, setSelectedDonorId] = useState('');

    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        // 1. Listen to requests created by current user
        const qMyRequests = query(
            collection(db, 'requests'),
            where('requesterId', '==', currentUser.uid)
        );

        const unsubRequests = onSnapshot(qMyRequests, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((d) => {
                const r = d.data();
                list.push({
                    id: d.id,
                    ...r,
                    patientName: r.patientName || r.patient_name,
                    bloodGroup: r.bloodGroup || r.blood_group,
                    requesterId: r.requesterId || r.requester_id,
                    targetedDonorId: r.targetedDonorId || r.targeted_donor_id,
                    createdAt: r.createdAt || r.created_at,
                    donorId: r.donorId || r.donor_id,
                    donorName: r.donorName || r.donor_name,
                    donorPhone: r.donorPhone || r.donor_phone,
                    completedAt: r.completedAt || r.completed_at,
                    acceptedBy: r.acceptedBy || r.accepted_by,
                    acceptedAt: r.acceptedAt || r.accepted_at,
                    confirmedBy: r.confirmedBy || r.confirmed_by,
                    donorContact: r.donorContact || r.donor_contact,
                    acceptedDonors: r.acceptedDonors || r.accepted_donors || {}
                });
            });
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setMyRequests(list);
            setLoading(false);
        }, (err) => {
            console.error("Error listening to my requests:", err);
            setLoading(false);
        });

        // 2. Listen to donation history (fulfilled requests)
        const qMyImpact = query(
            collection(db, 'requests'),
            where('donorId', '==', currentUser.uid),
            where('status', '==', 'fulfilled')
        );

        const unsubImpact = onSnapshot(qMyImpact, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((d) => {
                const r = d.data();
                list.push({
                    id: d.id,
                    ...r,
                    patientName: r.patientName || r.patient_name,
                    bloodGroup: r.bloodGroup || r.blood_group,
                    requesterId: r.requesterId || r.requester_id,
                    targetedDonorId: r.targetedDonorId || r.targeted_donor_id,
                    createdAt: r.createdAt || r.created_at,
                    donorId: r.donorId || r.donor_id,
                    donorName: r.donorName || r.donor_name,
                    donorPhone: r.donorPhone || r.donor_phone,
                    completedAt: r.completedAt || r.completed_at,
                    acceptedBy: r.acceptedBy || r.accepted_by,
                    acceptedAt: r.acceptedAt || r.accepted_at,
                    confirmedBy: r.confirmedBy || r.confirmed_by,
                    donorContact: r.donorContact || r.donor_contact,
                    acceptedDonors: r.acceptedDonors || r.accepted_donors || {}
                });
            });
            list.sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());
            setDonationHistory(list);
        }, (err) => {
            console.error("Error listening to impact:", err);
        });

        return () => {
            unsubRequests();
            unsubImpact();
        };
    }, [currentUser]);

    // Search Donors for Confirmation
    useEffect(() => {
        if (showConfirmModal) {
            const searchDonors = async () => {
                try {
                    const q = query(
                        collection(db, 'profiles'),
                        where('role', '==', 'donor')
                    );
                    const snapshot = await getDocs(q);
                    const list: any[] = [];
                    snapshot.forEach((docSnap) => {
                        const d = docSnap.data();
                        const name = d.name || '';
                        const phone = d.phone || '';
                        if (!donorSearchTerm || name.toLowerCase().includes(donorSearchTerm.toLowerCase()) || phone.includes(donorSearchTerm)) {
                            list.push({
                                id: docSnap.id,
                                ...d,
                                bloodGroup: d.bloodGroup || d.blood_group
                            });
                        }
                    });
                    setFoundDonors(list);
                } catch (e) {
                    console.error("Error searching donors:", e);
                }
            };
            const debounce = setTimeout(searchDonors, 400);
            return () => clearTimeout(debounce);
        }
    }, [donorSearchTerm, showConfirmModal]);

    const generateCertificate = (donation: any) => {
        const doc = new jsPDF({ orientation: "landscape" });
        const width = 297;
        const height = 210;

        // Background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, width, height, 'F');

        // Certificate Borders
        doc.setDrawColor(211, 47, 47);
        doc.setLineWidth(5);
        doc.rect(10, 10, width - 20, height - 20);

        doc.setDrawColor(255, 167, 38);
        doc.setLineWidth(1.5);
        doc.rect(14, 14, width - 28, height - 28);

        // Logo
        if (LOGO_BASE64) {
            doc.addImage(LOGO_BASE64, 'PNG', width / 2 - 18, 20, 36, 36);
        }

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.setTextColor(211, 47, 47);
        doc.text("CERTIFICATE OF APPRECIATION", width / 2, 68, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text("PROUDLY PRESENTED TO", width / 2, 78, { align: "center" });

        // Donor Name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(33, 33, 33);
        const donorName = donation.donorName || userProfile?.name || currentUser?.displayName || "Life Saver";
        doc.text(donorName.toUpperCase(), width / 2, 92, { align: "center" });

        // Decorative Line
        doc.setDrawColor(211, 47, 47);
        doc.setLineWidth(0.8);
        doc.line(width / 2 - 60, 96, width / 2 + 60, 96);

        // Appreciation text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(13);
        doc.setTextColor(60, 60, 60);
        const dateStr = donation.completedAt ? new Date(donation.completedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently";
        doc.text(
            `In recognition of your noble and selfless blood donation for ${donation.patientName || 'a patient in need'}\non ${dateStr} at ${donation.hospital || 'Hospital'}, saving a precious life.`,
            width / 2,
            110,
            { align: "center", lineHeightFactor: 1.4 }
        );

        // Blood Group Badge
        doc.setFillColor(255, 235, 238);
        doc.roundedRect(width / 2 - 30, 126, 60, 18, 4, 4, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(211, 47, 47);
        doc.text(`Blood Group: ${donation.bloodGroup || 'Hero'}`, width / 2, 138, { align: "center" });

        // Signatures
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.5);
        doc.line(40, 175, 95, 175);
        doc.line(width - 95, 175, width - 40, 175);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text("LifeLine-108 Authority", 67, 182, { align: "center" });
        doc.text("Verified Medical Officer", width - 67, 182, { align: "center" });

        // Footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(140, 140, 140);
        doc.text("Verified by LifeLine-108 • Certified Emergency Blood Network", width / 2, 195, { align: "center" });

        doc.save(`LifeLine_Certificate_${donation.patientName || 'Hero'}.pdf`);
    };

    async function handleConfirmFulfillment() {
        if (!selectedDonorId || !selectedReqForConfirm) return;
        const donor = foundDonors.find(d => d.id === selectedDonorId);
        if (!donor) return;

        try {
            await updateDoc(doc(db, 'requests', selectedReqForConfirm.id), {
                status: 'fulfilled',
                donorId: donor.id,
                donorName: donor.name,
                donorPhone: donor.phone || '',
                completedAt: new Date().toISOString()
            });

            alert("Confirmed! Thank you for updating.");
            setShowConfirmModal(false);
            setSelectedReqForConfirm(null);
            setSelectedDonorId('');
        } catch (e) {
            console.error(e);
            alert("Error updating request.");
        }
    }

    async function handleCancelRequest(reqId: string) {
        if (!window.confirm("Are you sure you want to cancel and delete this emergency request? This action cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, 'requests', reqId));
            alert("Request successfully cancelled and removed.");
        } catch (e) {
            console.error('Error canceling request:', e);
            alert("Failed to cancel request.");
        }
    }

    async function handleRejectDonor(reqId: string) {
        if (!window.confirm("Are you sure you want to cancel the donor(s)? The request will go back to searching for new donors.")) return;
        try {
            await updateDoc(doc(db, 'requests', reqId), {
                status: 'pending',
                acceptedBy: null,
                acceptedAt: null,
                confirmedBy: null,
                donorContact: null,
                acceptedDonors: {}
            });
            alert("Donor(s) cancelled successfully. Re-opened for new donors.");
        } catch (e) {
            console.error('Error rejecting donor:', e);
            alert("Failed to cancel donor.");
        }
    }

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading Activity...</div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: '#d32f2f', margin: 0 }}>My Activity</h1>
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #ddd', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('requests')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'requests' ? '3px solid var(--primary)' : 'none',
                        fontWeight: activeTab === 'requests' ? 'bold' : 'normal',
                        color: activeTab === 'requests' ? 'var(--primary)' : '#666',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    My Requests
                </button>
                {userProfile?.role === 'donor' && (
                    <button
                        onClick={() => setActiveTab('impact')}
                        style={{
                            padding: '1rem 2rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'impact' ? '3px solid var(--primary)' : 'none',
                            fontWeight: activeTab === 'impact' ? 'bold' : 'normal',
                            color: activeTab === 'impact' ? 'var(--primary)' : '#666',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Your Impact 🩸
                    </button>
                )}
                {userProfile?.role === 'donor' && (
                    <button
                        onClick={() => setActiveTab('emergencies')}
                        style={{
                            padding: '1rem 2rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'emergencies' ? '3px solid var(--primary)' : 'none',
                            fontWeight: activeTab === 'emergencies' ? 'bold' : 'normal',
                            color: activeTab === 'emergencies' ? 'var(--primary)' : '#666',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Local Emergencies
                    </button>
                )}
            </div>

            {/* CONTENT: EMERGENCIES (DONORS ONLY) */}
            {activeTab === 'emergencies' && userProfile?.role === 'donor' && (
                <div style={{ paddingBottom: '2rem' }}>
                    <DashboardFeed role={userProfile.role} city={userProfile.city} userState={userProfile.state} userId={currentUser.uid} userBloodGroup={userProfile.bloodGroup} donorPhone={userProfile.phone} />
                </div>
            )}

            {/* CONTENT: REQUESTS */}
            {activeTab === 'requests' && (
                <>
                    {myRequests.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                            <p>You haven't made any emergency requests yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {myRequests.map(req => {
                                const fiveMins = 5 * 60 * 1000;
                                const activeDonors = Object.values(req.acceptedDonors || {}).filter(t => now - (t as number) < fiveMins);
                                const hasActiveDonors = activeDonors.length > 0;
                                const isLegacyAccepted = req.status === 'accepted' && req.acceptedAt && (now - req.acceptedAt < fiveMins);
                                const isAccepted = req.status === 'accepted' || (req.status === 'pending' && hasActiveDonors) || isLegacyAccepted;
                                const isConfirmed = req.status === 'confirmed';
                                const isFulfilled = req.status === 'fulfilled';

                                const statusColor = isFulfilled ? 'green' : (isAccepted || isConfirmed) ? '#1976d2' : 'orange';
                                const statusBg = isFulfilled ? '#e8f5e9' : (isAccepted || isConfirmed) ? '#e3f2fd' : '#fff3e0';
                                const statusText = isConfirmed ? 'DONOR CONFIRMED' : isAccepted ? 'DONOR ACCEPTED (WAITING CONFIRM)' : req.status.toUpperCase();

                                return (
                                    <div key={req.id} className="card" style={{ borderLeft: `6px solid ${statusColor}`, position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.5rem 0' }}>Patient: {req.patientName}</h3>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#555' }}>
                                                    <strong>Hospital:</strong> {req.hospital}, {req.city || req.state}
                                                </p>
                                                <p style={{ margin: '0 0 0.5rem 0', color: '#555' }}>
                                                    <strong>Blood Group:</strong> <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{req.bloodGroup}</span> | <strong>Urgency:</strong> {req.urgency}
                                                </p>
                                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#888' }}>
                                                    Created on: {new Date(req.createdAt).toLocaleString()}
                                                </p>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ background: statusBg, color: statusColor, padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', display: 'inline-block' }}>
                                                    {statusText}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            {(isAccepted || isConfirmed) && (
                                                <Link to={`/contact/${req.id}`} className="btn btn-primary" style={{ background: '#1976d2', borderColor: '#1976d2', fontSize: '0.9rem' }}>
                                                    💬 Secure Room with Donor
                                                </Link>
                                            )}

                                            {!isFulfilled && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReqForConfirm(req);
                                                            setShowConfirmModal(true);
                                                        }}
                                                        className="btn btn-primary"
                                                        style={{ background: '#2e7d32', borderColor: '#2e7d32', fontSize: '0.9rem' }}
                                                    >
                                                        ✅ Mark as Fulfilled
                                                    </button>
                                                    {(isAccepted || isConfirmed) && (
                                                        <button
                                                            onClick={() => handleRejectDonor(req.id)}
                                                            className="btn btn-outline"
                                                            style={{ borderColor: 'orange', color: '#e65100', fontSize: '0.9rem' }}
                                                        >
                                                            🔄 Cancel Donor & Re-open
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleCancelRequest(req.id)}
                                                        className="btn btn-outline"
                                                        style={{ borderColor: '#d32f2f', color: '#d32f2f', fontSize: '0.9rem' }}
                                                    >
                                                        ❌ Cancel Request
                                                    </button>
                                                </>
                                            )}

                                            {isFulfilled && req.donorName && (
                                                <div style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                                    Fulfilled by: {req.donorName} ({req.donorPhone})
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* CONTENT: IMPACT (DONATION HISTORY) */}
            {activeTab === 'impact' && userProfile?.role === 'donor' && (
                <div>
                    {donationHistory.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                            <p>No fulfilled donations recorded yet. When a requester marks you as their hero, your certificate will appear here!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {donationHistory.map(item => (
                                <div key={item.id} className="card" style={{ borderLeft: '6px solid #2e7d32', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#2e7d32' }}>🎉 Life Saved: {item.patientName}</h3>
                                        <p style={{ margin: '0 0 0.3rem 0', color: '#555' }}><strong>Hospital:</strong> {item.hospital}</p>
                                        <p style={{ margin: '0 0 0.3rem 0', color: '#555' }}><strong>Blood Group:</strong> {item.bloodGroup}</p>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>Fulfilled on: {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => generateCertificate(item)}
                                            className="btn btn-primary"
                                            style={{ background: '#2e7d32', borderColor: '#2e7d32', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            📜 Download Appreciation Certificate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: MARK FULFILLED */}
            {showConfirmModal && selectedReqForConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, color: '#2e7d32' }}>Confirm Blood Donation Fulfillment</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>
                            Select the registered donor who donated blood for <strong>{selectedReqForConfirm.patientName}</strong> so they receive their official appreciation certificate.
                        </p>

                        <input
                            type="text"
                            placeholder="Search donor by name or phone..."
                            value={donorSearchTerm}
                            onChange={e => setDonorSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '1rem' }}
                        />

                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', marginBottom: '1.5rem', padding: '0.5rem' }}>
                            {foundDonors.length === 0 ? (
                                <p style={{ color: '#888', textAlign: 'center', margin: '1rem 0' }}>No donors found</p>
                            ) : (
                                foundDonors.map(donor => (
                                    <div
                                        key={donor.id}
                                        onClick={() => setSelectedDonorId(donor.id)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            background: selectedDonorId === donor.id ? '#e8f5e9' : 'transparent',
                                            border: selectedDonorId === donor.id ? '1px solid #2e7d32' : '1px solid transparent',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.3rem'
                                        }}
                                    >
                                        <div>
                                            <strong>{donor.name}</strong> ({donor.bloodGroup})<br />
                                            <small style={{ color: '#666' }}>{donor.city || donor.state}</small>
                                        </div>
                                        {selectedDonorId === donor.id && <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ Selected</span>}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setSelectedReqForConfirm(null);
                                    setSelectedDonorId('');
                                }}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!selectedDonorId}
                                onClick={handleConfirmFulfillment}
                                className="btn btn-primary"
                                style={{ background: '#2e7d32', borderColor: '#2e7d32' }}
                            >
                                Confirm & Award Certificate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyRequests;
