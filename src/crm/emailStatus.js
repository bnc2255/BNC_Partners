export const emailStatusLabels = {
  sending: 'Sending', accepted: 'Sent / awaiting delivery', delivered: 'Delivered',
  soft_bounce: 'Temporary bounce', hard_bounce: 'Bounced', failed: 'Send failed',
  unknown: 'Delivery unknown', complained: 'Spam complaint',
};

export function formatEmailDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : '-';
}
