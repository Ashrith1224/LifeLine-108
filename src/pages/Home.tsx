import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { FaHeartbeat, FaHandHoldingHeart, FaSearchLocation, FaArrowRight, FaTint } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { checkAndAutoSeed, seedSampleData } from '../data/seedData';

const Home = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        async function fetchRequests() {
            try {
                const q = query(
                    collection(db, 'requests'),
                    where('status', '==', 'pending'),
                    limit(50)
                );

                let snapshot = await getDocs(q);
                if (snapshot.empty) {
                    await checkAndAutoSeed();
                    snapshot = await getDocs(q);
                }
                const list: any[] = [];

                snapshot.forEach(docSnap => {
                    const r = docSnap.data();
                    let isCompatible = true; // Default true for guests

                    if (userProfile?.role === 'donor') {
                        isCompatible = false;
                        const bR = r.bloodGroup || r.blood_group;
                        const bD = userProfile.bloodGroup;
                        if (bD === 'O-') isCompatible = true;
                        else if (bD === 'O+' && ['A+', 'B+', 'AB+', 'O+'].includes(bR)) isCompatible = true;
                        else if (bD === 'A-' && ['A+', 'A-', 'AB+', 'AB-'].includes(bR)) isCompatible = true;
                        else if (bD === 'A+' && ['A+', 'AB+'].includes(bR)) isCompatible = true;
                        else if (bD === 'B-' && ['B+', 'B-', 'AB+', 'AB-'].includes(bR)) isCompatible = true;
                        else if (bD === 'B+' && ['B+', 'AB+'].includes(bR)) isCompatible = true;
                        else if (bD === 'AB-' && ['AB+', 'AB-'].includes(bR)) isCompatible = true;
                        else if (bD === 'AB+' && bR === 'AB+') isCompatible = true;

                        const isStateMatch = r.state && userProfile.state ? r.state === userProfile.state : (r.city && userProfile.city && r.city.toLowerCase() === userProfile.city.toLowerCase());
                        if (!isStateMatch) {
                            isCompatible = false;
                        }
                    }

                    const requesterId = r.requesterId || r.requester_id;
                    if (currentUser && requesterId === currentUser.uid) {
                        isCompatible = false;
                    }

                    if (isCompatible) {
                        list.push({
                            id: docSnap.id,
                            ...r,
                            patientName: r.patientName || r.patient_name,
                            bloodGroup: r.bloodGroup || r.blood_group,
                            requesterId: requesterId,
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
                    }
                });

                // Sort by date newest first
                list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setRequests(list.slice(0, 6));
            } catch (err) {
                console.error("Error fetching home requests:", err);
            }
            setLoading(false);
        }
        fetchRequests();
    }, [currentUser, userProfile]);

    return (
        <div style={{ overflowX: 'hidden' }}>
            {/* 🦸 Hero Section */}
            <section style={{
                minHeight: '85vh',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                paddingTop: '2rem'
            }}>
                <div className="bg-blob" style={{ background: 'var(--primary)', width: '60vw', height: '60vw', position: 'absolute', top: '-20%', right: '-10%', opacity: 0.05, filter: 'blur(100px)', zIndex: 0, borderRadius: '50%' }}></div>
                <div className="bg-blob" style={{ background: 'var(--secondary)', width: '40vw', height: '40vw', position: 'absolute', bottom: '0', left: '-5%', opacity: 0.03, filter: 'blur(100px)', zIndex: 0, borderRadius: '50%' }}></div>

                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'center' }}>

                        {/* Text Content */}
                        <div className="animate-slide-up">
                            <div className="glass" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', color: 'var(--primary)', borderRadius: '50px', fontWeight: '600', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(169, 29, 58, 0.2)' }}>
                                ❤️ #1 Platform for Emergency Blood
                            </div>
                            <h1 style={{ fontSize: '3.75rem', marginBottom: '1.5rem' }}>
                                Donate Blood, <br />
                                <span className="text-gradient">Save a Life Today.</span>
                            </h1>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '500px' }}>
                                Connect directly with donors in your city. No middlemen, no delays.
                                Just real heroes saving real lives when it matters most.
                            </p>

                            <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                                <Link to="/find-donor" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}>
                                    <FaSearchLocation /> Find a Donor
                                </Link>
                                <Link to="/emergency" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.05rem' }}>
                                    <FaHeartbeat /> Request Blood
                                </Link>
                            </div>

                            <div style={{ marginTop: '3.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex' }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#ccc', border: '3px solid var(--white)', marginLeft: i > 1 ? '-15px' : 0, backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 15})`, backgroundSize: 'cover', boxShadow: 'var(--shadow-sm)' }}></div>
                                    ))}
                                </div>
                                <div>
                                    <p style={{ fontWeight: '700', margin: 0, color: 'var(--dark)' }}>1,200+ Donors</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Registered this month</p>
                                </div>
                            </div>
                        </div>

                        {/* Image/Visual */}
                        <div style={{ position: 'relative' }} className="animate-fade-in">
                            <div className="glass" style={{ padding: '1rem', transform: 'rotate(-1.5deg)', position: 'relative', zIndex: 2 }}>
                                <img
                                    src="https://images.unsplash.com/photo-1615461166324-cd1f91f9b9b0?q=80&w=1000&auto=format&fit=crop"
                                    alt="Blood Donation"
                                    style={{ width: '100%', borderRadius: 'calc(var(--radius-lg) - 0.5rem)', display: 'block' }}
                                />

                                <div className="glass" style={{ position: 'absolute', bottom: '-25px', left: '-25px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px', borderRadius: 'var(--radius)' }}>
                                    <div style={{ width: '50px', height: '50px', background: 'rgba(169, 29, 58, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.5rem' }}>
                                        <FaTint />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--dark)' }}>Urgent Need</h4>
                                        <p style={{ margin: 0, color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>A+ Blood Group</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 🚨 Emergency Requests Section */}
            <section style={{ padding: '6rem 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3.5rem' }}>
                        <div>
                            <span style={{ color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Emergency Board</span>
                            <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>Live Blood Requests</h2>
                        </div>
                        <Link to="/find-donor" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            View all donors <FaArrowRight />
                        </Link>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading live requests...</div>
                    ) : requests.length === 0 ? (
                        <div className="card glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <FaHandHoldingHeart style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }} />
                            <h3>No urgent requests right now</h3>
                            <p style={{ color: 'var(--text-muted)' }}>All current needs have been fulfilled. You're doing great!</p>
                            <button
                                onClick={async () => {
                                    setLoading(true);
                                    await seedSampleData();
                                    window.location.reload();
                                }}
                                className="btn btn-primary"
                                style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                🩸 Populate Demo Requests & Donors
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                            {requests.map((req) => (
                                <div key={req.id} className="card glass" style={{ borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <span style={{ fontSize: '0.8rem', background: '#ffebee', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                {req.urgency}
                                            </span>
                                            <h3 style={{ margin: '0.5rem 0 0.2rem', fontSize: '1.3rem' }}>{req.patientName}</h3>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{req.hospital}, {req.city || req.state}</p>
                                        </div>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(169, 29, 58, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            {req.bloodGroup}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </span>
                                        <Link to="/find-donor" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                            Respond
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* 🌟 How it Works Section */}
            <section style={{ padding: '6rem 0', background: 'rgba(0,0,0,0.02)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>How It Works</span>
                        <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>Saving lives in 3 simple steps</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                        <div className="card glass" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(169, 29, 58, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1.5rem auto' }}>
                                1
                            </div>
                            <h3>Post a Request</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Submit patient details and hospital location in seconds during an emergency.</p>
                        </div>

                        <div className="card glass" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(169, 29, 58, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1.5rem auto' }}>
                                2
                            </div>
                            <h3>Instant Alerts</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Nearby verified donors matching the blood group receive instant notifications.</p>
                        </div>

                        <div className="card glass" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(169, 29, 58, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1.5rem auto' }}>
                                3
                            </div>
                            <h3>Connect & Save</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Coordinate safely in a secure encrypted room and complete the donation.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
