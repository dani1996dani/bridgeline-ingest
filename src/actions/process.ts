export async function processProposal(id: string) {
  console.log(`[START] ${id} at ${new Date().toISOString()}`);
  await new Promise((r) => setTimeout(r, 10000));
  console.log(`[END] ${id} at ${new Date().toISOString()}`);
}
