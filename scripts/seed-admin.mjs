/**
 * seed-admin.mjs
 * ─────────────────────────────────────────────────────────────────
 * Creates a dummy admin user in Firebase Auth + Firestore.
 *
 * Usage:
 *   node scripts/seed-admin.mjs
 *
 * Prerequisites:
 *   npm install firebase-admin   (already in devDependencies)
 *
 * After running:
 *   Email:    admin@smvitm.edu.in
 *   Password: Admin@1234
 *
 * ⚠️  Change the password after first login via Firebase Console
 *     Authentication → Users → admin@smvitm.edu.in → Reset password
 * ─────────────────────────────────────────────────────────────────
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account key
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '..', 'scholarship-81750-firebase-adminsdk-fbsvc-010f00ba5c.json'), 'utf-8')
);

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// Initialise Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db   = admin.firestore();

// ─── Dummy Admin Details ─────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@smvitm.edu.in';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME     = 'SMVITM Admin';
// ─────────────────────────────────────────────────────────────────

async function seedAdmin() {
  console.log('🌱  Seeding dummy admin user...\n');

  let uid;

  // 1. Create Firebase Auth user (skip if already exists)
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
    console.log(`ℹ️  Auth user already exists (uid: ${uid}). Skipping creation.`);
  } catch {
    const user = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      emailVerified: true,
    });
    uid = user.uid;
    console.log(`✅  Firebase Auth user created (uid: ${uid})`);
  }

  // 2. Write Firestore profile doc
  const userRef = db.collection('users').doc(uid);
  const snap    = await userRef.get();

  if (snap.exists) {
    console.log('ℹ️  Firestore profile already exists. Updating role to admin...');
    await userRef.update({ role: 'admin' });
  } else {
    await userRef.set({
      uid,
      name:       ADMIN_NAME,
      email:      ADMIN_EMAIL,
      role:       'admin',
      department: 'Administration',
      createdAt:  admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅  Firestore user profile created');
  }

  console.log('\n────────────────────────────────────────');
  console.log('🎉  Admin user ready!');
  console.log(`    Email   : ${ADMIN_EMAIL}`);
  console.log(`    Password: ${ADMIN_PASSWORD}`);
  console.log('    ⚠️   Change this password after first login!');
  console.log('────────────────────────────────────────\n');

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
