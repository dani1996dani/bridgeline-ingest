'use server';

import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { ProposalStatus } from '@/generated/prisma/enums';

export async function uploadProposals(formData: FormData) {
  const files = formData.getAll('files') as File[];

  if (!files.length) throw new Error('No files provided');

  const results = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Deduplication using sha256 hash
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Check if exists
    const existing = await prisma.proposal.findUnique({ where: { hash } });
    if (existing) {
      results.push({
        fileName: file.name,
        status: 'DUPLICATE',
        id: existing.id,
      });
      continue;
    }

    // Upload to Supabase
    const path = `${hash}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabase.storage
      .from('proposals')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (error) {
      console.error('Upload error:', error);
      results.push({ fileName: file.name, status: 'ERROR' });
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('proposals').getPublicUrl(path);

    // Create DB Record
    const proposal = await prisma.proposal.create({
      data: {
        hash,
        fileName: file.name,
        fileUrl: publicUrl,
        status: ProposalStatus.PENDING,
      },
    });

    results.push({ fileName: file.name, status: 'SUCCESS', id: proposal.id });
  }

  revalidatePath('/dashboard');
  return { success: true, results };
}
