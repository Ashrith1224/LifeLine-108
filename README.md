# LifeLine-108: Emergency Blood Donation Platform 🩸

> A modern, real-time platform connecting blood donors with patients in critical need.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

## 🌟 Key Features

### For Patients & Hospitals
- **One-Tap Emergency Request**: Instantly broadcast blood needs to nearby donors.
- **Smart Matching**: Automatically finds donors with compatible blood groups in the specific city.
- **Privacy First**: Contact details are shared securely.

### For Donors
- **Real-Time Alerts**: Receive urgent requests from your city.
- **Impact Tracking**: See a history of every life you've saved ("Your Impact" Dashboard).
- **Availability Toggle**: Go "Offline" when you can't donate to avoid spam.

### For Administrators
- **Powerful Dashboard**: Full control over users, roles, and requests.
- **Premium Analytics**: Visual charts for Donor Blood Group distribution and Activity Trends.
- **Verification System**: Mark requests as "Fulfilled" and verify genuine donations.
- **User Management**: Ban/Delete users or promote them to Admin.

---

## 🚀 Getting Started

This project is built with **Vite + React** and **Supabase** (PostgreSQL database & authentication). Follow these steps to set up your own white-label version.

### 1. Prerequisites
- Node.js (v18+)
- A Supabase Project (Free Tier is fine)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/lifeline-108.git

# Enter directory
cd lifeline-108

# Install dependencies
npm install
```

### 3. Database Setup (Supabase)

1. Go to the [Supabase Console](https://supabase.com/).
2. Create a new project.
3. Go to the **SQL Editor** in your Supabase dashboard and run the entire contents of the `supabase_schema.sql` file. This will automatically create all database tables, trigger functions, RLS security policies, and register tables for Realtime communication.
4. Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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

This codebase is clean, modular, and ready for resale or client delivery.
- **Global Styling**: modify `src/styles/index.css` to change the entire color scheme in seconds.
- **Component Based**: Easy to swap out the Navbar, Footer, or Cards.
- **Supabase Backend**: No server maintenance required. Scales automatically.

---

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
