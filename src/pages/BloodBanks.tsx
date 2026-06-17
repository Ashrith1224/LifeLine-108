import { useState } from 'react';
import { FaPhoneAlt, FaMapMarkerAlt, FaTint } from 'react-icons/fa';
import { getAllStates, getDistricts } from 'india-state-district';
import { MOCK_BLOOD_BANKS } from '../data/bloodBanks';

const BloodBanks = () => {
    const [bloodGroup, setBloodGroup] = useState('All');
    const [stateCode, setStateCode] = useState('');
    const [stateName, setStateName] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');

    const availableDistricts = stateCode ? getDistricts(stateCode) : [];

    // Filter banks
    const filteredBanks = MOCK_BLOOD_BANKS.filter(bank => {
        // Blood Group Match
        if (bloodGroup !== 'All') {
            const hasGroup = bank.bloodTypes.includes(bloodGroup) || bank.bloodTypes.includes("All Types Available");
            if (!hasGroup) return false;
        }

        // Location Match (Exact for state/district if selected, fuzzy for city)
        if (stateName && bank.state !== stateName) return false;
        if (district && bank.district !== district) return false;
        if (city.trim() && !bank.city.toLowerCase().includes(city.toLowerCase())) return false;

        return true;
    });

    return (
        <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <FaTint /> Partner Blood Banks
                </h1>
                <p style={{ color: '#555', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Find and directly contact verified blood banks near you with the blood group you need.
                </p>
            </div>

            {/* Search Box */}
            <div className="card glass" style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>Blood Group</label>
                        <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                            <option value="All">All Blood Groups</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>State</label>
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
                        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>District</label>
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
                        <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.5rem' }}>Local Area / City</label>
                        <input
                            type="text"
                            placeholder="Enter area/city..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {filteredBanks.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#666', background: '#ffebee', borderRadius: '8px' }}>
                        <h3>No Blood Banks Found</h3>
                        <p>No partner requested blood banks match your search criteria. Try a different area!</p>
                    </div>
                )}
                {filteredBanks.map((bank) => (
                    <div key={bank.id} className="card glass" style={{ borderTop: '4px solid var(--primary)', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {bank.status}
                        </span>

                        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', marginTop: '0.5rem' }}>{bank.name}</h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', marginBottom: '0.5rem' }}>
                            <FaMapMarkerAlt color="var(--primary)" />
                            <strong>{bank.city}</strong> - {bank.address}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', marginBottom: '1.5rem' }}>
                            <FaTint color="#d32f2f" />
                            <span>Available: <strong>{bank.bloodTypes.join(', ')}</strong></span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <a href={`tel:${bank.contact}`} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}>
                                <FaPhoneAlt /> Call to Order
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ffe0b2' }}>
                <h3 style={{ color: '#e65100', marginBottom: '0.5rem' }}>Are you a Blood Bank?</h3>
                <p style={{ color: '#666', marginBottom: '1rem' }}>Join our network and help save more lives.</p>
                <button className="btn btn-outline" style={{ borderColor: '#e65100', color: '#e65100' }}>Register Branch</button>
            </div>
        </div>
    );
};

export default BloodBanks;
