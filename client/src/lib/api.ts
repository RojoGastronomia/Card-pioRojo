type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  method: HttpMethod,
  endpoint: string,
  data?: any,
  options: RequestOptions = {}
): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include', // Important for cookies/session
      signal: options.signal,
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText;
      }
      throw new ApiError(response.status, errorMessage);
    }

    // For 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      throw new Error(`Network error: ${error.message}`);
    }
    throw new Error('An unknown error occurred');
  }
}

// Utility function to create an abort controller with timeout
export function createAbortController(timeoutMs: number = 30000): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

// Request with timeout
export async function apiRequestWithTimeout<T>(
  method: HttpMethod,
  endpoint: string,
  data?: any,
  timeoutMs: number = 30000
): Promise<T> {
  const controller = createAbortController(timeoutMs);
  return apiRequest<T>(method, endpoint, data, { signal: controller.signal });
} 