import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }: { children: any }) => {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading...</div>;
    }

    // Check if user is logged in AND has 'admin' role
    if (!currentUser || userRole !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AdminRoute;
