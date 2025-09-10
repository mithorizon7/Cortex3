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
    try {
      const errorData = await res.json();
      
      // If server returns structured error with incident ID, preserve it
      if (errorData.incidentId) {
        const error = new Error(errorData.error || res.statusText);
        (error as any).incidentId = errorData.incidentId;
        (error as any).statusCode = res.status;
        throw error;
      }
      
      // Fallback to text response
      throw new Error(errorData.error || errorData.message || res.statusText);
    } catch (parseError) {
      // If JSON parsing fails, fallback to text
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
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


    await throwIfResNotOk(res);
    return res;
  } catch (fetchError: any) {
    // Log client-side errors to console in structured format
    const errorContext = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: `API request failed: ${method} ${url}`,
      context: {
        operation: 'api_request_error',
        method,
        url,
        frontendRequestId,
        error: fetchError?.message || 'unknown_error',
        statusCode: fetchError?.status || fetchError?.statusCode,
        incidentId: fetchError?.incidentId // Preserve incident ID from server
      },
      error: {
        name: fetchError?.name,
        message: fetchError?.message,
        stack: fetchError?.stack
      }
    };
    
    // Don't log sensitive request bodies for certain endpoints
    if (!url.includes('/assessments') && data) {
      (errorContext as any).requestBody = data;
    }
    
    console.error(JSON.stringify(errorContext));
    
    throw fetchError;
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
