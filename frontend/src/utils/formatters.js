/**
 * Format a hexadecimal Ethereum address to shortened display form (e.g., 0x7A3...91F)
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Format epoch timestamp (in seconds or ms) into human-readable date/time
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return 'N/A';
  const ms = Number(timestamp) < 10000000000 ? Number(timestamp) * 1000 : Number(timestamp);
  const date = new Date(ms);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Compute time remaining until a future epoch timestamp
 */
export function getTimeRemaining(targetTimestamp) {
  const target = Number(targetTimestamp) < 10000000000 ? Number(targetTimestamp) * 1000 : Number(targetTimestamp);
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, label: 'Ended' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    label: days > 0 ? `${days}d ${hours}h left` : `${hours}h ${minutes}m ${seconds}s left`,
  };
}

/**
 * Safe percentage calculation with fixed decimals
 */
export function calculatePercentage(count, total, decimals = 1) {
  const c = Number(count) || 0;
  const t = Number(total) || 0;
  if (t === 0) return '0.0';
  return ((c / t) * 100).toFixed(decimals);
}
