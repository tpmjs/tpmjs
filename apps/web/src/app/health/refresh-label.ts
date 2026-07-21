export function formatLastRefresh(lastRefresh: Date | null): string {
  return lastRefresh ? lastRefresh.toLocaleTimeString() : 'Not checked yet';
}
