import { supabase } from '../lib/supabaseClient';

export async function followUpRequest(body) {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error('Please sign in as an admin before generating a follow-up.');
  const response = await fetch('/api/follow-up', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(body),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The follow-up API is unavailable. Restart the dev server or check the Vercel function.');
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not complete the follow-up request.');
  return result;
}
