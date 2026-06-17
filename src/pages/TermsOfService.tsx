const TermsOfService = () => {
    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem', color: 'var(--primary)' }}>Terms of Service</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Last updated: {new Date().toLocaleDateString()}</p>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
                <p>By accessing and using LifeLine-108, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>2. Medical Disclaimer</h2>
                <p><strong>LifeLine-108 is not a medical organization.</strong> We do not provide medical advice, diagnosis, or treatment. We simply connect donors with patients. Verification of donor eligibility and safety is the responsibility of the medical professionals and parties involved.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>3. User Conduct</h2>
                <p>You agree not to use the service for any unlawful purpose or to submit false emergency requests. Misuse of the platform may result in immediate termination of your account.</p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>4. Limitation of Liability</h2>
                <p>In no event shall LifeLine-108 be liable for any damages arising out of the use or inability to use the services.</p>
            </section>
        </div>
    );
};

export default TermsOfService;
