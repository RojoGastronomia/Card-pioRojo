import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/types";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/context/language-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula" })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" })
    .regex(/[^A-Za-z0-9]/, { message: "A senha deve conter pelo menos um caractere especial" }),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { loginMutation, registerMutation, user } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Get return URL from query parameters
  const getReturnUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo') || '/';
    
    // Validar a URL de retorno
    if (returnTo === '/auth' || returnTo.includes('?returnTo=')) {
      return '/';
    }
    
    // Garantir que a URL começa com /
    return returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
  };

  useEffect(() => {
    // Se o usuário já estiver autenticado, redirecionar
    if (user) {
      const returnUrl = getReturnUrl();
      if (user.role === "Administrador" && returnUrl === '/') {
        navigate("/admin/dashboard");
      } else {
        navigate(returnUrl);
      }
    }
  }, [user, navigate]);

  const loginForm = useForm<any>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "client",
      phone: "",
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    setError(null); // Limpar erro anterior
    loginMutation.mutate(values, {
      onError: (error) => {
        setError(error.message);
      }
    });
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    setError(null); // Limpar erro anterior
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData, {
      onError: (error) => {
        setError(error.message);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left column: Hero section */}
        <div className="md:w-1/2 bg-primary p-10 md:p-16 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t('auth', 'digitalMenu')}
            </h1>
            <p className="text-xl text-white/90 mb-12 max-w-lg">
              {t('auth', 'heroSubtitle')}
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14v4h-3v2h3v4h2v-4h3v-2h-3V6h-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('auth', 'personalizedEvents')}</h3>
                  <p className="text-white/70">{t('auth', 'chooseMenuOptions')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14v4h-3v2h3v4h2v-4h3v-2h-3V6h-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('auth', 'onlineOrders')}</h3>
                  <p className="text-white/70">{t('auth', 'orderOnline')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-white/20 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14v4h-3v2h3v4h2v-4h3v-2h-3V6h-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('auth', 'realtimeTracking')}</h3>
                  <p className="text-white/70">{t('auth', 'trackOrders')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form */}
        <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold">
                  {activeTab === "login" ? t('auth', 'loginTitle') : t('auth', 'registerTitle')}
                </CardTitle>
                <Link href="/" className="text-primary hover:text-primary/80 text-sm font-medium">
                  {t('auth', 'back')}
                </Link>
              </div>
              <CardDescription>
                {activeTab === "login" 
                  ? t('auth', 'loginSubtitle')
                  : t('auth', 'registerSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => {
                  setActiveTab(value);
                  setError(null); // Limpar erro ao trocar de aba
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">{t('auth', 'loginTab')}</TabsTrigger>
                  <TabsTrigger value="register">{t('auth', 'registerTab')}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth', 'email')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('auth', 'emailPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth', 'password')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder={t('auth', 'passwordPlaceholder')} 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="remember"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="remember" className="text-sm text-gray-600">
                            {t('auth', 'rememberMe')}
                          </label>
                        </div>
                        <a href="#" className="text-sm text-primary hover:text-primary/80">
                          {t('auth', 'forgotPassword')}
                        </a>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            {t('auth', 'loggingIn')}
                          </>
                        ) : (
                          t('auth', 'login')
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth', 'fullName')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('auth', 'fullNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('auth', 'username')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('auth', 'usernamePlaceholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth', 'email')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('auth', 'emailPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth', 'password')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  placeholder={t('auth', 'passwordPlaceholder')} 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth', 'confirmPassword')}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder={t('auth', 'confirmPasswordPlaceholder')} 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth', 'phone')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('auth', 'phonePlaceholder')} 
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  let formatted = '';
                                  if (value.length <= 2) {
                                    formatted = value;
                                  } else if (value.length <= 7) {
                                    formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                                  } else {
                                    formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                                  }
                                  field.onChange(formatted);
                                }}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                            {t('auth', 'registering')}
                          </>
                        ) : (
                          t('auth', 'register')
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
