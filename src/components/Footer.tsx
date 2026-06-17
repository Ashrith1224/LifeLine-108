import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>LifeLine-108</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                            Connecting blood donors with patients in real-time. Join our mission to save lives.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '1rem' }}>Quick Links</h4>
                        <Link to="/" className="footer-link">Home</Link>
                        <Link to="/find-donor" className="footer-link">Find Donor</Link>
                        <Link to="/register" className="footer-link">Become a Donor</Link>
                    </div>

                    <div>
                        <h4 style={{ marginBottom: '1rem' }}>Legal</h4>
                        <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                        <Link to="/terms" className="footer-link">Terms of Service</Link>
                    </div>
                </div>

                <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    &copy; {new Date().getFullYear()} LifeLine-108. Built for humanity.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
