# LifeLine-108: Emergency Blood Donation Platform 🩸

> A modern, real-time platform connecting blood donors with patients in critical need.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

## 🌟 Key Features

### For Patients & Hospitals
- **One-Tap Emergency Request**: Instantly broadcast blood needs to nearby donors.
- **Smart Matching**: Automatically finds donors with compatible blood groups in the specific city.
- **Privacy First**: Contact details are shared securely in encrypted chat and audio rooms.

### For Donors
- **Real-Time Alerts**: Receive urgent requests from your city via native Firestore real-time listeners.
- **Impact Tracking**: See a history of every life you've saved ("Your Impact" Dashboard) with downloadable certificates.
- **Availability Toggle**: Go "Offline" when you can't donate to avoid unnecessary alerts.

### For Administrators
- **Powerful Dashboard**: Full control over users, roles, and requests.
- **Premium Analytics**: Visual charts for Donor Blood Group distribution and Activity Trends.
- **Verification System**: Mark requests as "Fulfilled" and verify genuine donations.
- **User Management**: Delete users, promote roles, or verify member donors.

---

## 🚀 Getting Started

This project is built with **Vite + React** and **Firebase** (Authentication & Cloud Firestore Realtime Database). Follow these steps to set up your own version.

### 1. Prerequisites
- Node.js (v18+)
- A Firebase Project (Free Spark plan is fine)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/lifeline-108.git

# Enter directory
cd lifeline-108

# Install dependencies
npm install
```

### 3. Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Enable **Authentication** (Email/Password and Google sign-in providers).
4. Enable **Cloud Firestore Database** (start in production or test mode).
5. Deploy or copy the contents of `firestore.rules` into your Firestore Rules editor.
6. Create a `.env` file in the root directory and add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run Locally

```bash
npm run dev
```
Visit `http://localhost:5173` to see the app.

---

## 📱 Mobile App (PWA)

This project is configured as a **Progressive Web App (PWA)**.
- Users can **install** it directly from their browser (Chrome/Safari) onto their phone.
- Examples: "Add to Home Screen" on iOS.
- Offers an App-like experience with no App Store fees.

## 📊 Admin Analytics

The admin panel includes professional charts powered by **Recharts**:
- **Pie Charts**: Analyze donor blood group demographics.
- **Bar Charts**: Track platform activity (Requests vs Donations).

---

## 💰 White Label / Resale Value

This codebase is clean, modular, and ready for deployment or customization.
- **Global Styling**: modify `src/styles/index.css` to change the entire color scheme in seconds.
- **Component Based**: Easy to swap out the Navbar, Footer, or Cards.
- **Firebase Backend**: Serverless architecture, scales automatically with real-time sync.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
