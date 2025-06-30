import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, InsertUser } from "@shared/schema";
import { Pencil, Trash2, Search, Filter, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema for editing users - password is optional
const editUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  username: z.string().min(2, { message: "Username must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.string().min(1, { message: "Role is required" }),
  phone: z.string().optional(),
  password: z.string().optional()
});

// Schema for new users - password is required
const newUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  username: z.string().min(2, { message: "Username must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.string().min(1, { message: "Role is required" }),
  phone: z.string().optional(),
  password: z.string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres" })
    .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula" })
    .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula" })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" })
    .regex(/[^A-Za-z0-9]/, { message: "A senha deve conter pelo menos um caractere especial" }),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;
type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("clients");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { t } = useLanguage();

  // Fetch user history
  const { data: userHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/users/history", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null;
      const res = await apiRequest("GET", `/api/users/${selectedUser.id}/history`);
      return await res.json();
    },
    enabled: !!selectedUser,
  });

  // Fetch users with refetch interval
  const { data: users, isLoading, isError, error } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Handle query error
  useEffect(() => {
    if (isError && error) {
      toast({
        title: t('users', 'loadError'),
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: NewUserFormValues) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: () => {
      setShowAddDialog(false);
      addUserForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t('users', 'userAdded'),
        description: t('users', 'userAddedSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('users', 'addError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: t('users', 'userDeleted'),
        description: t('users', 'userDeletedSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('users', 'deleteError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async (userData: Partial<EditUserFormValues> & { id: number }) => {
      console.log('[Debug] editUserMutation.mutationFn called with:', userData);
      const { id, ...data } = userData;
      console.log('[Debug] sending PUT request to:', `/api/users/${id}`, 'with data:', data);
      const res = await apiRequest("PUT", `/api/users/${id}`, data);
      const responseData = await res.json();
      console.log('[Debug] response received:', responseData);
      return responseData;
    },
    onSuccess: (data) => {
      console.log('[Debug] editUserMutation.onSuccess called with:', data);
      setShowEditDialog(false);
      editUserForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.refetchQueries({ queryKey: ["/api/users"] });
      // Troca para a aba correta conforme o novo papel
      if (data && data.role) {
        if (data.role === 'Administrador') setActiveTab('admins');
        else if (data.role === 'Comercial') setActiveTab('comercial');
        else setActiveTab('clients');
        toast({
          title: t('users', 'userUpdated'),
          description: t('users', 'userUpdatedSuccess') + `\nUsuário movido para a aba: ${data.role}`,
        });
      } else {
      toast({
        title: t('users', 'userUpdated'),
        description: t('users', 'userUpdatedSuccess'),
      });
      }
    },
    onError: (error: Error) => {
      console.log('[Debug] editUserMutation.onError called with:', error);
      toast({
        title: t('users', 'updateError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for adding new users
  const addUserForm = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "client",
      phone: "",
    },
  });

  // Form for editing users
  const editUserForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "client",
      phone: "",
    },
  });

  // Handle form submission for new users
  const onSubmit = (values: NewUserFormValues) => {
    addUserMutation.mutate(values);
  };

  // Handle edit form submission
  const onEditSubmit = (values: EditUserFormValues) => {
    if (!selectedUser) return;
    
    console.log('[Debug] onEditSubmit called with values:', values);
    console.log('[Debug] selectedUser:', selectedUser);
    
    // Prepare update data
    const dataToUpdate: Partial<EditUserFormValues> = {
      name: values.name,
      username: values.username,
      email: values.email,
      role: values.role,
      phone: values.phone,
    };
    
    // Só inclui a senha se ela foi preenchida e não estiver vazia
    if (values.password && values.password.trim() !== "") {
      Object.assign(dataToUpdate, { password: values.password });
    }
    
    console.log('[Debug] dataToUpdate:', dataToUpdate);
    console.log('[Debug] sending to mutation:', { ...dataToUpdate, id: selectedUser.id });
    
    editUserMutation.mutate({ ...dataToUpdate, id: selectedUser.id });
  };

  // Function to open edit dialog
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    editUserForm.reset({
      name: user.name,
      username: user.username,
      email: user.email,
      password: "", // Empty password field
      role: user.role,
      phone: user.phone || "",
    });
    setShowEditDialog(true);
  };

  // Filter users based on search and status
  const filteredUsers = users?.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro correto por papel/role
    let matchesRole = false;
    if (activeTab === "clients") {
      matchesRole = user.role === "client";
    } else if (activeTab === "admins") {
      matchesRole = user.role === "Administrador";
    } else if (activeTab === "comercial") {
      matchesRole = user.role === "Comercial";
    }
    
    return matchesSearch && matchesRole;
  });
  
  // DEBUG: Log filtered users whenever the tab changes
  useEffect(() => {
    console.log(`[Debug] Filtered users for tab '${activeTab}':`, filteredUsers);
  }, [filteredUsers, activeTab]);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!showAddDialog) {
      addUserForm.reset();
    }
  }, [showAddDialog, addUserForm]);

  // Reset edit form when dialog is closed
  useEffect(() => {
    if (!showEditDialog) {
      editUserForm.reset();
      setSelectedUser(null);
    }
  }, [showEditDialog, editUserForm]);

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('users', 'title')}</h1>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {t('users', 'newUser')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('users', 'newUser')}</DialogTitle>
                <DialogDescription>
                  {t('users', 'newUserDescription')}
                </DialogDescription>
              </DialogHeader>
            <Form {...addUserForm}>
              <form onSubmit={addUserForm.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={addUserForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('users', 'fullName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('users', 'fullNamePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                    control={addUserForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('users', 'username')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('users', 'usernamePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={addUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('users', 'email')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('users', 'emailPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                    control={addUserForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('users', 'phone')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('users', 'phonePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                  control={addUserForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('users', 'password')}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder={t('users', 'passwordPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                  control={addUserForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('users', 'userType')}</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(value)}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('users', 'selectUserType')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client">{t('users', 'userTypeUser')}</SelectItem>
                              <SelectItem value="Administrador">{t('users', 'userTypeAdmin')}</SelectItem>
                              <SelectItem value="Comercial">Comercial</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">{t('common', 'cancel')}</Button>
                    </DialogClose>
                    <Button type="submit" disabled={addUserMutation.isPending}>
                      {addUserMutation.isPending ? t('common', 'saving') : t('users', 'createUser')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* User Type Tabs */}
        <div className="bg-gray-100 p-1 rounded-full inline-flex w-fit mb-6">
          <Button 
            variant={activeTab === "clients" ? "default" : "ghost"} 
            className="rounded-full"
            onClick={() => setActiveTab("clients")}
          >
            {t('users', 'userTypeUser')}
          </Button>
          <Button 
            variant={activeTab === "admins" ? "default" : "ghost"} 
            className="rounded-full"
            onClick={() => setActiveTab("admins")}
          >
            {t('users', 'userTypeAdmin')}
          </Button>
          <Button 
            variant={activeTab === "comercial" ? "default" : "ghost"} 
            className="rounded-full"
            onClick={() => setActiveTab("comercial")}
          >
            Comercial
          </Button>
        </div>

        {/* Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter size={16} />
                    {activeTab === "clients" ? t('users', 'userTypeUser') : activeTab === "admins" ? t('users', 'userTypeAdmin') : t('users', 'userTypeComercial')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setActiveTab("clients")}>
                    {t('users', 'userTypeUser')}
                    </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("admins")}>
                    {t('users', 'userTypeAdmin')}
                    </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("comercial")}>
                    Comercial
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
            <div className="relative w-full md:w-auto flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder={t('users', 'searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-1/5" />
                  <Skeleton className="h-4 w-1/5" />
                  <Skeleton className="h-4 w-1/5" />
                  <Skeleton className="h-8 w-[80px]" />
                </div>
              ))}
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead className="w-[250px]">{t('users', 'name')}</TableHead>
                    <TableHead>{t('users', 'userType')}</TableHead>
                    <TableHead>{t('users', 'contacts')}</TableHead>
                    <TableHead>{t('users', 'status')}</TableHead>
                    <TableHead className="text-right">{t('users', 'actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredUsers.map((user) => {
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.username}</div>
                      </TableCell>
                      <TableCell>
                        {user.role === 'Administrador' ? (
                          <span className="inline-flex items-center gap-1">
                            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                              {t('users', 'userTypeAdmin')}
                            </Badge>
                          </span>
                        ) : user.role === 'Comercial' ? (
                          <span className="inline-flex items-center gap-1">
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Comercial
                            </Badge>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                              {t('users', 'userTypeUser')}
                            </Badge>
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.phone || "-"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{t('common', 'available')}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowHistoryDialog(true);
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditClick(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm(`${t('users', 'confirmDelete')} ${user.name}${t('users', 'questionMark')}`)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('users', 'participationHistory')}</DialogTitle>
              <DialogDescription>
                {t('users', 'participationHistoryDescription')} {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : userHistory && userHistory.length > 0 ? (
              userHistory.map((item: any) => (
                <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{item.event?.name || t('users', 'eventNotFound')}</h3>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{t('users', 'date')}:</span>
                    <span>{new Date(item.event?.date || "").toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('users', 'total')}:</span>
                    <span>R$ {item.totalAmount?.toFixed(2) ?? "0,00"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('users', 'status')}:</span>
                    <span className={
                      item.status === "completed" ? "text-green-600" :
                      item.status === "pending" ? "text-yellow-600" :
                      "text-red-600"
                    }>
                      {item.status === "completed" ? t('users', 'statusCompleted') :
                       item.status === "pending" ? t('users', 'statusPending') :
                       t('users', 'statusCancelled')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('users', 'noHistoryFound')}</p>
              </div>
            )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowHistoryDialog(false)}>
                {t('users', 'close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users', 'editUser')}</DialogTitle>
            <DialogDescription>
              {t('users', 'editUserDescription')} {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users', 'fullName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users', 'fullNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users', 'username')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users', 'usernamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users', 'email')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users', 'emailPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users', 'phone')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('users', 'phonePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users', 'newPassword')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('users', 'passwordPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users', 'userType')}</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="client">{t('users', 'userTypeUser')}</option>
                        <option value="Administrador">{t('users', 'userTypeAdmin')}</option>
                        <option value="Comercial">Comercial</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">{t('common', 'cancel')}</Button>
                </DialogClose>
                <Button type="submit" disabled={editUserMutation.isPending}>
                  {editUserMutation.isPending ? t('common', 'saving') : t('common', 'save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
