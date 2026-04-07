import * as admin from 'firebase-admin';
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:8082',
  'https://ohrangefund.vercel.app',
];

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate caller
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const idToken = authHeader.split('Bearer ')[1];

  let callerUid: string;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // 2. Parse body
  const { accountId, inviteeEmail } = (req.body ?? {}) as {
    accountId?: string;
    inviteeEmail?: string;
  };

  if (!accountId || !inviteeEmail) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // 3. Verify caller is account owner
  const accountSnap = await db.collection('accounts').doc(accountId).get();
  if (!accountSnap.exists || accountSnap.data()?.user_id !== callerUid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const accountName: string = accountSnap.data()?.name ?? '';

  // 4. Look up invitee by email
  let inviteeUid: string;
  let inviteeEmail_: string;
  try {
    const inviteeUser = await admin.auth().getUserByEmail(inviteeEmail.trim().toLowerCase());
    inviteeUid = inviteeUser.uid;
    inviteeEmail_ = inviteeUser.email ?? inviteeEmail.trim().toLowerCase();
  } catch {
    return res.status(404).json({ error: 'USER_NOT_FOUND' });
  }

  // 5. Can't invite yourself
  if (inviteeUid === callerUid) {
    return res.status(400).json({ error: 'SELF_INVITE' });
  }

  // 6. Check not already a member (pending or accepted)
  const memberId = `${accountId}_${inviteeUid}`;
  const existing = await db.collection('account_members').doc(memberId).get();
  if (existing.exists) {
    return res.status(409).json({ error: 'ALREADY_MEMBER' });
  }

  // 7. Get caller email for display in the invite
  const callerUser = await admin.auth().getUser(callerUid);
  const ownerEmail = callerUser.email ?? '';

  // 8. Create pending invitation (compound ID: {accountId}_{inviteeUid})
  await db.collection('account_members').doc(memberId).set({
    account_id: accountId,
    account_name: accountName,
    user_id: inviteeUid,
    owner_id: callerUid,
    owner_email: ownerEmail,
    invitee_email: inviteeEmail_,
    status: 'pending',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return res.status(200).json({ success: true });
}
