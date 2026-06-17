import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple .env parser
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove surrounding quotes if any
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file.');
  console.error('Please obtain the service_role key from Settings -> API in your Supabase Dashboard.');
  process.exit(1);
}

// Check for Firebase Service Account file
const firebaseServiceAccountPath = path.join(__dirname, 'firebase-service-account.json');
if (!fs.existsSync(firebaseServiceAccountPath)) {
  console.error('\nError: firebase-service-account.json not found in the root directory.');
  console.error('Please download it from Firebase Console -> Project Settings -> Service Accounts,');
  console.error('rename it to "firebase-service-account.json", and place it in the root folder.\n');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync(firebaseServiceAccountPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();
const auth = admin.auth();

// Initialize Supabase Client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

// Helper: Convert Firebase 28-char UID to standard UUID deterministically
function toUUID(firebaseId) {
  if (!firebaseId) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(firebaseId)) return firebaseId;

  const hash = crypto.createHash('sha256').update(firebaseId).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // version 4
    'a' + hash.substring(17, 20), // variant 10xx
    hash.substring(20, 32)
  ].join('-');
}

// Helper: Map dates/timestamps to ISO strings
function toTimestamp(val) {
  if (!val) return null;
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (val._seconds) {
    return new Date(val._seconds * 1000).toISOString();
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  if (typeof val === 'string') {
    return new Date(val).toISOString();
  }
  return null;
}

// Helper: Map dates to numeric milliseconds for BigInt
function toBigInt(val) {
  if (!val) return null;
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate().getTime();
  }
  if (val._seconds) {
    return val._seconds * 1000;
  }
  return Number(val);
}

async function migrateUsers() {
  console.log('--- Migrating Users ---');
  let usersMigrated = 0;
  let pageToken;

  do {
    const listUsersResult = await auth.listUsers(1000, pageToken);
    for (const userRecord of listUsersResult.users) {
      const uuid = toUUID(userRecord.uid);
      console.log(`Migrating user: ${userRecord.email || userRecord.uid} (${uuid})`);

      // Check if user already exists in Supabase
      const { data: existingUser } = await supabase.auth.admin.getUserById(uuid);
      if (existingUser && existingUser.user) {
        console.log(`  User already exists in Supabase Auth, skipping creation.`);
        continue;
      }

      // Create user in Supabase Auth
      const { error } = await supabase.auth.admin.createUser({
        id: uuid,
        email: userRecord.email,
        email_confirm: userRecord.emailVerified || true,
        password: 'MigratedTemporaryPassword123!', // placeholder password
        user_metadata: {
          name: userRecord.displayName || '',
          full_name: userRecord.displayName || ''
        }
      });

      if (error) {
        console.error(`  Error creating auth user:`, error.message);
      } else {
        usersMigrated++;
      }
    }
    pageToken = listUsersResult.pageToken;
  } while (pageToken);

  console.log(`Successfully migrated ${usersMigrated} Auth users.\n`);
}

async function migrateProfiles() {
  console.log('--- Migrating User Profiles ---');
  const snapshot = await firestore.collection('users').get();
  let profilesMigrated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const uuid = toUUID(doc.id);
    console.log(`Migrating profile for doc ID: ${doc.id} (${uuid})`);

    const profile = {
      id: uuid,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      blood_group: data.bloodGroup || '',
      state: data.state || '',
      district: data.district || '',
      city: data.city || '',
      role: data.role || 'donor',
      donor_type: data.donorType || 'volunteer',
      kyc_status: data.kycStatus || 'none',
      available: data.available !== undefined ? data.available : true,
      email_verified: data.emailVerified || false,
      created_at: toTimestamp(data.createdAt) || new Date().toISOString()
    };

    const { error } = await supabase.from('profiles').upsert(profile);
    if (error) {
      console.error(`  Error upserting profile:`, error.message);
    } else {
      profilesMigrated++;
    }
  }

  console.log(`Successfully migrated ${profilesMigrated} profiles.\n`);
}

async function migrateRequestsAndChats() {
  console.log('--- Migrating Requests and Messages ---');
  const snapshot = await firestore.collection('requests').get();
  let requestsMigrated = 0;
  let totalMessagesMigrated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const requestId = toUUID(doc.id);
    console.log(`Migrating request: ${doc.id} (${requestId})`);

    const request = {
      id: requestId,
      patient_name: data.patientName || '',
      blood_group: data.bloodGroup || '',
      hospital: data.hospital || '',
      state: data.state || '',
      district: data.district || '',
      city: data.city || '',
      contact: data.contact || '',
      urgency: data.urgency || 'Critical',
      status: data.status || 'pending',
      requester_id: toUUID(data.requesterId),
      targeted_donor_id: toUUID(data.targetedDonorId),
      donor_id: toUUID(data.donorId),
      donor_name: data.donorName || null,
      donor_phone: data.donorPhone || null,
      completed_at: toTimestamp(data.completedAt),
      accepted_by: toUUID(data.acceptedBy),
      accepted_at: toTimestamp(data.acceptedAt),
      confirmed_by: toUUID(data.confirmedBy),
      donor_contact: data.donorContact || null,
      accepted_donors: data.acceptedDonors || {},
      last_message_at: toBigInt(data.lastMessageAt),
      last_message_by: toUUID(data.lastMessageBy),
      last_message_text: data.lastMessageText || null,
      created_at: toTimestamp(data.createdAt) || new Date().toISOString()
    };

    const { error } = await supabase.from('requests').upsert(request);
    if (error) {
      console.error(`  Error upserting request:`, error.message);
      continue;
    }
    requestsMigrated++;

    // Fetch nested chat messages inside this request
    const messagesSnapshot = await doc.ref.collection('messages').get();
    let requestMessagesCount = 0;
    
    for (const msgDoc of messagesSnapshot.docs) {
      const msgData = msgDoc.data();
      const messageId = toUUID(msgDoc.id);

      const message = {
        id: messageId,
        request_id: requestId,
        sender_id: toUUID(msgData.senderId),
        text: msgData.text || '',
        created_at: toBigInt(msgData.createdAt) || Date.now()
      };

      const { error: msgError } = await supabase.from('messages').upsert(message);
      if (msgError) {
        console.error(`    Error upserting message ${msgDoc.id}:`, msgError.message);
      } else {
        requestMessagesCount++;
        totalMessagesMigrated++;
      }
    }
    if (requestMessagesCount > 0) {
      console.log(`    Migrated ${requestMessagesCount} chat messages for this request.`);
    }
  }

  console.log(`Successfully migrated ${requestsMigrated} requests and ${totalMessagesMigrated} total chat messages.\n`);
}

async function migrateReports() {
  console.log('--- Migrating Reports ---');
  const snapshot = await firestore.collection('reports').get();
  let reportsMigrated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const reportId = toUUID(doc.id);
    console.log(`Migrating report: ${doc.id} (${reportId})`);

    const report = {
      id: reportId,
      target_user_id: toUUID(data.targetUserId),
      target_name: data.targetName || '',
      reason: data.reason || '',
      status: data.status || 'pending',
      timestamp: toTimestamp(data.timestamp) || new Date().toISOString()
    };

    const { error } = await supabase.from('reports').upsert(report);
    if (error) {
      console.error(`  Error upserting report:`, error.message);
    } else {
      reportsMigrated++;
    }
  }

  console.log(`Successfully migrated ${reportsMigrated} reports.\n`);
}

async function main() {
  try {
    console.log('🚀 Starting Firebase to Supabase Data Migration...\n');
    await migrateUsers();
    await migrateProfiles();
    await migrateRequestsAndChats();
    await migrateReports();
    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
}

main();
