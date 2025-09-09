import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Network and retry utilities
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function getNetworkError(error: any) {
  if (!isOnline()) {
    return 'offline';
  }
  
  if (error?.message?.includes('fetch')) {
    return 'network';
  }
  
  if (error?.message?.includes('500')) {
    return 'server';
  }
  
  if (error?.message?.includes('429')) {
    return 'ratelimit';
  }
  
  return 'unknown';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Generate a frontend request ID for correlation
  const frontendRequestId = crypto.randomUUID();
  
  if (!isOnline()) {
    // Log client-side errors to console in structured format
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: `API request failed - offline`,
      context: {
        operation: 'api_request',
        method,
        url,
        frontendRequestId,
        error: 'offline'
      },
      requestBody: data
    }));
    throw new Error('offline: No internet connection');
  }

  try {
    // Log request start
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message: `API request started: ${method} ${url}`,
      context: {
        operation: 'api_request_start',
        method,
        url,
        frontendRequestId,
        hasRequestBody: !!data
      }
    }));

    const startTime = performance.now();
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        // Send frontend request ID for correlation with backend logs
        "X-Frontend-Request-Id": frontendRequestId
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    const duration = performance.now() - startTime;

    // Log response
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.ok ? 'INFO' : 'ERROR',
      message: `API request completed: ${method} ${url} ${res.status}`,
      context: {
        operation: 'api_request_complete',
        method,
        url,
        frontendRequestId,
        statusCode: res.status,
        duration: Math.round(duration)
      }
    }));

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Log detailed error information
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: `API request failed: ${method} ${url}`,
      context: {
        operation: 'api_request_error',
        method,
        url,
        frontendRequestId
      },
      error: {
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      requestBody: data
    }));
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.message?.match(/^4\d\d/)) {
          return false;
        }
        
        // Don't retry if offline 
        if (!isOnline()) {
          return false;
        }
        
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on 4xx errors
        if (error?.message?.match(/^4\d\d/)) {
          return false;
        }
        
        // Don't retry if offline
        if (!isOnline()) {
          return false;
        }
        
        // Retry mutations once for network/server errors
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});
