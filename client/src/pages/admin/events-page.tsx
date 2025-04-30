import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Event, insertEventSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, PencilLine, Eye, Trash2, Filter, Calendar, Plus, Edit, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminNavbar from "@/components/admin/admin-navbar";

// Form schema
const eventFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  imageUrl: z.string().url({ message: "Please enter a valid URL" }),
  location: z.string().optional(),
  eventType: z.string(),
  menuOptions: z.coerce.number().int().min(1),
  status: z.string(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function AdminEventsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [garcomPrice, setGarcomPrice] = useState(260);
  const [editingGarcom, setEditingGarcom] = useState(false);
  const [localInput, setLocalInput] = useState("");
  const [salaInput, setSalaInput] = useState("");
  const [locais, setLocais] = useState([
    {
      nome: "16° Andar - MTC",
      salas: [
        "Experience Center",
        "Innovation Factory",
        "Microkitchen Area",
        "MTC Team Only",
        "Tapajos",
        "Tocantins",
        "Xingu"
      ]
    },
    {
      nome: "16° Andar - CAFETERIA",
      salas: ["MTC Cafeteria"]
    },
    {
      nome: "16° Andar - CUSTOMER SPACE",
      salas: [
        "Foyer (Verificar Disponibilidade)",
        "Guaporé",
        "Mamoré",
        "MPR Copa Cabana",
        "MPR Paraty",
        "MPR Trancoso",
        "Paraná",
        "Pinheiros",
        "Piracicada",
        "São Francisco",
        "Solimões"
      ]
    }
  ]);
  const [editingLocalIdx, setEditingLocalIdx] = useState<number|null>(null);
  const [editingSalaIdx, setEditingSalaIdx] = useState<{localIdx:number, salaIdx:number}|null>(null);
  const [newSalaInputs, setNewSalaInputs] = useState<{[key:number]: string}>({});

  // Fetch events
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events"]
  });
  if (error instanceof Error) {
    toast({
      title: "Error loading events",
      description: error.message,
      variant: "destructive",
    });
  }

  // Add event mutation
  const addEventMutation = useMutation({
    mutationFn: async (eventData: EventFormValues) => {
      const res = await apiRequest("POST", "/api/events", eventData);
      return await res.json();
    },
    onSuccess: () => {
      setShowAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event added",
        description: "Event has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, eventData }: { id: number; eventData: EventFormValues }) => {
      const res = await apiRequest("PUT", `/api/events/${id}`, eventData);
      return await res.json();
    },
    onSuccess: () => {
      setShowAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event updated",
        description: "Event has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event deleted",
        description: "Event has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      location: "",
      eventType: "corporate",
      menuOptions: 2,
      status: "available",
    },
  });

  // Reset form when dialog is closed
  const handleCloseDialog = () => {
    form.reset();
    setIsEditing(false);
    setSelectedEvent(null);
    setShowAddDialog(false);
  };

  // Handle edit event button click
  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(true);
    
    form.reset({
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl,
      location: event.location || "",
      eventType: event.eventType,
      menuOptions: event.menuOptions,
      status: event.status,
    });
    
    setShowAddDialog(true);
  };

  // Handle form submission
  const onSubmit = (values: EventFormValues) => {
    if (isEditing && selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, eventData: values });
    } else {
      addEventMutation.mutate(values);
    }
  };

  // Filter events based on search, type, and status
  const filteredEvents = (Array.isArray(events) ? events : []).filter((event: Event) => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter ? event.eventType === typeFilter : true;
    const matchesStatus = statusFilter ? event.status === statusFilter : true;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get event type display text
  const getEventTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      'corporate': 'Corporativo',
      'wedding': 'Casamento',
      'birthday': 'Aniversário',
      'coffee': 'Coffee Break',
      'lunch': 'Almoço',
      'brunch': 'Brunch',
      'festival': 'Festival',
      'cocktail': 'Coquetel'
    };
    return types[type] || type;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cadastrar Eventos</h1>
        <Button 
          onClick={() => {
            setIsEditing(false);
            setSelectedEvent(null);
            form.reset();
            setShowAddDialog(true);
          }}
          className="gap-2"
        >
          <PencilLine size={16} />
          Criar Novo Evento
        </Button>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Input
                  type="date"
                  className="px-4 py-2"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    {typeFilter ? getEventTypeDisplay(typeFilter) : "Tipo de Evento"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                    Todos os tipos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("corporate")}>
                    Corporativo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("wedding")}>
                    Casamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("birthday")}>
                    Aniversário
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("coffee")}>
                    Coffee Break
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("lunch")}>
                    Almoço
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("brunch")}>
                    Brunch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("festival")}>
                    Festival
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter("cocktail")}>
                    Coquetel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    {statusFilter || "Status"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("available")}>
                    Disponível
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("unavailable")}>
                    Indisponível
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Evento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Opções de Menu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event: Event) => (
                  <TableRow key={event.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{getEventTypeDisplay(event.eventType)}</TableCell>
                    <TableCell>{event.location || "N/A"}</TableCell>
                    <TableCell>{event.menuOptions}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        event.status === "available" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {event.status === "available" ? "Disponível" : "Indisponível"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditEvent(event)}
                        >
                          <PencilLine className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this event?')) {
                              deleteEventMutation.mutate(event.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum evento encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Gerenciamento de Locais/Salas e Garçom */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Valor do Garçom */}
        <Card className="col-span-1 bg-gradient-to-br from-amber-100 to-yellow-50 border-amber-200">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full">
            <h2 className="text-lg font-semibold mb-2 text-amber-800 flex items-center gap-2">
              <span>💁‍♂️</span> Valor do Garçom
            </h2>
            <div className="flex gap-2 items-center mb-2">
              <Input
                type="number"
                min={0}
                value={garcomPrice}
                disabled={!editingGarcom}
                onChange={e => setGarcomPrice(Number(e.target.value))}
                className="w-32 text-lg font-bold text-amber-900 bg-amber-50 border-amber-300"
              />
              {editingGarcom ? (
                <Button onClick={()=>setEditingGarcom(false)} variant="default" className="bg-amber-500 hover:bg-amber-600 text-white"><Save size={18}/> Salvar</Button>
              ) : (
                <Button onClick={()=>setEditingGarcom(true)} variant="outline" className="border-amber-400 text-amber-700"><Edit size={18}/> Editar</Button>
              )}
            </div>
            <span className="text-xs text-amber-700">Cobrado por garçom a cada 10 convidados</span>
          </CardContent>
        </Card>
        {/* Card de adicionar novo local */}
        <Card className="col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
              <span>🏢</span> Locais e Salas
            </h2>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Nome do local"
                value={localInput}
                onChange={e => setLocalInput(e.target.value)}
                className="bg-white border-blue-200"
              />
              <Button
                onClick={() => {
                  if(localInput.trim()){
                    setLocais([...locais, {nome: localInput.trim(), salas: []}]);
                    setLocalInput("");
                  }
                }}
                variant="default"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                title="Adicionar Local"
              >
                <Plus size={18}/>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locais.map((local, idx) => (
                <Card key={local.nome} className="border-blue-200 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      {editingLocalIdx === idx ? (
                        <Input
                          value={local.nome}
                          onChange={e => {
                            const novos = [...locais];
                            novos[idx].nome = e.target.value;
                            setLocais(novos);
                          }}
                          onBlur={()=>setEditingLocalIdx(null)}
                          autoFocus
                          className="font-bold text-blue-800"
                        />
                      ) : (
                        <span className="font-bold text-blue-800 text-lg">{local.nome}</span>
                      )}
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="hover:bg-blue-100" onClick={()=>setEditingLocalIdx(idx)}><Edit size={16} className="text-blue-600"/></Button>
                        <Button size="icon" variant="ghost" className="hover:bg-red-100" onClick={()=>{
                          const novos = locais.filter((_,i)=>i!==idx);
                          setLocais(novos);
                        }}><Trash2 size={16} className="text-red-500"/></Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {local.salas.map((sala, sidx) => (
                        <span key={sala} className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium gap-1">
                          {editingSalaIdx && editingSalaIdx.localIdx === idx && editingSalaIdx.salaIdx === sidx ? (
                            <Input
                              value={sala}
                              onChange={e => {
                                const novos = [...locais];
                                novos[idx].salas[sidx] = e.target.value;
                                setLocais(novos);
                              }}
                              onBlur={()=>setEditingSalaIdx(null)}
                              autoFocus
                              className="w-24 text-xs"
                            />
                          ) : (
                            <span>{sala}</span>
                          )}
                          <Button size="icon" variant="ghost" className="hover:bg-blue-200" onClick={()=>setEditingSalaIdx({localIdx:idx,salaIdx:sidx})}><Edit size={14} className="text-blue-600"/></Button>
                          <Button size="icon" variant="ghost" className="hover:bg-red-200" onClick={()=>{
                            const novos = [...locais];
                            novos[idx].salas.splice(sidx,1);
                            setLocais(novos);
                          }}><Trash2 size={14} className="text-red-500"/></Button>
                        </span>
                      ))}
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-400 text-xs font-medium gap-1">
                        <Input
                          placeholder="Nova sala"
                          value={newSalaInputs[idx] || ""}
                          onChange={e => setNewSalaInputs(inputs => ({...inputs, [idx]: e.target.value}))}
                          onKeyDown={e => {
                            if(e.key === "Enter" && (newSalaInputs[idx] || "").trim()){
                              const novos = [...locais];
                              novos[idx].salas.push((newSalaInputs[idx] || "").trim());
                              setLocais(novos);
                              setNewSalaInputs(inputs => ({...inputs, [idx]: ""}));
                            }
                          }}
                          className="w-20 text-xs bg-blue-50 border-blue-200"
                        />
                        <Button size="icon" variant="ghost" className="hover:bg-blue-200" onClick={()=>{
                          if((newSalaInputs[idx] || "").trim()){
                            const novos = [...locais];
                            novos[idx].salas.push((newSalaInputs[idx] || "").trim());
                            setLocais(novos);
                            setNewSalaInputs(inputs => ({...inputs, [idx]: ""}));
                          }
                        }}><Plus size={14} className="text-blue-500"/></Button>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Evento" : "Criar Novo Evento"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Evento</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Evento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="corporate">Corporativo</SelectItem>
                          <SelectItem value="wedding">Casamento</SelectItem>
                          <SelectItem value="birthday">Aniversário</SelectItem>
                          <SelectItem value="coffee">Coffee Break</SelectItem>
                          <SelectItem value="lunch">Almoço</SelectItem>
                          <SelectItem value="brunch">Brunch</SelectItem>
                          <SelectItem value="festival">Festival</SelectItem>
                          <SelectItem value="cocktail">Coquetel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="menuOptions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opções de Menu</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="unavailable">Indisponível</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit"
                  disabled={addEventMutation.isPending || updateEventMutation.isPending}
                >
                  {isEditing ? "Atualizar" : "Criar"} Evento
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
