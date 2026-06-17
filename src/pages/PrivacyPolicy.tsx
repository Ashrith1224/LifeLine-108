const PrivacyPolicy = () => {
    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem', color: 'var(--primary)' }}>Privacy Policy</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Last updated: {new Date().toLocaleDateString()}</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Information We Collect</h2>
                <p>To facilitate blood donations, we may collect:</p>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li>Personal Information: Name, Email, Phone Number.</li>
                    <li>Medical Information: Blood Group.</li>
                    <li>Location Data: City, State, or precise location for donor matching.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. How We Use Your Data</h2>
                <p>We use your data solely to connect blood donors with patients in need. We do not sell your personal data to third parties.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. Data Sharing</h2>
                <p>Your contact information (Phone Number) may be shared with registered users who have a verified emergency need matching your blood group and location.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>4. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at support@lifeline108.com.</p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
