export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
