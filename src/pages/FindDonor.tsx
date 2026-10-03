import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { FaMapMarker, FaPhone } from 'react-icons/fa';
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
                        await addDoc(collection(db, 'reports'), {
                            targetUserId: donor.id,
                            targetName: donor.name,
                            reason,
                            status: 'pending',
                            timestamp: new Date().toISOString()
                        });
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

            // Fetch donor profiles
            const q = query(
                collection(db, 'profiles'),
                where('role', '==', 'donor'),
                where('available', '==', true)
            );

            const querySnapshot = await getDocs(q);
            const results: Donor[] = [];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const dBloodGroup = data.bloodGroup || data.blood_group;
                if (compatibleGroups.includes(dBloodGroup)) {
                    // Match State / District / City if provided
                    const matchesState = !stateName || (data.state && data.state.toLowerCase() === stateName.toLowerCase());
                    const matchesDistrict = !district || (data.district && data.district.toLowerCase() === district.toLowerCase());
                    const matchesCity = !city || (data.city && data.city.toLowerCase().includes(city.toLowerCase()));

                    if (matchesState && matchesDistrict && matchesCity) {
                        results.push({
                            id: docSnap.id,
                            name: data.name || 'Anonymous Donor',
                            bloodGroup: dBloodGroup,
                            city: data.city || data.state || 'Local Area',
                            phone: data.phone || '',
                            donorType: data.donorType || data.donor_type || 'volunteer',
                            lastDonationDate: data.lastDonationDate
                        });
                    }
                }
            });

            setDonors(results);

            // Also search offline blood banks if city or state matches
            const matchingBanks = MOCK_BLOOD_BANKS.filter(b => {
                const matchesState = !stateName || (b.state && b.state.toLowerCase() === stateName.toLowerCase());
                const matchesCity = !city || (b.city && b.city.toLowerCase().includes(city.toLowerCase()));
                return matchesState && matchesCity;
            });
            setBloodBanks(matchingBanks);

        } catch (error) {
            console.error("Search error:", error);
            alert(getFriendlyErrorMessage(error));
        }
        setLoading(false);
    }

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Find a Blood Donor</h1>

            <div className="card glass" style={{ maxWidth: '800px', margin: '0 auto 3rem auto' }}>
                <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ fontWeight: '500' }}>Blood Group</label>
                        <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                        >
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>State</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                            value={stateCode}
                            onChange={(e) => {
                                const nextStateCode = e.target.value;
                                const nextStateName = e.target.options[e.target.selectedIndex].text;
                                setStateCode(nextStateCode);
                                setStateName(nextStateCode ? nextStateName : '');
                                setDistrict('');
                            }}
                        >
                            <option value="">All States</option>
                            {getAllStates().map((s) => (
                                <option key={s.code} value={s.code}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>District</label>
                        <select
                            disabled={!stateCode}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem', background: !stateCode ? '#f5f5f5' : 'white' }}
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                        >
                            <option value="">All Districts</option>
                            {availableDistricts.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>City / Area</label>
                        <input
                            type="text"
                            placeholder="e.g. Bangalore"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>
            </div>

            {hasSearched && (
                <div>
                    <h2 style={{ marginBottom: '1.5rem' }}>Available Donors ({donors.length})</h2>
                    {donors.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                            <p>No matching donors found in this location right now.</p>
                            <p>Try searching neighboring areas or submitting an emergency broadcast request.</p>
                            <Link to="/emergency" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                Broadcast Emergency Request
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                            {donors.map(renderDonorCard)}
                        </div>
                    )}

                    {bloodBanks.length > 0 && (
                        <div style={{ marginTop: '3rem' }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Nearby Blood Banks & Centers ({bloodBanks.length})</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {bloodBanks.map((bank, i) => (
                                    <div key={i} className="card" style={{ borderLeft: '5px solid #1976d2' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0' }}>{bank.name}</h3>
                                        <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}><FaMapMarker /> {bank.address}, {bank.city}</p>
                                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}><FaPhone /> {bank.contact}</p>
                                        <a href={`tel:${bank.contact}`} className="btn btn-outline" style={{ display: 'block', textAlign: 'center', fontSize: '0.9rem' }}>Call Blood Bank</a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FindDonor;
