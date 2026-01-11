'use server';

import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { ProposalStatus } from '@/generated/prisma/enums';
import { SUPPORTED_FILE_TYPE_MAP } from '@/lib/supportedFileTypes';

export async function uploadProposals(formData: FormData) {
  const files = formData.getAll('files') as File[];

  if (!files.length) {
    return { success: false, error: 'No files provided', results: [] };
  }

  let results = [];
  const proposalsToInsert = [];

  for (const file of files) {
    if (!SUPPORTED_FILE_TYPE_MAP[file.type]) {
      results.push({
        fileName: file.name,
        status: 'FAILED',
        reason: 'UNSUPPORTED_FILE_TYPE',
      });
      continue;
    }
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

    proposalsToInsert.push({
      hash,
      fileName: file.name,
      // adding fallback because not all browsers send the mimetype
      mimeType: file.type || 'application/octet-stream',
      fileUrl: publicUrl,
      status: ProposalStatus.PENDING,
    });
  }

  // Create DB Record
  if (proposalsToInsert.length > 0) {
    const proposals = await prisma.proposal.createMany({
      data: proposalsToInsert,
    });

    if (proposals.count === 0) {
      return { success: false, error: 'Failed to upload proposals.' };
    }

    const fetchedProposals = await prisma.proposal.findMany({
      where: { hash: { in: proposalsToInsert.map((x) => x.hash) } },
      select: { id: true, hash: true, fileName: true },
    });

    const proposalsToReturn = fetchedProposals.map(({ id, fileName }) => {
      return {
        id,
        fileName,
        status: 'SUCCESS',
      };
    });

    results = [...results, ...proposalsToReturn];
  }

  revalidatePath('/dashboard');
  return { success: true, results: results };
}
