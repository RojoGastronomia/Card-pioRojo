import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error(`[API] Erro na resposta: ${res.status} ${text}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

// Função para obter a base URL da API
export function getApiBaseUrl() {
  // Sempre usar a porta 5000 em desenvolvimento
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  // Em produção ou outros ambientes, usamos a mesma origem
  const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
  console.log('[API] Usando URL base:', baseUrl);
  return baseUrl;
}

export async function apiRequest(
  method: string,
  path: string,
  body?: any,
  options?: {
    headers?: Record<string, string>;
    on401?: '401page' | 'throw' | 'ignore';
    language?: string;
    onUploadProgress?: (progressEvent: ProgressEvent) => void;
  }
) {
  // Default options
  const defaultOptions = {
    on401: 'ignore' as const
  };
  
  // Merge default and provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(mergedOptions.headers || {})
  };

  // Se o body for FormData, não definir Content-Type (deixar o navegador definir)
  // Se não for FormData, definir como application/json
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Adicionar o parâmetro lang à URL apenas se não for FormData (upload de arquivo)
  let fullUrl: string;
  if (body instanceof FormData) {
    // Para upload de arquivos, não adicionar parâmetros extras na URL
    fullUrl = path.startsWith('http') ? path : `${getApiBaseUrl()}${path}`;
  } else {
    // Para requisições normais, adicionar o parâmetro lang
  const language = mergedOptions.language || 'pt';
  const separator = path.includes('?') ? '&' : '?';
  const urlWithLang = `${path}${separator}lang=${language}`;
    fullUrl = urlWithLang.startsWith('http') ? urlWithLang : `${getApiBaseUrl()}${urlWithLang}`;
  }

  console.log(`[API] Iniciando requisição ${method} ${fullUrl}`, body ? { body } : '');
  console.log('[API] Headers da requisição:', headers);
  console.log('[API] Cookies atuais:', document.cookie);

  try {
    // Preparar o body baseado no tipo
    let requestBody: string | FormData | undefined;
    if (body instanceof FormData) {
      requestBody = body;
    } else if (body) {
      requestBody = JSON.stringify(body);
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: requestBody,
      credentials: 'include',
      mode: 'cors',
      cache: 'no-store',
    });

    console.log(`[API] Resposta recebida: ${response.status} ${response.statusText}`);
    console.log('[API] Headers da resposta:', Object.fromEntries(response.headers.entries()));
    console.log('[API] Cookies após resposta:', document.cookie);

    // Tentar ler o corpo da resposta para log
    const responseText = await response.text();
    console.log('[API] Corpo da resposta:', responseText);

    // Recriar a resposta com o texto lido
    const responseClone = new Response(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    if (response.status === 401) {
      console.log('[API] Received 401 response, handling according to options:', mergedOptions.on401);
      if (mergedOptions.on401 === '401page') {
        return responseClone;
      } else if (mergedOptions.on401 === 'throw') {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || 'Unauthorized');
        } catch (e) {
          throw new Error('Unauthorized');
        }
      }
    }

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || response.statusText);
      } catch (e) {
        throw new Error(response.statusText);
      }
    }

    return responseClone;
  } catch (error) {
    console.error(`[API] Erro na requisição ${method} ${path}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  language?: string;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, language }) =>
  async ({ queryKey }) => {
    // Garantir que usamos a URL completa para a API
    const endpoint = queryKey[0] as string;
    
    // Adicionar o parâmetro lang à URL
    const lang = language || 'pt';
    const separator = endpoint.includes('?') ? '&' : '?';
    const urlWithLang = `${endpoint}${separator}lang=${lang}`;
    
    const fullUrl = urlWithLang.startsWith('http') ? urlWithLang : `${getApiBaseUrl()}${urlWithLang}`;
    console.log(`[QueryFn] Buscando dados de: ${fullUrl}`);
    
    try {
      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      console.log(`[QueryFn] Resposta recebida: ${res.status} ${res.statusText}`);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('[QueryFn] Retornando null para 401');
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      console.log('[QueryFn] Dados recebidos:', data);
      return data;
    } catch (error) {
      console.error(`[QueryFn] Erro ao buscar ${fullUrl}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw", language: localStorage.getItem('language') as 'pt' | 'en' || 'pt' }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
      retryOnMount: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: false,
    },
  },
});
