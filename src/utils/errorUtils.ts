export function getFriendlyErrorMessage(error: any): string {
    const code = error.code || '';
    const message = error.message || '';

    switch (code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please log in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
            return 'No account found with this user. Please register first.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        case 'auth/invalid-credential':
            return 'Incorrect email or password.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'Sign-in cancelled.';
        case 'auth/requires-recent-login':
            return 'For security, please log out and log in again to perform this action.';
        default:
            // Fallback: If it's a firebase error with a message, try to clean it up
            if (message && message.includes('Firebase:')) {
                return message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim();
            }
            return message || 'An unexpected error occurred. Please try again.';
    }
}
