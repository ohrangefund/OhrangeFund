import {
  collection, query, where, limit, onSnapshot,
  addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, getDocs,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { Category } from '@/types/models';
import { CATEGORY_COLORS } from '@/types/models';

export function subscribeToCategories(
  userId: string,
  callback: (categories: Category[]) => void,
): () => void {
  const q = query(collection(db, 'categories'), where('user_id', '==', userId));
  return onSnapshot(q, (snap) => {
    const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    callback(categories);
  });
}

export async function createCategory(
  userId: string,
  data: { name: string; type: 'income' | 'expense'; color: string; icon: string },
): Promise<void> {
  await addDoc(collection(db, 'categories'), {
    user_id: userId,
    name: data.name,
    type: data.type,
    color: data.color,
    icon: data.icon,
    is_default: false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

export async function updateCategory(
  id: string,
  data: { name: string; color: string; icon: string },
): Promise<void> {
  await updateDoc(doc(db, 'categories', id), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id));
}

export async function hasTransactionsForCategory(userId: string, categoryId: string): Promise<boolean> {
  const q = query(
    collection(db, 'transactions'),
    where('user_id', '==', userId),
    where('category_id', '==', categoryId),
    limit(1),
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function deleteCategoryWithRedirect(userId: string, categoryId: string, redirectCategoryId: string): Promise<void> {
  const q = query(
    collection(db, 'transactions'),
    where('user_id', '==', userId),
    where('category_id', '==', categoryId),
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { category_id: redirectCategoryId, updated_at: serverTimestamp() });
  });
  batch.delete(doc(db, 'categories', categoryId));
  await batch.commit();
}

const CATEGORY_TEMPLATES = [
  { name: 'Salário',       type: 'income',  color: CATEGORY_COLORS[2], icon: 'briefcase'   },
  { name: 'Freelance',     type: 'income',  color: CATEGORY_COLORS[7], icon: 'trending-up' },
  { name: 'Investimentos', type: 'income',  color: CATEGORY_COLORS[1], icon: 'piggy-bank'  },
  { name: 'Alimentação',   type: 'expense', color: CATEGORY_COLORS[0], icon: 'utensils'    },
  { name: 'Transportes',   type: 'expense', color: CATEGORY_COLORS[4], icon: 'car'         },
  { name: 'Casa',          type: 'expense', color: CATEGORY_COLORS[6], icon: 'home'        },
  { name: 'Saúde',         type: 'expense', color: CATEGORY_COLORS[3], icon: 'heart-pulse' },
  { name: 'Lazer',         type: 'expense', color: CATEGORY_COLORS[5], icon: 'coffee'      },
] as const;

export async function seedCategoryTemplates(userId: string): Promise<void> {
  const batch = writeBatch(db);
  const col = collection(db, 'categories');

  for (const t of CATEGORY_TEMPLATES) {
    batch.set(doc(col), {
      user_id: userId,
      name: t.name,
      type: t.type,
      color: t.color,
      icon: t.icon,
      is_default: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }

  await batch.commit();
}

export async function createDefaultCategories(userId: string): Promise<void> {
  const batch = writeBatch(db);
  const col = collection(db, 'categories');

  const defaults = [
    { name: 'Outros', type: 'income',  color: CATEGORY_COLORS[2], icon: 'trending-up'   },
    { name: 'Outros', type: 'expense', color: CATEGORY_COLORS[3], icon: 'trending-down' },
  ] as const;

  for (const d of defaults) {
    batch.set(doc(col), {
      user_id: userId,
      name: d.name,
      type: d.type,
      color: d.color,
      icon: d.icon,
      is_default: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }

  await batch.commit();
  await seedCategoryTemplates(userId);
}
