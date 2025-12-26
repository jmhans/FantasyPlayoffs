'use server';

import { db } from '@/app/lib/db';
import { participants } from '@/app/lib/db/schema';
import { revalidatePath } from 'next/cache';

export async function createParticipant(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const auth0Id = formData.get('auth0Id') as string;

  if (!name) {
    return { error: 'Name is required' };
  }

  try {
    await db.insert(participants).values({
      name,
      email: email || null,
      auth0Id: auth0Id || null,
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to create participant:', error);
    return { error: 'Failed to create participant' };
  }
}
