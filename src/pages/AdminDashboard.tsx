import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalDonors: 0,
        activeRequests: 0,
        successfulDonations: 0
    });

    const [users, setUsers] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]); // All requests
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
                fetchData();
            }
        }
    }, [currentUser, userRole, authLoading, navigate]);

    async function fetchData() {
        setLoading(true);
        try {
            // Fetch Users (Profiles)
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('*');
            if (usersError) throw usersError;

            const usersList = (usersData || []).map(u => ({
                ...u,
                bloodGroup: u.blood_group,
                donorType: u.donor_type
            }));
            setUsers(usersList);

            // Fetch Requests
            const { data: requestsData, error: requestsError } = await supabase
                .from('requests')
                .select('*');
            if (requestsError) throw requestsError;

            const requestsList = (requestsData || []).map(r => ({
                ...r,
                patientName: r.patient_name,
                bloodGroup: r.blood_group,
                createdAt: r.created_at,
                completedAt: r.completed_at,
                donorId: r.donor_id,
                donorName: r.donor_name,
                donorPhone: r.donor_phone
            }));
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
    }

    // User Actions
    async function handleDeleteUser(userId: string) {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;
            setUsers(users.filter(u => u.id !== userId));
            alert("User deleted");
        } catch (error) {
            console.error(error);
        }
    }

    async function handleRoleUpdate(userId: string, newRole: string) {
        if (!confirm(`Change role to ${newRole}?`)) return;
        try {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error(error);
        }
    }

    async function handleDonorTypeUpdate(userId: string, newType: string) {
        if (!confirm(`Change donor type to ${newType}?`)) return;
        try {
            const { error } = await supabase.from('profiles').update({ donor_type: newType }).eq('id', userId);
            if (error) throw error;
            setUsers(users.map(u => u.id === userId ? { ...u, donorType: newType } : u));
        } catch (error) {
            console.error(error);
        }
    }



    // Request Actions
    async function handleDeleteRequest(reqId: string) {
        if (!confirm("Delete this request?")) return;
        try {
            const { error } = await supabase.from('requests').delete().eq('id', reqId);
            if (error) throw error;
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
            const { error } = await supabase
                .from('requests')
                .update({
                    status: 'fulfilled',
                    donor_id: donor.id,
                    donor_name: donor.name,
                    donor_phone: donor.phone,
                    completed_at: new Date().toISOString()
                })
                .eq('id', selectedRequest.id);
            if (error) throw error;

            // Update local state
            setRequests(requests.map(r => r.id === selectedRequest.id ? {
                ...r,
                status: 'fulfilled',
                donorId: donor.id,
                donorName: donor.name,
                donorPhone: donor.phone,
                completedAt: new Date().toISOString()
            } : r));

            setSelectedRequest(null);
            setSelectedDonorId('');
            setDonorSearch('');
            alert("Donation recorded successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to update request");
        }
    }



    // Filtering
    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeRequests = requests.filter(r => r.status === 'pending');
    const donationHistory = requests.filter(r => r.status === 'fulfilled');

    // Filter Donors for format selection
    const availableDonors = users.filter(u =>
        u.role === 'donor' &&
        (u.name?.toLowerCase().includes(donorSearch.toLowerCase()) || u.bloodGroup === selectedRequest?.bloodGroup)
    );

    const downloadUsersCSV = () => {
        const headers = ["Name", "Email", "Role", "Blood Group", "Phone"];
        const rows = users.map(u => [u.name, u.email, u.role, u.bloodGroup, u.phone]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "donors.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--dark)', margin: 0 }}>Admin Dashboard</h1>
                <button onClick={() => navigate('/my-requests')} className="btn btn-outline" style={{ fontSize: '0.9rem' }}>
                    My Activity
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div onClick={() => setView('users')} className="card" style={{ borderLeft: '5px solid var(--primary)', cursor: 'pointer' }}>
                    <h3>{stats.totalDonors}</h3>
                    <p style={{ color: '#666' }}>Total Donors</p>
                </div>
                <div onClick={() => setView('requests')} className="card" style={{ borderLeft: '5px solid #d32f2f', cursor: 'pointer' }}>
                    <h3>{stats.activeRequests}</h3>
                    <p style={{ color: '#666' }}>Pending Requests</p>
                </div>
                <div onClick={() => setView('history')} className="card" style={{ borderLeft: '5px solid #2e7d32', cursor: 'pointer' }}>
                    <h3>{stats.successfulDonations}</h3>
                    <p style={{ color: '#666' }}>Successful Donations</p>
                </div>
            </div>

            {/* ANALYTICS CHARTS (New Premium Feature) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="card glass" style={{ minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: '#555' }}>Blood Group Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={users.filter(u => u.role === 'donor').reduce((acc: any[], user) => {
                                    const existing = acc.find(a => a.name === user.bloodGroup);
                                    if (existing) existing.value++;
                                    else acc.push({ name: user.bloodGroup, value: 1 });
                                    return acc;
                                }, [])}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label
                            >
                                {users.map((_entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#f44336'][index % 8]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="card glass" style={{ minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: '#555' }}>Activity Overview</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={[
                                { name: 'Active Requests', value: stats.activeRequests },
                                { name: 'Completed Donations', value: stats.successfulDonations },
                                { name: 'Total Donors', value: stats.totalDonors }
                            ]}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#d32f2f" barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ marginBottom: '2rem', borderBottom: '1px solid #ddd', display: 'flex', gap: '2rem' }}>
                <button
                    onClick={() => setView('users')}
                    style={{
                        padding: '1rem 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: view === 'users' ? '3px solid var(--primary)' : 'none',
                        fontWeight: view === 'users' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        color: view === 'users' ? 'var(--primary)' : '#666'
                    }}
                >
                    Manage Users
                </button>
                <button
                    onClick={() => setView('requests')}
                    style={{
                        padding: '1rem 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: view === 'requests' ? '3px solid var(--primary)' : 'none',
                        fontWeight: view === 'requests' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        color: view === 'requests' ? 'var(--primary)' : '#666'
                    }}
                >
                    Active Requests ({activeRequests.length})
                </button>
                <button
                    onClick={() => setView('history')}
                    style={{
                        padding: '1rem 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: view === 'history' ? '3px solid var(--primary)' : 'none',
                        fontWeight: view === 'history' ? 'bold' : 'normal',
                        cursor: 'pointer',
                        color: view === 'history' ? 'var(--primary)' : '#666'
                    }}
                >
                    Donation History
                </button>
            </div>

            {/* Content Area */}
            <div className="card glass">
                {loading ? <p>Loading data...</p> : (
                    <>
                        {/* VIEW 1: USERS */}
                        {view === 'users' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                    <button onClick={downloadUsersCSV} className="btn btn-outline" style={{ fontSize: '0.9rem' }}>Export CSV</button>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: '#f5f5f5' }}>
                                                <th style={{ padding: '1rem' }}>Name/Email</th>
                                                <th style={{ padding: '1rem' }}>Role</th>
                                                <th style={{ padding: '1rem' }}>Blood</th>
                                                <th style={{ padding: '1rem' }}>Status</th>
                                                <th style={{ padding: '1rem' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map((user: any) => (
                                                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '1rem' }}>{user.name}<br /><small>{user.email}</small></td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <select value={user.role} onChange={(e) => handleRoleUpdate(user.id, e.target.value)} style={{ padding: '0.3rem', marginBottom: '0.5rem', display: 'block' }}>
                                                            <option value="donor">Donor</option>
                                                            <option value="patient">Patient</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="banned">Banned</option>
                                                        </select>
                                                        {user.role === 'donor' && (
                                                            <select value={user.donorType || 'volunteer'} onChange={(e) => handleDonorTypeUpdate(user.id, e.target.value)} style={{ padding: '0.3rem', background: user.donorType === 'member' ? '#e8f5e9' : 'white', borderRadius: '4px', border: '1px solid #ccc' }}>
                                                                <option value="volunteer">Volunteer</option>
                                                                <option value="member">⭐ Member</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{user.bloodGroup}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {user.role === 'donor' ? (
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                background: user.available ? '#e8f5e9' : '#f5f5f5',
                                                                color: user.available ? '#2e7d32' : '#757575',
                                                                fontWeight: '600',
                                                                fontSize: '0.85rem',
                                                                border: `1px solid ${user.available ? '#c8e6c9' : '#e0e0e0'}`
                                                            }}>
                                                                {user.available ? '● Active' : '○ Inactive'}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button onClick={() => handleDeleteUser(user.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* VIEW 2: REQUESTS */}
                        {view === 'requests' && (
                            <div>
                                {activeRequests.length === 0 ? <p>No pending requests.</p> : (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {activeRequests.map((req: any) => (
                                            <div key={req.id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, color: '#d32f2f' }}>{req.patientName} ({req.bloodGroup})</h4>
                                                    <p style={{ margin: '0.2rem 0', fontSize: '0.9rem' }}>{req.hospital}, {req.city}</p>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Posted: {new Date(req.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => setSelectedRequest(req)}
                                                        className="btn"
                                                        style={{ background: '#2e7d32', color: 'white', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                                    >
                                                        Mark Done
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRequest(req.id)}
                                                        className="btn"
                                                        style={{ background: '#d32f2f', color: 'white', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* VIEW 3: HISTORY */}
                        {view === 'history' && (
                            <div>
                                {donationHistory.length === 0 ? <p>No completed donations yet.</p> : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ background: '#e8f5e9' }}>
                                                    <th style={{ padding: '1rem' }}>Date</th>
                                                    <th style={{ padding: '1rem' }}>Patient Name</th>
                                                    <th style={{ padding: '1rem', color: '#2e7d32' }}>Matched Donor</th>
                                                    <th style={{ padding: '1rem' }}>Blood Group</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {donationHistory.map((req: any) => (
                                                    <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td style={{ padding: '1rem' }}>{new Date(req.completedAt || req.createdAt).toLocaleDateString()}</td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <strong>{req.patientName}</strong><br />
                                                            <small>{req.hospital}</small>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{req.donorName || 'Unknown'}</span><br />
                                                            <small>{req.donorPhone}</small>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span style={{ fontWeight: 'bold', background: '#ffebee', color: '#c62828', padding: '2px 6px', borderRadius: '4px' }}>{req.bloodGroup}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>


            {/* MODAL: Select Donor */}
            {selectedRequest && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                        <h3>Select Donor for {selectedRequest.patientName}</h3>
                        <p style={{ marginBottom: '1rem', color: '#666' }}>Who donated blood for this request?</p>

                        <input
                            type="text"
                            placeholder="Search donor by name..."
                            value={donorSearch}
                            onChange={(e) => setDonorSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            autoFocus
                        />

                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', marginBottom: '1rem', borderRadius: '4px' }}>
                            {availableDonors.length === 0 ? (
                                <p style={{ padding: '1rem', color: '#999', textAlign: 'center' }}>No donors found matching "{donorSearch}" or {selectedRequest.bloodGroup}</p>
                            ) : (
                                availableDonors.map(d => (
                                    <div
                                        key={d.id}
                                        onClick={() => setSelectedDonorId(d.id)}
                                        style={{
                                            padding: '0.8rem',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                            background: selectedDonorId === d.id ? '#e8f5e9' : 'white',
                                            display: 'flex', justifyContent: 'space-between'
                                        }}
                                    >
                                        <span>{d.name} <small style={{ color: '#777' }}>({d.bloodGroup})</small></span>
                                        {selectedDonorId === d.id && <span>✅</span>}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setSelectedRequest(null); setSelectedDonorId(''); }}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCompleteDonation}
                                className="btn"
                                style={{ background: '#2e7d32', color: 'white' }}
                                disabled={!selectedDonorId}
                            >
                                Confirm Donation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
