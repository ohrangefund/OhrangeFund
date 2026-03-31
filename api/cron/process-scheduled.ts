import * as admin from 'firebase-admin';

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

type Recurrence = 'once' | 'weekly' | 'monthly' | 'yearly';

function calcNextDate(current: Date, recurrence: Recurrence): Date {
  const next = new Date(current);
  if (recurrence === 'weekly') next.setDate(next.getDate() + 7);
  if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1);
  if (recurrence === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

async function processScheduledTransactions(now: admin.firestore.Timestamp): Promise<number> {
  const snap = await db.collection('scheduled_transactions')
    .where('next_date', '<=', now)
    .get();

  let processed = 0;

  for (const schedDoc of snap.docs) {
    const sched = schedDoc.data();
    try {
      await db.runTransaction(async (txn) => {
        const accountRef = db.collection('accounts').doc(sched.account_id);
        const accountSnap = await txn.get(accountRef);
        if (!accountSnap.exists) return;

        const currentBalance = accountSnap.data()!.balance as number;
        const delta = sched.type === 'income' ? sched.amount : -sched.amount;

        // Create the real transaction
        const txRef = db.collection('transactions').doc();
        txn.set(txRef, {
          user_id: sched.user_id,
          account_id: sched.account_id,
          category_id: sched.category_id,
          type: sched.type,
          amount: sched.amount,
          description: sched.description,
          date: sched.next_date,
          source: 'manual',
          external_id: null,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update account balance
        txn.update(accountRef, {
          balance: currentBalance + delta,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update or delete the scheduled item
        if (sched.recurrence === 'once') {
          txn.delete(schedDoc.ref);
        } else {
          const nextDate = calcNextDate(sched.next_date.toDate(), sched.recurrence as Recurrence);
          const nextTimestamp = admin.firestore.Timestamp.fromDate(nextDate);
          const expired = sched.end_date && nextTimestamp > sched.end_date;
          if (expired) {
            txn.delete(schedDoc.ref);
          } else {
            txn.update(schedDoc.ref, { next_date: nextTimestamp });
          }
        }
      });
      processed++;
    } catch (err) {
      console.error(`Failed to process scheduled_transaction ${schedDoc.id}:`, err);
    }
  }

  return processed;
}

async function processScheduledTransfers(now: admin.firestore.Timestamp): Promise<number> {
  const snap = await db.collection('scheduled_transfers')
    .where('next_date', '<=', now)
    .get();

  let processed = 0;

  for (const schedDoc of snap.docs) {
    const sched = schedDoc.data();
    try {
      await db.runTransaction(async (txn) => {
        const fromRef = db.collection('accounts').doc(sched.from_account_id);
        const toRef = db.collection('accounts').doc(sched.to_account_id);
        const fromSnap = await txn.get(fromRef);
        const toSnap = await txn.get(toRef);
        if (!fromSnap.exists || !toSnap.exists) return;

        const fromBalance = fromSnap.data()!.balance as number;
        const toBalance = toSnap.data()!.balance as number;

        // Create the real transfer
        const transferRef = db.collection('transfers').doc();
        txn.set(transferRef, {
          user_id: sched.user_id,
          from_account_id: sched.from_account_id,
          to_account_id: sched.to_account_id,
          account_ids: [sched.from_account_id, sched.to_account_id],
          amount: sched.amount,
          description: sched.description,
          date: sched.next_date,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update both balances
        txn.update(fromRef, {
          balance: fromBalance - sched.amount,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        txn.update(toRef, {
          balance: toBalance + sched.amount,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update or delete the scheduled item
        if (sched.recurrence === 'once') {
          txn.delete(schedDoc.ref);
        } else {
          const nextDate = calcNextDate(sched.next_date.toDate(), sched.recurrence as Recurrence);
          const nextTimestamp = admin.firestore.Timestamp.fromDate(nextDate);
          const expired = sched.end_date && nextTimestamp > sched.end_date;
          if (expired) {
            txn.delete(schedDoc.ref);
          } else {
            txn.update(schedDoc.ref, { next_date: nextTimestamp });
          }
        }
      });
      processed++;
    } catch (err) {
      console.error(`Failed to process scheduled_transfer ${schedDoc.id}:`, err);
    }
  }

  return processed;
}

export default async function handler(req: any, res: any) {
  // Verify this is a legitimate cron invocation from Vercel
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = admin.firestore.Timestamp.now();
    const [transactions, transfers] = await Promise.all([
      processScheduledTransactions(now),
      processScheduledTransfers(now),
    ]);
    console.log(`Cron completed: ${transactions} transactions, ${transfers} transfers processed.`);
    return res.status(200).json({ ok: true, transactions, transfers });
  } catch (err) {
    console.error('Cron fatal error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
