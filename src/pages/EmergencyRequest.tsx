import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFriendlyErrorMessage } from '../utils/errorUtils';
import { getAllStates, getDistricts } from 'india-state-district';

const EmergencyRequest = () => {
    const { currentUser } = useAuth();
    const [patientName, setPatientName] = useState('');
    const [bloodGroup, setBloodGroup] = useState('A+');
    const [hospital, setHospital] = useState('');
    const [stateCode, setStateCode] = useState('');
    const [stateName, setStateName] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');
    const [contact, setContact] = useState('');
    const [urgency, setUrgency] = useState('Critical');

    const availableDistricts = stateCode ? getDistricts(stateCode) : [];

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [targetedDonorId, setTargetedDonorId] = useState<string | null>(null);
    const [targetedDonorName, setTargetedDonorName] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Init from location state if passed
    useState(() => {
        if (location.state?.prefilledCity) {
            setCity(location.state.prefilledCity);
        }
        if (location.state?.prefilledBloodGroup) {
            setBloodGroup(location.state.prefilledBloodGroup);
        }
        if (location.state?.targetedDonorId) {
            setTargetedDonorId(location.state.targetedDonorId);
            setTargetedDonorName(location.state.targetedDonorName);
        }
    });

    // Auto-fill from Profile
    useState(() => {
        if (currentUser) {
            supabase.from('profiles').select('*').eq('id', currentUser.uid).single().then(({ data, error }) => {
                if (data && !error) {
                    if (data.name) setPatientName(data.name);

                    // Autofill state and district
                    const stateCodeFound = getAllStates().find(s => s.name === data.state)?.code || '';
                    if (stateCodeFound) {
                        setStateCode(stateCodeFound);
                        setStateName(data.state);
                    }
                    if (data.district) setDistrict(data.district);

                    if (data.city && !location.state?.prefilledCity) setCity(data.city);
                    if (data.phone) {
                        const digits = data.phone.replace(/\D/g, '');
                        setContact(digits.slice(-10)); // Ensure only the 10-digit number is populated
                    }
                    if (data.blood_group && !location.state?.prefilledBloodGroup) setBloodGroup(data.blood_group);
                }
            });
        }
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!/^\d{10}$/.test(contact)) {
            return alert("Contact number must be exactly 10 digits.");
        }

        setLoading(true);

        try {
            const { error: insertError } = await supabase.from('requests').insert({
                patient_name: patientName,
                blood_group: bloodGroup,
                hospital,
                state: stateName,
                district,
                city,
                contact,
                urgency,
                status: 'pending',
                requester_id: currentUser?.uid,
                targeted_donor_id: targetedDonorId || null
            });
            if (insertError) throw insertError;
            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (error) {
            console.error("Error creating request:", error);
            alert(getFriendlyErrorMessage(error));
        }
        setLoading(false);
    }

    if (success) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto', borderColor: 'green' }}>
                    <h2 style={{ color: 'green', marginBottom: '1rem' }}>Request Submitted!</h2>
                    <p>{targetedDonorId ? `Your emergency request has been sent directly to ${targetedDonorName}!` : 'Your emergency request has been broadcasted to nearby donors.'}</p>
                    <p>We are redirecting you to the home page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
            <div className="card glass" style={{ maxWidth: '600px', width: '100%' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#d32f2f' }}>🚨 Emergency Blood Request</h2>
                {targetedDonorId && (
                    <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid #c8e6c9' }}>
                        <strong>🎯 Direct Alert to: {targetedDonorName}</strong><br />
                        <span style={{ fontSize: '0.9rem' }}>Fill this form so they receive the patient and hospital details immediately.</span>
                    </div>
                )}
                <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
                    Please fill this form only for genuine emergencies.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ fontWeight: '500' }}>Patient Name</label>
                        <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={patientName} onChange={(e) => setPatientName(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Blood Group Required</label>
                        <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Hospital / Location</label>
                        <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={hospital} onChange={(e) => setHospital(e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                        <div>
                            <label style={{ fontWeight: '500' }}>State</label>
                            <select
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }}
                                value={stateCode}
                                onChange={(e) => {
                                    setStateCode(e.target.value);
                                    setStateName(e.target.options[e.target.selectedIndex].text);
                                    setDistrict('');
                                }}
                            >
                                <option value="" disabled>Select State</option>
                                {getAllStates().map((s) => (
                                    <option key={s.code} value={s.code}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ fontWeight: '500' }}>District</label>
                            <select
                                required
                                disabled={!stateCode}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem', background: !stateCode ? '#f5f5f5' : 'white' }}
                                value={district}
                                onChange={(e) => setDistrict(e.target.value)}
                            >
                                <option value="" disabled>Select District</option>
                                {availableDistricts.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>City / Local Area</label>
                        <input type="text" required placeholder="e.g. Area name" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Contact Number</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <span style={{ padding: '0.75rem', background: '#eee', borderRadius: '8px', border: '1px solid #ccc', color: '#555' }}>+91</span>
                            <input
                                type="tel"
                                required
                                maxLength={10}
                                placeholder="9876543210"
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                value={contact}
                                onChange={(e) => setContact(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontWeight: '500' }}>Urgency Level</label>
                        <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginTop: '0.5rem' }} value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                            <option value="Moderate">Moderate (Need within 24hrs)</option>
                            <option value="High">High (Need within 6hrs)</option>
                            <option value="Critical">Critical (Immediate)</option>
                        </select>
                    </div>

                    <button disabled={loading} className="btn" type="submit" style={{ width: '100%', marginTop: '1rem', background: '#d32f2f', color: 'white', fontSize: '1.1rem' }}>
                        {loading ? 'Submitting...' : 'Submit Emergency Request'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EmergencyRequest;
