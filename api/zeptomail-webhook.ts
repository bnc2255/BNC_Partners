import { zeptoMailWebhook } from '../server/zeptomail-webhook.mjs';

export const config = { runtime: 'edge' };

export default function handler(request: Request) {
  return zeptoMailWebhook(request, process.env);
}
