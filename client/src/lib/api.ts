import { API_URL } from '../config';

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
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
  // Detectar se é FormData para não definir Content-Type nem serializar como JSON
  const isFormData = data instanceof FormData;
  
  // Montar URL absoluta
  const url = endpoint.startsWith('http') ? endpoint : API_URL.replace(/\/$/, '') + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
  
  // Se há onUploadProgress e é FormData, usar XMLHttpRequest
  if (options.onUploadProgress && isFormData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', options.onUploadProgress!);
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          let errorMessage = 'An error occurred';
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            errorMessage = xhr.statusText;
          }
          reject(new ApiError(xhr.status, errorMessage));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Request was cancelled'));
      });
      
      xhr.open(method, url);
      xhr.withCredentials = true; // Para cookies/session
      
      // Definir headers
      Object.entries(options.headers || {}).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.send(data);
    });
  }
  
  // Caso padrão usando fetch
  const headers = {
    // Não definir Content-Type para FormData, deixar o browser definir automaticamente
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      // Para FormData, enviar diretamente; para outros dados, serializar como JSON
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
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

    // Para 204 No Content ou sem corpo
    if (response.status === 204 || response.headers.get("content-length") === "0") {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text);
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