import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireProfile({ children }: { children: any }) {
    const { currentUser, isProfileComplete, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>; // Or a nice spinner
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If profile is NOT complete, force them to /profile
    if (!isProfileComplete) {
        // Pass "mode=onboarding" to let Profile page know we are in forced mode
        return <Navigate to="/profile?mode=onboarding" replace />;
    }

    return children;
}
