import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { FaMapMarker, FaTint, FaPhone } from 'react-icons/fa';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import { getAllStates, getDistricts } from 'india-state-district';
import { MOCK_BLOOD_BANKS } from '../data/bloodBanks';

interface Donor {
    id: string;
    name: string;
    bloodGroup: string;
    city: string;
    phone: string;
    donorType?: string;
    lastDonationDate?: string;
}

const FindDonor = () => {
    const { currentUser } = useAuth();
    const [bloodGroup, setBloodGroup] = useState('A+');
    const [stateCode, setStateCode] = useState('');
    const [stateName, setStateName] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');
    const [donors, setDonors] = useState<Donor[]>([]);
    const [bloodBanks, setBloodBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const availableDistricts = stateCode ? getDistricts(stateCode) : [];

    const renderDonorCard = (donor: Donor) => (
        <div key={donor.id} className="card" style={{ borderLeft: donor.donorType === 'member' ? '5px solid #2e7d32' : '5px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0 }}>
                        {donor.name}
                        {donor.donorType === 'member' && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle' }}>⭐ Verified Member</span>}
                    </h3>
                    <FaMapMarker /> {donor.city}
                </div>
                <div style={{ background: '#ffebee', color: 'var(--primary)', padding: '0.5rem', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', border: '2px solid var(--primary)' }}>
                    {donor.bloodGroup}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <Link to="/emergency" state={{ prefilledCity: donor.city, prefilledBloodGroup: donor.bloodGroup, targetedDonorId: donor.id, targetedDonorName: donor.name }} className="btn btn-primary" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                    🚨 Alert via Emergency Request
                </Link>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', marginTop: '0.75rem', marginBottom: '0', lineHeight: '1.4' }}>
                The requester will alert the donor.<br />If the donor accepts the request then they can call each other through the website or application.<br /><strong>Donor should confirm donation then the requester and donor can contact each other.</strong>
            </p>
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#888', textAlign: 'center' }}>
                Last Donated: {donor.lastDonationDate || 'Not specified'}
            </div>
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                <button style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }} onClick={async () => {
                    const reason = prompt("Why do you want to report this user? (e.g., Fake number, Rude behavior)");
                    if (!reason) return;

                    try {
                        const { error: reportErr } = await supabase.from('reports').insert({
                            target_user_id: donor.id,
                            target_name: donor.name,
                            reason,
                            status: 'pending'
                        });
                        if (reportErr) throw reportErr;
                        alert("Report submitted. Admins will review it shortly.");
                    } catch (e) {
                        console.error(e);
                        alert(getFriendlyErrorMessage(e));
                    }
                }}>
                    Report Fake Profile
                </button>
            </div>
        </div>
    );

    if (!currentUser) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div className="card glass" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Restricted Access</h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#555' }}>
                        To protect the privacy of our donors, you must be a registered user to search and view contact details.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/login" className="btn btn-primary">Login Now</Link>
                        <Link to="/register" className="btn btn-outline">Create Account</Link>
                    </div>
                </div>
            </div>
        );
    }

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setHasSearched(true);
        setDonors([]);

        try {
            // Basic query: exact match on blood group and city (case-sensitive for now, better to normalize)
            // In a real app, use a more robust search (e.g. Algolia/Typesense) or normalize strings.
            // For now, we assume users type city nicely or we lowercase it on save/search. (Not implemented here, keeping it simple).

            // To make it slightly better, let's just query by Role and Blood Group first, then filter by City client-side (if city is entered).
            // This avoids complex composite indexes for now.

            const getCompatibleBloodGroups = (bg: string) => {
                switch (bg) {
                    case 'A+': return ['A+', 'A-', 'O+', 'O-'];
                    case 'O+': return ['O+', 'O-'];
                    case 'B+': return ['B+', 'B-', 'O+', 'O-'];
                    case 'AB+': return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                    case 'A-': return ['A-', 'O-'];
                    case 'O-': return ['O-'];
                    case 'B-': return ['B-', 'O-'];
                    case 'AB-': return ['AB-', 'A-', 'B-', 'O-'];
                    default: return [bg];
                }
            };

            const compatibleGroups = getCompatibleBloodGroups(bloodGroup);

            const { data: results, error: searchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'donor')
                .eq('available', true)
                .in('blood_group', compatibleGroups);

            if (searchError) throw searchError;

            // Map PG fields back to frontend expectations
            const mappedResults = (results || []).map(d => ({
                ...d,
                uid: d.id,
                bloodGroup: d.blood_group,
                donorType: d.donor_type,
                lastDonationDate: d.last_donation_date || null
            }));

            // Filter by city, state, district if provided
            let finalResults = mappedResults;
            if (stateName) {
                finalResults = finalResults.filter(d => d.state === stateName);
            }
            if (district) {
                finalResults = finalResults.filter(d => d.district === district);
            }
            if (city.trim()) {
                finalResults = finalResults.filter(d => d.city?.toLowerCase().includes(city.toLowerCase()));
            }
            setDonors(finalResults);

            // Filter Blood Banks
            const foundBanks = MOCK_BLOOD_BANKS.filter(bank => {
                if (bloodGroup !== 'All') {
                    const hasGroup = bank.bloodTypes.includes(bloodGroup) || bank.bloodTypes.includes("All Types Available");
                    if (!hasGroup) return false;
                }
                if (stateName && bank.state !== stateName) return false;
                if (district && bank.district !== district) return false;
                if (city.trim() && !bank.city.toLowerCase().includes(city.toLowerCase())) return false;
                return true;
            });
            setBloodBanks(foundBanks);

        } catch (error) {
            console.error("Error finding donors:", error);
            alert(getFriendlyErrorMessage(error));
        }
        setLoading(false);
    }

    return (
        <div className="container">
            <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>Find Blood Donors</h1>

            {/* Search Box */}
            <div className="card glass" style={{ marginBottom: '3rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>Blood Group</label>
                        <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>State (Optional)</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                            value={stateCode}
                            onChange={(e) => {
                                setStateCode(e.target.value);
                                setStateName(e.target.options[e.target.selectedIndex].text);
                                setDistrict('');
                            }}
                        >
                            <option value="">All States</option>
                            {getAllStates().map((s) => (
                                <option key={s.code} value={s.code}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>District (Optional)</label>
                        <select
                            disabled={!stateCode}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', background: !stateCode ? '#f5f5f5' : 'white' }}
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                        >
                            <option value="">All Districts</option>
                            {availableDistricts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>Local Area (Optional)</label>
                        <input
                            type="text"
                            placeholder="Enter area/city..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                    <div>
                        <button disabled={loading} className="btn btn-primary" type="submit" style={{ padding: '0.75rem 2rem', height: '48px' }}>
                            {loading ? 'Searching...' : 'Search Donors'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results */}
            {hasSearched && (
                <div>
                    <h3 style={{ marginBottom: '1.5rem', color: '#555' }}>
                        {donors.length > 0 ? `Found ${donors.length} donors nearby` : 'No donors found yet. Try a different location or blood group.'}
                    </h3>

                    {donors.filter(d => d.donorType === 'member').length > 0 && (
                        <div style={{ marginBottom: '3rem' }}>
                            <h4 style={{ color: '#2e7d32', marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #e8f5e9', paddingBottom: '0.5rem' }}>
                                ⭐ Verified Member Donors
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                                {donors.filter(d => d.donorType === 'member').map(renderDonorCard)}
                            </div>
                        </div>
                    )}

                    {donors.filter(d => d.donorType !== 'member').length > 0 && (
                        <div>
                            <h4 style={{ color: '#555', marginBottom: '1.5rem', fontSize: '1.2rem', paddingTop: donors.filter(d => d.donorType === 'member').length > 0 ? '1rem' : '0', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                                Volunteer Donors
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                                {donors.filter(d => d.donorType !== 'member').map(renderDonorCard)}
                            </div>
                        </div>
                    )}

                    {bloodBanks.length > 0 && (
                        <div style={{ marginTop: '3rem' }}>
                            <h4 style={{ color: '#d32f2f', marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid #ffebee', paddingBottom: '0.5rem' }}>
                                <FaTint /> Partner Blood Banks
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                                {bloodBanks.map(bank => (
                                    <div key={bank.id} className="card glass" style={{ borderTop: '4px solid var(--primary)', position: 'relative' }}>
                                        <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {bank.status}
                                        </span>

                                        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', marginTop: '0.5rem', color: '#333' }}>{bank.name}</h2>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                            <FaMapMarker color="var(--primary)" />
                                            <span><strong>{bank.city}</strong> - {bank.address}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                            <FaTint color="#d32f2f" />
                                            <span>Available: <strong>{bank.bloodTypes.join(', ')}</strong></span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1.5rem' }}>
                                            <a href={`tel:${bank.contact}`} className="btn" style={{ background: '#eee', color: '#333', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <FaPhone /> Call to Order
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default FindDonor;
