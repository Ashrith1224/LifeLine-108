export function getFriendlyErrorMessage(error: any): string {
    if (!error) return 'An unexpected error occurred. Please try again.';

    const message = error.message || '';
    const code = error.code || '';

    // Standard Firebase Auth Error Codes
    switch (code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please log in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-not-found':
            return 'No account found with this email. Please register first.';
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
            return 'Sign-in popup was cancelled.';
        case 'auth/requires-recent-login':
            return 'For security, please log out and log in again to perform this action.';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled. Please contact support.';
        case 'auth/expired-action-code':
            return 'The action code or reset link has expired. Please request a new one.';
        case 'auth/invalid-action-code':
            return 'The action code or reset link is invalid. Please request a new one.';
        case 'permission-denied':
            return 'You do not have permission to perform this action.';
        case 'unavailable':
            return 'The service is currently unavailable. Please check your connection and try again.';
        default:
            if (message && message.includes('Firebase:')) {
                return message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim();
            }
            return message || 'An unexpected error occurred. Please try again.';
    }
}
