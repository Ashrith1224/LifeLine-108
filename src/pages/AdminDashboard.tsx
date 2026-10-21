import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { seedSampleData } from '../data/seedData';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalDonors: 0,
        activeRequests: 0,
        successfulDonations: 0
    });

    const [users, setUsers] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [view, setView] = useState<'users' | 'requests' | 'history'>('users');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State for Completing Request
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [selectedDonorId, setSelectedDonorId] = useState('');
    const [donorSearch, setDonorSearch] = useState('');

    const { currentUser, userRole, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading) {
            if (!currentUser || userRole !== 'admin') {
                navigate('/login');
            } else {
                const fetchAdminData = async () => {
                    try {
                        // Fetch Users (Profiles)
                        const usersSnap = await getDocs(collection(db, 'profiles'));
                        const usersList: any[] = [];
                        usersSnap.forEach(d => {
                            const u = d.data();
                            usersList.push({
                                id: d.id,
                                ...u,
                                bloodGroup: u.bloodGroup || u.blood_group,
                                donorType: u.donorType || u.donor_type || 'volunteer'
                            });
                        });
                        setUsers(usersList);

                        // Fetch Requests
                        const requestsSnap = await getDocs(collection(db, 'requests'));
                        const requestsList: any[] = [];
                        requestsSnap.forEach(d => {
                            const r = d.data();
                            requestsList.push({
                                id: d.id,
                                ...r,
                                patientName: r.patientName || r.patient_name,
                                bloodGroup: r.bloodGroup || r.blood_group,
                                createdAt: r.createdAt || r.created_at,
                                completedAt: r.completedAt || r.completed_at,
                                donorId: r.donorId || r.donor_id,
                                donorName: r.donorName || r.donor_name,
                                donorPhone: r.donorPhone || r.donor_phone
                            });
                        });
                        // Sort by Date (Newest First)
                        requestsList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                        setRequests(requestsList);

                        setStats({
                            totalDonors: usersList.filter((u: any) => u.role === 'donor').length,
                            activeRequests: requestsList.filter((r: any) => r.status === 'pending').length,
                            successfulDonations: requestsList.filter((r: any) => r.status === 'fulfilled').length
                        });

                    } catch (error) {
                        console.error("Error fetching admin data:", error);
                    }
                    setLoading(false);
                };

                fetchAdminData();
            }
        }
    }, [currentUser, userRole, authLoading, navigate]);

    // User Actions
    async function handleDeleteUser(userId: string) {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await deleteDoc(doc(db, 'profiles', userId));
            setUsers(users.filter(u => u.id !== userId));
            alert("User deleted");
        } catch (error) {
            console.error(error);
        }
    }

    async function handleRoleUpdate(userId: string, newRole: string) {
        if (!confirm(`Change role to ${newRole}?`)) return;
        try {
            await updateDoc(doc(db, 'profiles', userId), { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error(error);
        }
    }

    async function handleDonorTypeUpdate(userId: string, newType: string) {
        if (!confirm(`Change donor type to ${newType}?`)) return;
        try {
            await updateDoc(doc(db, 'profiles', userId), { donorType: newType });
            setUsers(users.map(u => u.id === userId ? { ...u, donorType: newType } : u));
        } catch (error) {
            console.error(error);
        }
    }

    // Request Actions
    async function handleDeleteRequest(reqId: string) {
        if (!confirm("Delete this request?")) return;
        try {
            await deleteDoc(doc(db, 'requests', reqId));
            setRequests(requests.filter(r => r.id !== reqId));
            alert("Request deleted");
        } catch (e) {
            console.error(e);
        }
    }

    async function handleCompleteDonation() {
        if (!selectedRequest || !selectedDonorId) {
            alert("Please select a donor");
            return;
        }

        const donor = users.find(u => u.id === selectedDonorId);
        if (!donor) return;

        if (!confirm(`Mark request for ${selectedRequest.patientName} as fulfilled by ${donor.name}?`)) return;

        try {
            await updateDoc(doc(db, 'requests', selectedRequest.id), {
                status: 'fulfilled',
                donorId: donor.id,
                donorName: donor.name,
                donorPhone: donor.phone || '',
                completedAt: new Date().toISOString()
            });

            // Update local state
            setRequests(requests.map(r => r.id === selectedRequest.id ? {
                ...r,
                status: 'fulfilled',
                donorId: donor.id,
                donorName: donor.name,
                donorPhone: donor.phone,
                completedAt: new Date().toISOString()
            } : r));

            setStats(prev => ({
                ...prev,
                activeRequests: prev.activeRequests - (selectedRequest.status === 'pending' ? 1 : 0),
                successfulDonations: prev.successfulDonations + 1
            }));

            setSelectedRequest(null);
            setSelectedDonorId('');
            setDonorSearch('');
            alert("Donation marked as fulfilled!");
        } catch (e) {
            console.error(e);
            alert("Failed to fulfill request");
        }
    }

    // Filters
    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.city?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredRequests = requests.filter(r =>
        r.status !== 'fulfilled' &&
        (r.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.hospital?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.city?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const donationHistory = requests.filter(r => r.status === 'fulfilled');

    // Chart Data Preparation
    const bloodGroupCounts: { [key: string]: number } = {
        'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
    };
    users.filter(u => u.role === 'donor').forEach(u => {
        if (u.bloodGroup && bloodGroupCounts[u.bloodGroup] !== undefined) {
            bloodGroupCounts[u.bloodGroup]++;
        }
    });

    const barChartData = Object.keys(bloodGroupCounts).map(bg => ({
        bloodGroup: bg,
        donors: bloodGroupCounts[bg]
    }));

    const pieData = [
        { name: 'Active Requests', value: stats.activeRequests, color: '#f44336' },
        { name: 'Fulfilled', value: stats.successfulDonations, color: '#4caf50' }
    ];

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading Admin Panel...</div>;

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ color: 'var(--primary)', margin: 0 }}>Administrator Dashboard</h1>
                <button
                    onClick={async () => {
                        setLoading(true);
                        await seedSampleData();
                        alert("Sample verified donors and emergency requests added!");
                        window.location.reload();
                    }}
                    className="btn btn-outline"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}
                >
                    🩸 Populate Demo Data (Donors & Requests)
                </button>
            </div>

            {/* STATS OVERVIEW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', borderLeft: '5px solid #2196f3' }}>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#2196f3' }}>{stats.totalDonors}</h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Total Registered Donors</p>
                </div>
                <div className="card" style={{ textAlign: 'center', borderLeft: '5px solid #f44336' }}>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#f44336' }}>{stats.activeRequests}</h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Active Requests</p>
                </div>
                <div className="card" style={{ textAlign: 'center', borderLeft: '5px solid #4caf50' }}>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: '#4caf50' }}>{stats.successfulDonations}</h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Fulfilled Donations</p>
                </div>
            </div>

            {/* ANALYTICS CHARTS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="card" style={{ height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Donor Availability by Blood Group</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bloodGroup" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="donors" fill="var(--primary)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card" style={{ height: '350px' }}>
                    <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Requests Fulfillment Ratio</h3>
                    {stats.activeRequests === 0 && stats.successfulDonations === 0 ? (
                        <p style={{ textAlign: 'center', marginTop: '4rem', color: '#888' }}>No request data available.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label>
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* VIEW SELECTOR & SEARCH */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn ${view === 'users' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setView('users')}
                    >
                        Users ({users.length})
                    </button>
                    <button
                        className={`btn ${view === 'requests' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setView('requests')}
                    >
                        Active Requests ({filteredRequests.length})
                    </button>
                    <button
                        className={`btn ${view === 'history' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setView('history')}
                    >
                        Fulfillment History ({donationHistory.length})
                    </button>
                </div>

                <input
                    type="text"
                    placeholder={`Search ${view}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', minWidth: '250px' }}
                />
            </div>

            {/* VIEW 1: USERS */}
            {view === 'users' && (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', background: '#fafafa' }}>
                                <th style={{ padding: '1rem' }}>Name / Contact</th>
                                <th style={{ padding: '1rem' }}>Blood Group</th>
                                <th style={{ padding: '1rem' }}>Location</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Type</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{u.name || 'N/A'}</strong><br />
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>{u.email}</span><br />
                                            <span style={{ fontSize: '0.85rem', color: '#666' }}>{u.phone || 'No phone'}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ background: '#ffebee', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                {u.bloodGroup || 'N/A'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                            {u.city ? `${u.city}, ${u.district || ''}` : u.state || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <select
                                                value={u.role || 'donor'}
                                                onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                            >
                                                <option value="donor">Donor</option>
                                                <option value="requester">Requester</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {u.role === 'donor' && (
                                                <select
                                                    value={u.donorType || 'volunteer'}
                                                    onChange={(e) => handleDonorTypeUpdate(u.id, e.target.value)}
                                                    style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #ccc', background: u.donorType === 'member' ? '#e8f5e9' : 'white' }}
                                                >
                                                    <option value="volunteer">Volunteer</option>
                                                    <option value="member">Verified Member</option>
                                                </select>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {u.available ? (
                                                <span style={{ color: 'green', fontSize: '0.85rem' }}>● Available</span>
                                            ) : (
                                                <span style={{ color: '#888', fontSize: '0.85rem' }}>○ Offline</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="btn btn-outline"
                                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderColor: '#d32f2f', color: '#d32f2f' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* VIEW 2: ACTIVE REQUESTS */}
            {view === 'requests' && (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', background: '#fafafa' }}>
                                <th style={{ padding: '1rem' }}>Patient / Urgency</th>
                                <th style={{ padding: '1rem' }}>Blood Group</th>
                                <th style={{ padding: '1rem' }}>Hospital / City</th>
                                <th style={{ padding: '1rem' }}>Contact</th>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No active requests found.</td>
                                </tr>
                            ) : (
                                filteredRequests.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{r.patientName}</strong><br />
                                            <span style={{ fontSize: '0.8rem', background: '#ffebee', color: '#d32f2f', padding: '2px 6px', borderRadius: '4px' }}>{r.urgency}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{r.bloodGroup}</span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {r.hospital}<br />
                                            <small style={{ color: '#666' }}>{r.city || r.state}</small>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{r.contact}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', background: r.status === 'confirmed' ? '#e3f2fd' : '#fff3e0', color: r.status === 'confirmed' ? '#1976d2' : '#f57c00' }}>
                                                {r.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setSelectedRequest(r)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#2e7d32', borderColor: '#2e7d32' }}
                                                >
                                                    Fulfill
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRequest(r.id)}
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderColor: '#d32f2f', color: '#d32f2f' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* VIEW 3: FULFILLMENT HISTORY */}
            {view === 'history' && (
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', background: '#fafafa' }}>
                                <th style={{ padding: '1rem' }}>Patient</th>
                                <th style={{ padding: '1rem' }}>Blood Group</th>
                                <th style={{ padding: '1rem' }}>Hospital</th>
                                <th style={{ padding: '1rem' }}>Fulfilled By (Donor)</th>
                                <th style={{ padding: '1rem' }}>Completed Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donationHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No fulfilled donations recorded yet.</td>
                                </tr>
                            ) : (
                                donationHistory.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem' }}><strong>{r.patientName}</strong></td>
                                        <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{r.bloodGroup}</td>
                                        <td style={{ padding: '1rem' }}>{r.hospital}, {r.city}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <strong>{r.donorName || 'Registered Donor'}</strong><br />
                                            <small style={{ color: '#666' }}>{r.donorPhone || ''}</small>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : 'Completed'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL: COMPLETE REQUEST */}
            {selectedRequest && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, color: '#2e7d32' }}>Complete Blood Request</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>
                            Assign the donor who donated for <strong>{selectedRequest.patientName}</strong> ({selectedRequest.bloodGroup}).
                        </p>

                        <input
                            type="text"
                            placeholder="Search donor by name or phone..."
                            value={donorSearch}
                            onChange={e => setDonorSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '1rem' }}
                        />

                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px', marginBottom: '1.5rem', padding: '0.5rem' }}>
                            {users
                                .filter(u => u.role === 'donor' && (u.name?.toLowerCase().includes(donorSearch.toLowerCase()) || u.phone?.includes(donorSearch)))
                                .map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => setSelectedDonorId(u.id)}
                                        style={{
                                            padding: '0.6rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            background: selectedDonorId === u.id ? '#e8f5e9' : 'transparent',
                                            border: selectedDonorId === u.id ? '1px solid #2e7d32' : '1px solid transparent',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <strong>{u.name}</strong> ({u.bloodGroup})<br />
                                            <small style={{ color: '#666' }}>{u.phone} • {u.city}</small>
                                        </div>
                                        {selectedDonorId === u.id && <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓</span>}
                                    </div>
                                ))
                            }
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setSelectedDonorId('');
                                    setDonorSearch('');
                                }}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!selectedDonorId}
                                onClick={handleCompleteDonation}
                                className="btn btn-primary"
                                style={{ background: '#2e7d32', borderColor: '#2e7d32' }}
                            >
                                Confirm Fulfillment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
