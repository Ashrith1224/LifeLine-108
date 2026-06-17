import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingNotifier from './components/FloatingNotifier';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import FindDonor from './pages/FindDonor';
import EmergencyRequest from './pages/EmergencyRequest';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyRequests from './pages/MyRequests';
import BloodBanks from './pages/BloodBanks';
import Contact from './pages/Contact';

import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AdminRoute from './components/AdminRoute';
import RequireProfile from './components/RequireProfile';
import NotificationListener from './components/NotificationListener';

function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationListener />
        <FloatingNotifier />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1, padding: '2rem 0' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blood-banks" element={<BloodBanks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/find-donor" element={
                <RequireProfile>
                  <FindDonor />
                </RequireProfile>
              } />
              <Route path="/emergency" element={
                <RequireProfile>
                  <EmergencyRequest />
                </RequireProfile>
              } />
              <Route path="/dashboard" element={
                <RequireProfile>
                  <Dashboard />
                </RequireProfile>
              } />
              <Route path="/my-requests" element={
                <RequireProfile>
                  <MyRequests />
                </RequireProfile>
              } />
              <Route path="/contact/:id" element={
                <RequireProfile>
                  <Contact />
                </RequireProfile>
              } />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
