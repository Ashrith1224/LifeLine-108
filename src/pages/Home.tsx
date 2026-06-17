import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { FaHeartbeat, FaHandHoldingHeart, FaSearchLocation, FaArrowRight, FaTint } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        async function fetchRequests() {
            try {
                const { data, error } = await supabase
                    .from('requests')
                    .select('*')
                    .eq('status', 'pending')
                    .limit(50);

                if (error) throw error;

                const list: any[] = [];
                (data || []).forEach(r => {
                    let isCompatible = true; // Default true for guests

                    if (userProfile?.role === 'donor') {
                        isCompatible = false;
                        const bR = r.blood_group;
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

                    if (currentUser && r.requester_id === currentUser.uid) {
                        isCompatible = false;
                    }

                    if (isCompatible) {
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
                            acceptedDonors: r.accepted_donors
                        });
                    }
                });
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
                            <span style={{ color: 'var(--primary)', fontWeight: '600', letterSpacing: '1px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Current Emergencies</span>
                            <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>Urgent Requests</h2>
                        </div>
                        <Link to="/my-requests" className="btn btn-ghost" style={{ position: 'relative', zIndex: 10 }}>View All <FaArrowRight /></Link>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem' }}>
                            <div className="animate-pulse" style={{ width: '50px', height: '50px', background: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1.5rem' }}></div>
                            <p style={{ color: 'var(--text-muted)' }}>Loading priority life-saving requests...</p>
                        </div>
                    ) : requests.length > 0 ? (
                        <div className="grid-cards">
                            {requests.map(req => (
                                <div key={req.id} className="card" style={{ borderTop: '4px solid var(--primary)', position: 'relative' }}>
                                    <div className="glass" style={{ position: 'absolute', top: '20px', right: '20px', padding: '0.3rem 0.8rem', color: 'var(--primary)', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid rgba(169, 29, 58, 0.2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {req.urgency}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '65px', height: '65px', background: 'var(--primary)', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: '700', boxShadow: '0 8px 16px rgba(169, 29, 58, 0.25)' }}>
                                            {req.bloodGroup}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{req.patientName}</h3>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>{req.hospital}</p>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem', lineHeight: '1.4' }}>
                                        If the donor accepts the request then they can call each other through the website or application. <br /><strong>Donor should confirm donation then the requester and donor can contact each other.</strong>
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                                        <FaSearchLocation style={{ color: 'var(--primary)' }} />
                                        {req.city}, {req.state || 'India'}
                                    </div>

                                    <Link to="/my-requests" className="btn btn-outline" style={{ width: '100%', borderRadius: '12px', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                                        Accept Request &rarr;
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass" style={{ textAlign: 'center', padding: '4rem', borderRadius: 'var(--radius-lg)' }}>
                            <FaHandHoldingHeart style={{ fontSize: '3.5rem', color: 'var(--secondary-light)', marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>No Active Emergencies</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>All patients are currently supported. Thank you heroes! ❤️</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 📊 Stats Section (Bento Box) */}
            <section style={{ padding: '4rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: '600', letterSpacing: '2px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Trusted By Thousands</span>
                        <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>Our Overall Impact</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        <div className="glass" style={{ background: 'var(--dark)', color: 'white', textAlign: 'center', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ fontSize: '3.5rem', color: 'var(--primary-light)', marginBottom: '0.5rem' }}>50+</h3>
                            <p style={{ color: 'rgba(255,255,255,0.8)' }}>Lives Saved</p>
                        </div>
                        <div className="glass" style={{ textAlign: 'center', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ fontSize: '3.5rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>100+</h3>
                            <p style={{ color: 'var(--text-main)' }}>Registered Donors</p>
                        </div>
                        <div className="glass" style={{ textAlign: 'center', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>24/7</h3>
                            <p style={{ color: 'var(--text-main)' }}>Active Support</p>
                        </div>
                        <div className="glass" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', borderRadius: 'var(--radius-lg)', border: 'none' }}>
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--white)' }}>Join the Mission</h3>
                            <Link to="/register" className="btn" style={{ background: 'var(--white)', color: 'var(--primary)' }}>Register Now</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ✨ How It Works */}
            <section style={{ padding: '6rem 0 8rem' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                        <h2 style={{ fontSize: '2.5rem' }}>A Simple Process</h2>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '1rem auto' }}>We connect you directly to the person in need. No complex procedures, no middlemen.</p>
                    </div>

                    <div className="grid-cards">
                        {[
                            { step: '01', title: 'Register Account', desc: 'Sign up in two minutes. Provide your basic details and blood group.', icon: <FaHeartbeat /> },
                            { step: '02', title: 'Find or Request', desc: 'Easily locate nearby donors or post a life-saving request.', icon: <FaSearchLocation /> },
                            { step: '03', title: 'Save a Life', desc: 'Connect directly via phone and donate blood when it is most critical.', icon: <FaHandHoldingHeart /> }
                        ].map((item, idx) => (
                            <div key={idx} className="card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '6rem', fontWeight: '800', opacity: 0.03, color: 'var(--primary)', zIndex: 0 }}>
                                    {item.step}
                                </div>
                                <div style={{
                                    width: '75px', height: '75px',
                                    background: idx === 1 ? 'var(--primary)' : 'rgba(255,255,255,0.8)',
                                    color: idx === 1 ? 'var(--white)' : 'var(--primary)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.5rem', fontSize: '1.8rem',
                                    position: 'relative', zIndex: 1,
                                    border: idx === 1 ? 'none' : '1px solid rgba(169, 29, 58, 0.1)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    {item.icon}
                                </div>
                                <h3 style={{ marginBottom: '1rem', position: 'relative', zIndex: 1, fontSize: '1.3rem' }}>{item.title}</h3>
                                <p style={{ color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
