import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
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

    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);
        let unsubRequests = () => { };
        let unsubImpact = () => { };

        const fetchMyRequests = async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('requester_id', currentUser.uid);
            if (data && !error) {
                const mapped = data.map(r => ({
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
                    acceptedDonors: r.accepted_donors
                }));
                setMyRequests(mapped.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
            setLoading(false);
        };

        const fetchMyImpact = async () => {
            const { data, error } = await supabase
                .from('requests')
                .select('*')
                .eq('donor_id', currentUser.uid)
                .eq('status', 'fulfilled');
            if (data && !error) {
                const mapped = data.map(r => ({
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
                    acceptedDonors: r.accepted_donors
                }));
                setDonationHistory(mapped.sort((a: any, b: any) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()));
            }
        };

        try {
            fetchMyRequests();
            fetchMyImpact();

            const channelReq = supabase
                .channel('my-requests-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
                    fetchMyRequests();
                    fetchMyImpact();
                })
                .subscribe();

            unsubRequests = () => {
                channelReq.unsubscribe();
            };
        } catch (err) {
            console.error("Error fetching data:", err);
            setLoading(false);
        }

        return () => {
            unsubRequests();
            unsubImpact();
        };
    }, [currentUser]);

    // Search Donors for Confirmation
    useEffect(() => {
        if (showConfirmModal) {
            const searchDonors = async () => {
                if (!donorSearchTerm) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('role', 'donor');
                    if (data && !error) {
                        setFoundDonors(data.map(d => ({
                            ...d,
                            bloodGroup: d.blood_group
                        })));
                    }
                    return;
                }
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'donor')
                    .or(`name.ilike.%${donorSearchTerm}%,phone.like.%${donorSearchTerm}%`);
                if (data && !error) {
                    setFoundDonors(data.map(d => ({
                        ...d,
                        bloodGroup: d.blood_group
                    })));
                }
            };
            const debounce = setTimeout(searchDonors, 500);
            return () => clearTimeout(debounce);
        }
    }, [donorSearchTerm, showConfirmModal]);

    const generateCertificate = (donation: any) => {
        // Landscape orientation for a real certificate feel
        const doc = new jsPDF({ orientation: "landscape" });
        const width = 297;
        const height = 210;

        // --- 1. Background ---
        doc.setFillColor(255, 255, 255); // Pure white background to blend logo perfectly
        doc.rect(0, 0, width, height, 'F');

        // Background watermarked logo
        try {
            doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
            doc.addImage(LOGO_BASE64, 'PNG', width / 2 - 110, height / 2 - 100, 220, 220);
            doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
        } catch (e) {
            console.warn('opacity unsupported, skipping background logo', e);
        }

        // Watermark
        doc.setFontSize(120);
        doc.setTextColor(245, 240, 230); // Very light grey/cream
        doc.setFont("helvetica", "bold");
        doc.text("LIFELINE-108", 40, height - 40, { angle: 30 });

        // --- 2. Borders ---
        // Outer dark border (Navy Blue / Deep Slate)
        doc.setLineWidth(2);
        doc.setDrawColor(30, 41, 59);
        doc.rect(15, 15, width - 30, height - 30);

        // Inner thin elegant border (Gold-ish)
        doc.setLineWidth(0.5);
        doc.setDrawColor(180, 140, 80);
        doc.rect(18, 18, width - 36, height - 36);

        // Corner accents (Crimson thick lines)
        doc.setLineWidth(4);
        const accentColor = [169, 29, 58]; // Crimson
        doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
        const cl = 20; // Corner length
        doc.line(15, 15, 15 + cl, 15); doc.line(15, 15, 15, 15 + cl); // Top Left
        doc.line(width - 15, 15, width - 15 - cl, 15); doc.line(width - 15, 15, width - 15, 15 + cl); // Top Right
        doc.line(15, height - 15, 15 + cl, height - 15); doc.line(15, height - 15, 15, height - 15 - cl); // Bottom Left
        doc.line(width - 15, height - 15, width - 15 - cl, height - 15); doc.line(width - 15, height - 15, width - 15, height - 15 - cl); // Bottom Right

        // --- Website Name at Top (Banner) ---
        doc.setFillColor(169, 29, 58); // Deep Crimson
        doc.rect(width / 2 - 40, 18, 80, 12, 'F');
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("LIFELINE-108", width / 2, 26, { align: "center" });

        // --- 3. Header ---
        doc.setFontSize(38);
        doc.setFont("times", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("CERTIFICATE OF APPRECIATION", width / 2, 55, { align: "center" });

        // Sub-ribbon or line
        doc.setLineWidth(0.5);
        doc.setDrawColor(180, 140, 80);
        doc.line(width / 2 - 80, 60, width / 2 + 80, 60);

        // --- 4. Content ---
        doc.setFontSize(18);
        doc.setFont("times", "italic");
        doc.setTextColor(100, 116, 139);
        doc.text("This prestigious honor is proudly presented to", width / 2, 70, { align: "center" });

        // Logo before name
        doc.addImage(LOGO_BASE64, 'PNG', width / 2 - 18, 74, 36, 36);

        // DONOR NAME
        const donorName = currentUser?.displayName || donation.donorName || "Outstanding Donor";
        doc.setFontSize(38); // slightly smaller to accommodate logo
        doc.setFont("helvetica", "bold");
        doc.setTextColor(169, 29, 58); // Crimson for name
        doc.text(donorName.toUpperCase(), width / 2, 118, { align: "center" });

        // Line under donor name
        doc.setDrawColor(200, 200, 200);
        doc.line(width / 2 - 90, 122, width / 2 + 90, 122);

        // Description
        doc.setFontSize(16);
        doc.setFont("times", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text("In profound recognition of your selfless, generous, and life-saving voluntary blood donation.", width / 2, 132, { align: "center" });
        doc.text("Your noble contribution directly helped save the precious life of", width / 2, 140, { align: "center" });

        // PATIENT NAME
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text(donation.patientName.toUpperCase(), width / 2, 150, { align: "center" });


        // Donated At
        doc.setFontSize(14);
        doc.setFont("times", "italic");
        doc.setTextColor(100, 116, 139);
        doc.text(`Donated at ${donation.hospital}, ${donation.city}`, width / 2, 160, { align: "center" });
        doc.text(`On ${new Date(donation.completedAt || donation.createdAt).toLocaleDateString()}`, width / 2, 168, { align: "center" });

        // --- 5. Footer / Signatures ---
        doc.setFontSize(26);
        doc.setFont("times", "italic");
        doc.setTextColor(30, 41, 59);
        doc.text("Ashrith", 70, 175, { align: "center" });

        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(1);
        doc.line(40, 180, 100, 180);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Director", 70, 187, { align: "center" });

        // Add a "Seal" at the bottom right
        doc.setFillColor(169, 29, 58); // Crimson
        doc.circle(width - 70, 170, 18, 'F');
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.5);
        doc.circle(width - 70, 170, 16, 'S'); // White outline inner

        // Inner text in seal
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("OFFICIAL", width - 70, 166, { align: "center" });
        doc.text("LIFELINE", width - 70, 171, { align: "center" });
        doc.text("DONOR", width - 70, 176, { align: "center" });

        // Stamp Text
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text(`ID: ${donation.id.toUpperCase()}`, width - 25, 190, { align: "right" });

        // Download Document
        doc.save(`LifeLine-Certificate-${donorName.replace(/\s+/g, '-')}.pdf`);
    };

    async function handleConfirmReceipt() {
        if (!selectedDonorId || !selectedReqForConfirm) return;
        const donor = foundDonors.find(d => d.id === selectedDonorId);
        if (!donor) return;

        try {
            const { error: fulfillErr } = await supabase
                .from('requests')
                .update({
                    status: 'fulfilled',
                    donor_id: donor.id,
                    donor_name: donor.name,
                    donor_phone: donor.phone,
                    completed_at: new Date().toISOString()
                })
                .eq('id', selectedReqForConfirm.id);
            if (fulfillErr) throw fulfillErr;
            alert("Confirmed! Thank you for updating.");
            setMyRequests(myRequests.map(r => r.id === selectedReqForConfirm.id ? { ...r, status: 'fulfilled', donorId: donor.id } : r));
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
            const { error: deleteErr } = await supabase
                .from('requests')
                .delete()
                .eq('id', reqId);
            if (deleteErr) throw deleteErr;
            alert("Request successfully cancelled and removed.");
        } catch (e) {
            console.error('Error canceling request:', e);
            alert("Failed to cancel request.");
        }
    }

    async function handleRejectDonor(reqId: string) {
        if (!window.confirm("Are you sure you want to cancel the donor(s)? The request will go back to searching for new donors.")) return;
        try {
            const { error: rejectErr } = await supabase
                .from('requests')
                .update({
                    status: 'pending',
                    accepted_by: null,
                    accepted_at: null,
                    confirmed_by: null,
                    donor_contact: null,
                    accepted_donors: {}
                })
                .eq('id', reqId);
            if (rejectErr) throw rejectErr;
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
                                    <div key={req.id} className="card glass" style={{ borderLeft: isFulfilled ? '5px solid green' : '5px solid orange' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div>
                                                <h3 style={{ margin: 0 }}>{req.patientName} <span style={{ fontSize: '0.8rem', color: '#666' }}>({req.bloodGroup})</span></h3>
                                                <p style={{ margin: '0.5rem 0', color: '#555' }}>
                                                    🏥 {req.hospital}, {req.city}
                                                </p>
                                                <small style={{ color: '#888' }}>Date: {new Date(req.createdAt).toLocaleDateString()}</small>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold',
                                                    color: statusColor,
                                                    marginBottom: '0.5rem',
                                                    padding: '0.3rem 0.8rem',
                                                    background: statusBg,
                                                    borderRadius: '20px',
                                                    display: 'inline-block'
                                                }}>
                                                    {statusText}
                                                </div>

                                                {!isFulfilled && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {(isConfirmed || isAccepted) && (
                                                            <>
                                                                <Link
                                                                    to={`/contact/${req.id}`}
                                                                    className="btn"
                                                                    style={{ background: '#333', color: 'white', fontSize: '0.9rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                                                >
                                                                    💬 Open Secure Room
                                                                </Link>
                                                            </>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedReqForConfirm(req); setShowConfirmModal(true); }}
                                                            className="btn"
                                                            style={{ background: '#2e7d32', color: 'white', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                                        >
                                                            ✅ Received Blood?
                                                        </button>
                                                        {(isConfirmed || isAccepted) && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRejectDonor(req.id); }}
                                                                className="btn"
                                                                style={{ background: '#ffa726', color: 'white', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                                            >
                                                                ⚠️ Cancel Donor & Reopen
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCancelRequest(req.id); }}
                                                            className="btn"
                                                            style={{ background: '#f5f5f5', color: '#d32f2f', border: '1px solid #d32f2f', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                                        >
                                                            ❌ Cancel Request
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* CONTENT: IMPACT */}
            {activeTab === 'impact' && userProfile?.role === 'donor' && (
                <>
                    {donationHistory.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                            <p>You haven't completed any donations yet.</p>
                            <p style={{ fontSize: '0.9rem' }}>Once you donate and the patient confirms, it will appear here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {donationHistory.map(h => (
                                <div key={h.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #d32f2f', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: '#d32f2f' }}>Helped: {h.patientName}</h3>
                                            <p style={{ margin: '0.5rem 0', color: '#555' }}>
                                                📍 {h.hospital}, {h.city}
                                            </p>
                                            <small style={{ color: '#888' }}>On {new Date(h.completedAt || h.createdAt).toLocaleDateString()}</small>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => generateCertificate(h)}
                                                className="btn"
                                                style={{ background: '#2e7d32', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <span>🏅</span> Download Certificate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* CONFIRMATION MODAL */}
            {
                showConfirmModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '450px' }}>
                            <h3>Confirm Blood Receipt</h3>
                            <p>Who donated blood for this request?</p>

                            <input
                                type="text"
                                placeholder="Search donor name or phone..."
                                value={donorSearchTerm}
                                autoFocus
                                onChange={(e) => setDonorSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem' }}
                            />

                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', marginBottom: '1rem', borderRadius: '4px' }}>
                                {foundDonors.length === 0 && <p style={{ padding: '0.5rem', color: '#888' }}>No donors found...</p>}
                                {foundDonors.map(d => (
                                    <div
                                        key={d.id}
                                        onClick={() => setSelectedDonorId(d.id)}
                                        style={{
                                            padding: '0.8rem',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            background: selectedDonorId === d.id ? '#e8f5e9' : 'white'
                                        }}
                                    >
                                        <strong>{d.name}</strong> <span style={{ fontSize: '0.8rem', color: '#666' }}>({d.bloodGroup})</span>
                                        <br /><small>{d.phone}</small>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowConfirmModal(false)} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                                <button
                                    onClick={handleConfirmReceipt}
                                    className="btn"
                                    disabled={!selectedDonorId}
                                    style={{ background: '#2e7d32', color: 'white', padding: '0.5rem 1rem', opacity: selectedDonorId ? 1 : 0.5 }}
                                >
                                    Confirm & Update
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MyRequests;
