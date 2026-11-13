// Each recipient has a separate draft and delivery request. Limit provider load,
// collect individual outcomes, and never retry a delivery automatically.
export async function runFollowUpBatch(items, worker, onResult, concurrency = 3) {
  let cursor = 0;
  const results = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      let result;
      try { result = { item, status: 'fulfilled', value: await worker(item) }; }
      catch (error) { result = { item, status: 'rejected', error }; }
      results[index] = result;
      onResult?.(result);
    }
  }));
  return results;
}
