import { SWRConfiguration, mutate } from 'swr';

/**
 * Enhanced fetcher function for SWR with better error handling
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  try {
    const res = await fetch(url, {
      // Adding timeout and credentials to ensure proper fetching
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add a timeout to prevent hanging requests
      signal: AbortSignal.timeout(15000)
    });

    // If the status code is not in the range 200-299
    if (!res.ok) {
      // For 404 and 500 errors, return empty data instead of throwing
      if (res.status === 404 || res.status === 500) {
        console.warn(`Received ${res.status} for ${url}, returning empty data`);
        return [] as unknown as T;
      }

      const errorData = await res.json().catch(() => ({}));
      const error: Error & { info?: any; status?: number } = new Error(
        `An error occurred while fetching the data: ${res.status} ${res.statusText}`
      );
      error.info = errorData;
      error.status = res.status;
      throw error;
    }

    const response = await res.json();

    // Handle standardized API response format
    if (response && typeof response === 'object' && 'success' in response) {
      if (!response.success) {
        const error: Error & { info?: any; status?: number } = new Error(
          response.error || response.message || 'API request failed'
        );
        error.info = response;
        error.status = res.status;
        throw error;
      }
      return response.data as T;
    }

    // Handle direct array/object response (backward compatibility)
    return response as T;
  } catch (error: any) {
    console.error(`Error fetching from ${url}:`, error);

    // Provide more specific error messages based on the error type
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }

    if (error.name === 'TimeoutError') {
      throw new Error('Request timeout: The server took too long to respond. Please try again later.');
    }

    if (error.status === 503) {
      throw new Error('Service unavailable: Database connection failed. Please try again later.');
    }

    if (error.status === 500) {
      throw new Error('Server error: An unexpected error occurred. Please try again later.');
    }

    throw error;
  }
};

/**
 * Clear all SWR cache - Call this on login/logout
 */
export const clearSWRCache = () => {
  // Clear all cached data
  mutate(() => true, undefined, { revalidate: true });
  console.log('[SWR] Cache cleared and revalidation triggered');
};

/**
 * Clear specific cache pattern
 */
export const clearSWRCacheByPattern = (pattern: string) => {
  mutate(
    (key) => typeof key === 'string' && key.includes(pattern),
    undefined,
    { revalidate: true }
  );
  console.log(`[SWR] Cache cleared for pattern: ${pattern}`);
};

/**
 * Enhanced SWR configuration with better defaults for multi-device support
 */
export const swrConfig: SWRConfiguration = {
  // Revalidate data when window regains focus
  revalidateOnFocus: true,

  // Revalidate data when network reconnects
  revalidateOnReconnect: true,

  // Revalidate data when it becomes stale in the background
  revalidateIfStale: true,

  // Refresh interval in milliseconds (0 means no auto-refresh)
  refreshInterval: 30000, // Refresh every 30 seconds

  // Deduping interval - REDUCED for better multi-device support
  dedupingInterval: 1000, // Reduced from 2000ms to 1000ms

  // Number of times to retry on error
  errorRetryCount: 3,

  // Interval between error retries
  errorRetryInterval: 5000,

  // Keep previous data while fetching new data
  keepPreviousData: true,

  // Focus throttle interval
  focusThrottleInterval: 3000, // Reduced from 5000ms

  // Loading timeout
  loadingTimeout: 5000,

  // Disable suspense by default
  suspense: false,

  // IMPORTANT for multi-device: Always revalidate on mount
  revalidateOnMount: true,
};

export default swrConfig;