/**
 * SWR fetcher that handles our API response format
 * All API responses have { success: boolean, data: T, error?: string }
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }

  return json.data;
};
