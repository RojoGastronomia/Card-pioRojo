import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Função para obter a base URL da API
export function getApiBaseUrl() {
  // Em desenvolvimento, usamos a porta 5000 para o servidor backend
  // Em produção, o servidor e o cliente estão na mesma origem
  const port = process.env.NODE_ENV === 'production' ? window.location.port : '5000';
  const portSuffix = port ? `:${port}` : '';
  
  return `${window.location.protocol}//${window.location.hostname}${portSuffix}`;
}

export async function apiRequest(
  method: string,
  path: string,
  body?: any,
  options?: {
    headers?: Record<string, string>;
    on401?: '401page' | 'throw' | 'ignore';
  }
) {
  // Default options
  const defaultOptions = {
    on401: 'ignore' as const
  };
  
  // Merge default and provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(mergedOptions.headers || {})
  };

  try {
    const response = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (response.status === 401) {
      console.log('[API] Received 401 response, handling according to options:', mergedOptions.on401);
      if (mergedOptions.on401 === '401page') {
        return response;
      } else if (mergedOptions.on401 === 'throw') {
        throw new Error('Unauthorized');
      }
    }

    return response;
  } catch (error) {
    console.error(`API Request error for ${method} ${path}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Garantir que usamos a URL completa para a API
    const endpoint = queryKey[0] as string;
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${getApiBaseUrl()}${endpoint}`;
    console.log(`[QueryFn] Buscando dados de: ${fullUrl}`);
    
    const res = await fetch(fullUrl, {
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
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
