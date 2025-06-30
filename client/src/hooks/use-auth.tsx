import { createContext, ReactNode, useContext, useCallback } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  role: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = {
  email: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('[Login] Iniciando tentativa de login com:', credentials.email);
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        console.log('[Login] Resposta recebida:', res.status);
        
        if (!res.ok) {
          const error = await res.json();
          console.error('[Login] Erro na resposta:', error);
          
          // Tradução das mensagens de erro
          const errorMessages: Record<string, { pt: string; en: string }> = {
            "Invalid email or password": {
              pt: "Email ou senha inválidos. Por favor, verifique suas credenciais.",
              en: "Invalid email or password. Please check your credentials."
            },
            "Unauthorized": {
              pt: "Não autorizado. Por favor, faça login novamente.",
              en: "Unauthorized. Please log in again."
            },
            "Email and password are required": {
              pt: "Email e senha são obrigatórios.",
              en: "Email and password are required."
            }
          };

          const errorMessage = errorMessages[error.message] || {
            pt: "Erro ao fazer login. Por favor, tente novamente.",
            en: "Error logging in. Please try again."
          };

          // Usar a mensagem no idioma atual
          const currentLang = localStorage.getItem('language') || 'pt';
          throw new Error(errorMessage[currentLang as 'pt' | 'en']);
        }
        
        const userData = await res.json();
        console.log('[Login] Login bem sucedido para:', userData.email);
        return userData;
      } catch (error) {
        console.error('[Login] Erro durante o login:', error);
        if (error instanceof Error) {
          throw error;
        }
        const currentLang = localStorage.getItem('language') || 'pt';
        const errorMessage = {
          pt: 'Erro desconhecido ao fazer login. Por favor, tente novamente.',
          en: 'Unknown error while logging in. Please try again.'
        };
        throw new Error(errorMessage[currentLang as 'pt' | 'en']);
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log('[Login] Atualizando cache com usuário:', user.email);
      queryClient.setQueryData(["/api/user"], user);
      const currentLang = localStorage.getItem('language') || 'pt';
      const successMessage = {
        pt: {
          title: "Login realizado com sucesso",
          description: `Bem-vindo(a) de volta, ${user.name}!`
        },
        en: {
          title: "Login successful",
          description: `Welcome back, ${user.name}!`
        }
      };
      toast({
        title: successMessage[currentLang as 'pt' | 'en'].title,
        description: successMessage[currentLang as 'pt' | 'en'].description,
      });
    },
    onError: (error: Error) => {
      console.error('[Login] Erro no callback de sucesso:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      console.log('[Register] Iniciando registro para:', credentials.email);
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        console.log('[Register] Resposta recebida:', res.status);
        
        if (!res.ok) {
          const error = await res.json();
          console.error('[Register] Erro na resposta:', error);
          
          // Tradução das mensagens de erro
          const errorMessages: Record<string, { pt: string; en: string }> = {
            "Email already in use": {
              pt: "Este email já está em uso. Por favor, use outro email ou faça login.",
              en: "This email is already in use. Please use another email or log in."
            },
            "Username already exists": {
              pt: "Este nome de usuário já existe. Por favor, escolha outro.",
              en: "This username already exists. Please choose another one."
            },
            "Only administrators can create new administrator accounts": {
              pt: "Apenas administradores podem criar novas contas de administrador.",
              en: "Only administrators can create new administrator accounts."
            }
          };

          const errorMessage = errorMessages[error.message] || {
            pt: "Erro ao fazer registro. Por favor, tente novamente.",
            en: "Error registering. Please try again."
          };

          // Usar a mensagem no idioma atual
          const currentLang = localStorage.getItem('language') || 'pt';
          throw new Error(errorMessage[currentLang as 'pt' | 'en']);
        }
        
        const userData = await res.json();
        console.log('[Register] Registro bem sucedido para:', userData.email);
        return userData;
      } catch (error) {
        console.error('[Register] Erro durante o registro:', error);
        if (error instanceof Error) {
          throw error;
        }
        const currentLang = localStorage.getItem('language') || 'pt';
        const errorMessage = {
          pt: 'Erro desconhecido ao fazer registro. Por favor, tente novamente.',
          en: 'Unknown error while registering. Please try again.'
        };
        throw new Error(errorMessage[currentLang as 'pt' | 'en']);
      }
    },
    onSuccess: (user: SelectUser) => {
      console.log('[Register] Atualizando cache com usuário:', user.email);
      queryClient.setQueryData(["/api/user"], user);
      const currentLang = localStorage.getItem('language') || 'pt';
      const successMessage = {
        pt: {
          title: "Registro realizado com sucesso",
          description: `Bem-vindo(a), ${user.name}!`
        },
        en: {
          title: "Registration successful",
          description: `Welcome, ${user.name}!`
        }
      };
      toast({
        title: successMessage[currentLang as 'pt' | 'en'].title,
        description: successMessage[currentLang as 'pt' | 'en'].description,
      });
    },
    onError: (error: Error) => {
      console.error('[Register] Erro no callback de sucesso:', error);
      toast({
        title: "Erro ao fazer registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Logout] Iniciando logout');
      try {
        const res = await apiRequest("POST", "/api/logout");
        console.log('[Logout] Resposta recebida:', res.status);
        
        if (!res.ok) {
          const error = await res.json();
          console.error('[Logout] Erro na resposta:', error);
          throw new Error(error.message || "Erro ao fazer logout");
        }
      } catch (error) {
        console.error('[Logout] Erro durante o logout:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[Logout] Logout bem sucedido, limpando cache');
      queryClient.setQueryData(["/api/user"], null);
      queryClient.removeQueries();
      toast({
        title: "Logout realizado com sucesso",
        description: "Até logo!",
      });
    },
    onError: (error: Error) => {
      console.error('[Logout] Erro no callback de sucesso:', error);
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isAuthenticated = !!user;
  const role = user?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        role,
        isLoading,
        isAuthenticated,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
