import { followUpHandler } from '../server/follow-up.mjs';

export const config = { runtime: 'edge' };

export default function handler(request: Request) {
  return followUpHandler(request, process.env);
}
