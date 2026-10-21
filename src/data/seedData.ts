import { collection, doc, setDoc, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../services/firebase';

export const SAMPLE_DONORS = [
    {
        id: 'seed_donor_1',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+919876543210',
        bloodGroup: 'O+',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        city: 'Bangalore',
        role: 'donor',
        donorType: 'member',
        kycStatus: 'verified',
        available: true,
        emailVerified: true,
        lastDonationDate: '15 Jan 2026',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
        id: 'seed_donor_2',
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+919812345678',
        bloodGroup: 'A+',
        state: 'Maharashtra',
        district: 'Mumbai City',
        city: 'Mumbai',
        role: 'donor',
        donorType: 'volunteer',
        kycStatus: 'none',
        available: true,
        emailVerified: true,
        lastDonationDate: '02 Feb 2026',
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
        id: 'seed_donor_3',
        name: 'Amit Verma',
        email: 'amit.verma@example.com',
        phone: '+919845012345',
        bloodGroup: 'B+',
        state: 'Delhi',
        district: 'New Delhi',
        city: 'Delhi',
        role: 'donor',
        donorType: 'member',
        kycStatus: 'verified',
        available: true,
        emailVerified: true,
        lastDonationDate: '10 Dec 2025',
        createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
    },
    {
        id: 'seed_donor_4',
        name: 'Sneha Reddy',
        email: 'sneha.reddy@example.com',
        phone: '+919701234567',
        bloodGroup: 'O-',
        state: 'Telangana',
        district: 'Hyderabad',
        city: 'Hyderabad',
        role: 'donor',
        donorType: 'member',
        kycStatus: 'verified',
        available: true,
        emailVerified: true,
        lastDonationDate: '28 Jan 2026',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
        id: 'seed_donor_5',
        name: 'Karthik Raja',
        email: 'karthik.raja@example.com',
        phone: '+919444123456',
        bloodGroup: 'AB+',
        state: 'Tamil Nadu',
        district: 'Chennai',
        city: 'Chennai',
        role: 'donor',
        donorType: 'volunteer',
        kycStatus: 'none',
        available: true,
        emailVerified: true,
        lastDonationDate: '05 Mar 2026',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
    }
];

export const SAMPLE_REQUESTS = [
    {
        id: 'seed_req_1',
        patientName: 'Aarav Mehta',
        bloodGroup: 'O+',
        hospital: 'Apollo Hospital, Bannerghatta Road',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        city: 'Bangalore',
        contact: '9876543210',
        urgency: 'Critical',
        status: 'pending',
        requesterId: 'sample_requester_1',
        targetedDonorId: null,
        donorId: null,
        donorName: null,
        donorPhone: null,
        completedAt: null,
        acceptedBy: null,
        acceptedAt: null,
        confirmedBy: null,
        donorContact: null,
        acceptedDonors: {},
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
        id: 'seed_req_2',
        patientName: 'Sunita Deshmukh',
        bloodGroup: 'A+',
        hospital: 'Lilavati Hospital, Bandra West',
        state: 'Maharashtra',
        district: 'Mumbai City',
        city: 'Mumbai',
        contact: '9812345678',
        urgency: 'High',
        status: 'pending',
        requesterId: 'sample_requester_2',
        targetedDonorId: null,
        donorId: null,
        donorName: null,
        donorPhone: null,
        completedAt: null,
        acceptedBy: null,
        acceptedAt: null,
        confirmedBy: null,
        donorContact: null,
        acceptedDonors: {},
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString()
    },
    {
        id: 'seed_req_3',
        patientName: 'Ramesh Gupta',
        bloodGroup: 'B+',
        hospital: 'AIIMS, Ansari Nagar',
        state: 'Delhi',
        district: 'New Delhi',
        city: 'Delhi',
        contact: '9845012345',
        urgency: 'Medium',
        status: 'pending',
        requesterId: 'sample_requester_3',
        targetedDonorId: null,
        donorId: null,
        donorName: null,
        donorPhone: null,
        completedAt: null,
        acceptedBy: null,
        acceptedAt: null,
        confirmedBy: null,
        donorContact: null,
        acceptedDonors: {},
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
    },
    {
        id: 'seed_req_4',
        patientName: 'Meenakshi Iyer',
        bloodGroup: 'O-',
        hospital: 'NIMS, Panjagutta',
        state: 'Telangana',
        district: 'Hyderabad',
        city: 'Hyderabad',
        contact: '9701234567',
        urgency: 'Critical',
        status: 'pending',
        requesterId: 'sample_requester_4',
        targetedDonorId: null,
        donorId: null,
        donorName: null,
        donorPhone: null,
        completedAt: null,
        acceptedBy: null,
        acceptedAt: null,
        confirmedBy: null,
        donorContact: null,
        acceptedDonors: {},
        createdAt: new Date(Date.now() - 18 * 3600000).toISOString()
    }
];

export async function seedSampleData(): Promise<{ donorsCount: number; requestsCount: number }> {
    let donorsCount = 0;
    let requestsCount = 0;

    for (const donor of SAMPLE_DONORS) {
        await setDoc(doc(db, 'profiles', donor.id), donor, { merge: true });
        donorsCount++;
    }

    for (const req of SAMPLE_REQUESTS) {
        await setDoc(doc(db, 'requests', req.id), req, { merge: true });
        requestsCount++;
    }

    return { donorsCount, requestsCount };
}

export async function checkAndAutoSeed(): Promise<boolean> {
    try {
        const snap = await getDocs(query(collection(db, 'requests'), limit(1)));
        if (snap.empty) {
            await seedSampleData();
            return true;
        }
    } catch (e) {
        console.warn("Auto-seed check notice:", e);
    }
    return false;
}
