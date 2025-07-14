import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings, Shield, Database, Activity, Terminal, ListChecks, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { API_URL } from '../config';

// Define interface for performance data
interface PerformanceData {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

// Interface para um log individual (baseado no formato pino)
interface LogEntry {
  level: number;
  time: number; // Timestamp em milissegundos
  pid?: number;
  hostname?: string;
  msg: string; // A mensagem de log principal
  [key: string]: any; // Permite outras propriedades adicionadas ao log
}

// Função para mapear nível pino para texto e cor (exemplo)
const getLogLevelInfo = (level: number): { name: string; variant: "default" | "destructive" | "outline" | "secondary" } => {
  if (level >= 50) return { name: 'ERROR', variant: 'destructive' };
  if (level >= 40) return { name: 'WARN', variant: 'secondary' }; // Use 'secondary' or another variant for warning
  if (level >= 30) return { name: 'INFO', variant: 'default' };
  if (level >= 20) return { name: 'DEBUG', variant: 'outline' };
  return { name: 'TRACE', variant: 'outline' };
};

export default function MasterPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<null | { filename: string; size: number; timestamp: string }> (null);
  const [backupError, setBackupError] = useState<string | null>(null);

  // Query para buscar logs DO SISTEMA
  const logsQuery = useQuery<LogEntry[], Error>({
    queryKey: ['systemLogs'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/admin/system/logs`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao buscar logs: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: selectedAction === 'logs',
    refetchOnWindowFocus: false,
  });

  // Queries para monitoramento em tempo real
  const { data: performance } = useQuery<PerformanceData>({
    queryKey: ["/api/admin/system/performance"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/admin/system/performance`);
      if (!response.ok) throw new Error('Erro ao buscar performance');
      return response.json();
    },
    enabled: selectedAction === 'performance',
    refetchInterval: 5000,
    initialData: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0 }
  });

  // Mutation genérica para ações que não retornam dados
  const actionMutation = useMutation({
    mutationFn: async (endpoint: string) => {
      const response = await fetch(`${API_URL}${endpoint}`, { method: "POST" });
      if (!response.ok) throw new Error("Erro na operação");
      return response.json();
    },
    onSuccess: (_, endpoint) => {
      toast({
        title: "Sucesso",
        description: `Operação realizada com sucesso!`,
      });
      setSelectedAction(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for triggering the backup
  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/backup`, { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onMutate: () => {
      setIsLoading(true);
      setBackupError(null);
    },
    onSuccess: (data) => {
      setIsLoading(false);
      setShowBackupDialog(false);
      setBackupSuccess({ filename: data.filename, size: data.size, timestamp: data.timestamp });
      toast({
        title: "Sucesso",
        description: `Backup criado com sucesso! Arquivo: ${data.filename} (${(data.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    },
    onError: (error: any) => {
      setIsLoading(false);
      setBackupError(error.message || "Falha ao criar backup.");
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar backup.",
        variant: "destructive",
      });
    },
  });

  // Função para baixar o arquivo de backup
  const handleDownloadBackup = () => {
    if (!backupSuccess) return;
    // O endpoint de download pode ser ajustado conforme a API
    window.open(`${API_URL}/backups/${backupSuccess.filename}`, '_blank');
  };

  const handleBackupClick = () => {
    setShowBackupDialog(true);
  };

  const modules = [
    {
      title: "Gerenciamento de Sistema",
      icon: <Settings className="w-8 h-8 text-primary" />,
      description: "Configurações avançadas do sistema",
      actions: [
        {
          name: "Backup do Sistema",
          icon: Database,
          handler: handleBackupClick
        },
        {
          name: "Logs do Sistema",
          icon: FileText,
          handler: () => setSelectedAction("logs")
        },
        {
          name: "Configurações Globais",
          icon: Settings,
          handler: () => setSelectedAction("settings")
        }
      ]
    },
    {
      title: "Controle de Acesso",
      icon: <Shield className="w-8 h-8 text-primary" />,
      description: "Gestão de permissões e acessos",
      actions: [
        {
          name: "Permissões",
          handler: () => setSelectedAction("permissions")
        },
        {
          name: "Roles",
          handler: () => setSelectedAction("roles")
        },
        {
          name: "Tokens de API",
          handler: () => setSelectedAction("tokens")
        }
      ]
    },
    {
      title: "Banco de Dados",
      icon: <Database className="w-8 h-8 text-primary" />,
      description: "Administração do banco de dados",
      actions: [
        {
          name: "Backup",
          handler: () => actionMutation.mutate("/api/admin/database/backup")
        },
        {
          name: "Otimização",
          handler: () => actionMutation.mutate("/api/admin/database/optimize")
        },
        {
          name: "Manutenção",
          handler: () => actionMutation.mutate("/api/admin/database/maintenance")
        }
      ]
    },
    {
      title: "Monitoramento",
      icon: <Activity className="w-8 h-8 text-primary" />,
      description: "Métricas e desempenho do sistema",
      actions: [
        {
          name: "Performance",
          icon: Activity,
          handler: () => setSelectedAction("performance")
        },
        {
          name: "Uso de Recursos",
          handler: () => setSelectedAction("resources")
        },
        {
          name: "Alertas",
          handler: () => setSelectedAction("alerts")
        }
      ]
    },
    {
      title: "Ferramentas Avançadas",
      icon: <Terminal className="w-8 h-8 text-primary" />,
      description: "Ferramentas administrativas avançadas",
      actions: [
        {
          name: "Console",
          handler: () => setSelectedAction("console")
        },
        {
          name: "Cache",
          handler: () => setSelectedAction("cache")
        },
        {
          name: "Indexação",
          handler: () => actionMutation.mutate("/api/admin/tools/indexing")
        }
      ]
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Painel Master</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-4">
                {module.icon}
                <div>
                  <CardTitle>{module.title}</CardTitle>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {module.actions.map((action, actionIndex) => (
                  <Button
                    key={actionIndex}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={action.name === 'Backup do Sistema' ? handleBackupClick : action.handler}
                    disabled={action.name === 'Backup do Sistema' && (backupMutation.isPending || isLoading)}
                  >
                    {action.icon && <action.icon className="h-4 w-4" />}
                    {action.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Backup do Sistema</DialogTitle>
            <DialogDescription>
              Deseja realmente criar um backup do sistema agora? Esta operação pode levar alguns minutos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Button
              onClick={() => backupMutation.mutate()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">🔄</span>
                  Criando backup...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBackupDialog(false)}
              disabled={isLoading}
              className="w-full"
            >
              Cancelar
            </Button>
            {backupError && (
              <div className="text-red-600 text-sm text-center mt-2">
                {backupError}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!backupSuccess} onOpenChange={() => setBackupSuccess(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Backup criado com sucesso!</DialogTitle>
            <DialogDescription>
              O backup foi gerado e está disponível para download.
            </DialogDescription>
          </DialogHeader>
          {backupSuccess && (
            <div className="flex flex-col gap-2 mt-4">
              <div className="text-sm">
                <strong>Arquivo:</strong> {backupSuccess.filename}<br />
                <strong>Tamanho:</strong> {(backupSuccess.size / 1024 / 1024).toFixed(2)} MB<br />
                <strong>Data:</strong> {new Date(backupSuccess.timestamp).toLocaleString('pt-BR')}
              </div>
              <Button
                onClick={handleDownloadBackup}
                className="w-full mt-2"
              >
                Baixar Backup
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'logs' && 'Logs do Sistema'}
              {selectedAction === 'performance' && 'Performance do Sistema'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'logs' && 'Exibindo os últimos logs registrados no sistema.'}
              {selectedAction === 'performance' && 'Monitoramento em tempo real do uso de recursos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedAction === 'performance' && (
              <div>
                {performance && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2"><span>CPU</span><span>{Math.round(performance.cpuUsage)}%</span></div>
                      <Progress value={performance.cpuUsage} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2"><span>Memória</span><span>{Math.round(performance.memoryUsage)}%</span></div>
                      <Progress value={performance.memoryUsage} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2"><span>Disco</span><span>{Math.round(performance.diskUsage)}%</span></div>
                      <Progress value={performance.diskUsage} />
                    </div>
                  </div>
                )}
                {!performance && <p>Carregando dados de performance...</p>}
              </div>
            )}

            {selectedAction === 'logs' && (
              <div>
                {logsQuery.isLoading && (
                  <p className="text-center text-muted-foreground">Carregando logs...</p>
                )}
                {logsQuery.isError && (
                  <p className="text-center text-red-600">Erro ao buscar logs: {logsQuery.error.message}</p>
                )}
                {logsQuery.isSuccess && (
                  <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                    {logsQuery.data.length === 0 ? (
                      <p className="text-center text-muted-foreground">Nenhum log encontrado.</p>
                    ) : (
                      <div className="space-y-3">
                        {logsQuery.data.map((log, index) => {
                          const levelInfo = getLogLevelInfo(log.level);
                          const timestamp = formatDistanceToNow(new Date(log.time), { addSuffix: true, locale: ptBR });
                          return (
                            <div key={index} className="text-sm flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded bg-muted/30">
                              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap w-28">{timestamp}</span>
                              <Badge variant={levelInfo.variant} className="w-16 justify-center">{levelInfo.name}</Badge>
                              <span className="flex-1 whitespace-pre-wrap break-words">{log.msg}</span>
                              {Object.keys(log).filter(k => !['level', 'time', 'pid', 'hostname', 'msg', 'v'].includes(k)).length > 0 && (
                                <pre className="text-xs bg-background p-1 rounded overflow-x-auto mt-1 sm:mt-0">
                                  {JSON.stringify(Object.fromEntries(Object.entries(log).filter(([k]) => !['level', 'time', 'pid', 'hostname', 'msg', 'v'].includes(k))), null, 2)}
                                </pre>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                )}
              </div>
            )}

            {selectedAction === 'settings' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Configurações Globais</h2>
                <form className="space-y-2 max-w-md">
                  <div>
                    <label className="block text-sm font-medium">Nome do Sistema</label>
                    <input type="text" className="w-full border rounded px-2 py-1" placeholder="Ex: Cardápio Microsoft" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">E-mail de contato</label>
                    <input type="email" className="w-full border rounded px-2 py-1" placeholder="contato@email.com" />
                  </div>
                  <Button type="submit" className="mt-2">Salvar</Button>
                </form>
                <p className="text-xs text-muted-foreground">(Exemplo de formulário. Integração real pode ser feita depois.)</p>
              </div>
            )}

            {selectedAction === 'permissions' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Permissões</h2>
                <p className="text-sm">Gerencie as permissões de acesso dos usuários do sistema.</p>
                <PermissionsSection />
              </div>
            )}

            {selectedAction === 'roles' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Cargos/Funções</h2>
                <p className="text-sm">Gerencie os cargos e funções atribuídos aos usuários. Veja as permissões de cada cargo abaixo.</p>
                <RolesSection />
              </div>
            )}

            {selectedAction === 'tokens' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Tokens de API</h2>
                <p className="text-sm">Visualize e gerencie os tokens de acesso à API.</p>
                <p className="text-xs text-muted-foreground">(Visualização inicial. Funcionalidade completa em breve.)</p>
              </div>
            )}

            {selectedAction === 'resources' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Uso de Recursos</h2>
                <p className="text-sm">Acompanhe o uso detalhado de recursos do sistema.</p>
                <p className="text-xs text-muted-foreground">(Visualização inicial. Funcionalidade completa em breve.)</p>
              </div>
            )}

            {selectedAction === 'alerts' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Alertas</h2>
                <p className="text-sm">Visualize e gerencie alertas do sistema.</p>
                <p className="text-xs text-muted-foreground">(Visualização inicial. Funcionalidade completa em breve.)</p>
              </div>
            )}

            {selectedAction === 'console' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Console Administrativo</h2>
                <p className="text-sm">Execute comandos administrativos diretamente pelo painel.</p>
                <p className="text-xs text-muted-foreground">(Visualização inicial. Funcionalidade completa em breve.)</p>
              </div>
            )}

            {selectedAction === 'cache' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Gerenciamento de Cache</h2>
                <p className="text-sm">Limpe ou atualize o cache do sistema.</p>
                <p className="text-xs text-muted-foreground">(Visualização inicial. Funcionalidade completa em breve.)</p>
              </div>
            )}

            {selectedAction && !['logs', 'performance'].includes(selectedAction) && (
              <p className="text-center text-muted-foreground">Visualização para "{selectedAction}" ainda não implementada.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PermissionsSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <Button onClick={() => setOpen(true)} className="mb-2">Nova Permissão</Button>
      <PermissionModal open={open} onClose={() => setOpen(false)} />
      <PermissionsList />
    </div>
  );
}

function PermissionModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await fetch(`${API_URL}/api/admin/access/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao criar permissão");
      return res.json();
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      setError("");
      queryClient.invalidateQueries("permissions");
      onClose();
    },
    onError: (err: any) => setError(err.message || "Erro ao criar permissão"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Permissão</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (!name || !description) {
              setError("Preencha todos os campos");
              return;
            }
            mutation.mutate({ name, description });
          }}
        >
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            placeholder="Nome (ex: read:users)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            placeholder="Descrição"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <Button type="submit" disabled={mutation.isPending} className="min-w-[120px]">{mutation.isPending ? "Adicionando..." : "Adicionar"}</Button>
            {error && <span className="text-red-600 text-xs ml-2">{error}</span>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PermissionsList() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/access/permissions`);
      if (!res.ok) throw new Error("Erro ao buscar permissões");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const [toDelete, setToDelete] = useState<number|null>(null);
  const mutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/api/admin/access/permissions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao remover permissão");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries("permissions"),
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando permissões...</p>;
  if (isError) return <p className="text-red-600">Erro: {error.message}</p>;
  if (!data || data.length === 0) return <p className="text-muted-foreground">Nenhuma permissão encontrada.</p>;

  return (
    <div>
      <ul className="divide-y border rounded bg-muted/30">
        {data.map((perm: any) => (
          <li key={perm.id} className="p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 group hover:bg-muted/50 transition">
            <span className="font-mono text-xs text-primary w-32">{perm.name}</span>
            <span className="text-sm flex-1">{perm.description}</span>
            <Button
              variant="destructive"
              size="sm"
              className="ml-auto px-3 py-1 h-7 text-xs"
              onClick={() => setToDelete(perm.id)}
            >
              Remover
            </Button>
          </li>
        ))}
      </ul>
      <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Remover permissão?</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Tem certeza que deseja remover esta permissão?</div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => { mutation.mutate(toDelete!); setToDelete(null); }}>Remover</Button>
            <Button variant="outline" size="sm" onClick={() => setToDelete(null)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RolesSection() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <Button onClick={() => setOpen(true)} className="mb-2">Novo Cargo</Button>
      <RoleModal open={open} onClose={() => setOpen(false)} />
      <RolesList />
    </div>
  );
}

function RoleModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [error, setError] = useState("");
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/access/permissions`);
      if (!res.ok) throw new Error("Erro ao buscar permissões");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });
  const mutation = useMutation({
    mutationFn: async (data: { name: string; permissions: string[] }) => {
      const res = await fetch(`${API_URL}/api/admin/access/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao criar cargo");
      return res.json();
    },
    onSuccess: () => {
      setName("");
      setSelectedPerms([]);
      setError("");
      queryClient.invalidateQueries("roles");
      onClose();
    },
    onError: (err: any) => setError(err.message || "Erro ao criar cargo"),
  });

  if (isLoading) return null;
  if (!permissions) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Cargo</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (!name) {
              setError("Informe o nome do cargo");
              return;
            }
            mutation.mutate({ name, permissions: selectedPerms });
          }}
        >
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            placeholder="Nome do cargo (ex: admin)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {permissions.map((perm: any) => (
              <label key={perm.name} className="flex items-center gap-1 text-xs border rounded px-2 py-1 bg-white">
                <input
                  type="checkbox"
                  checked={selectedPerms.includes(perm.name)}
                  onChange={e => {
                    if (e.target.checked) setSelectedPerms([...selectedPerms, perm.name]);
                    else setSelectedPerms(selectedPerms.filter(p => p !== perm.name));
                  }}
                />
                <span className="font-mono text-primary">{perm.name}</span>
                <span className="text-muted-foreground">({perm.description})</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Button type="submit" disabled={mutation.isPending} className="min-w-[120px]">{mutation.isPending ? "Adicionando..." : "Adicionar Cargo"}</Button>
            {error && <span className="text-red-600 text-xs ml-2">{error}</span>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RolesList() {
  const queryClient = useQueryClient();
  const { data: roles, isLoading: loadingRoles, isError: errorRoles, error: rolesError } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/access/roles`);
      if (!res.ok) throw new Error("Erro ao buscar cargos");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });
  const { data: permissions, isLoading: loadingPerms, isError: errorPerms, error: permsError } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/access/permissions`);
      if (!res.ok) throw new Error("Erro ao buscar permissões");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });
  const [editRole, setEditRole] = useState<any|null>(null);
  const [toDelete, setToDelete] = useState<number|null>(null);
  const mutationDelete = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/api/admin/access/roles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao remover cargo");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries("roles"),
  });

  if (loadingRoles || loadingPerms) return <p className="text-muted-foreground">Carregando cargos e permissões...</p>;
  if (errorRoles) return <p className="text-red-600">Erro ao buscar cargos: {rolesError.message}</p>;
  if (errorPerms) return <p className="text-red-600">Erro ao buscar permissões: {permsError.message}</p>;
  if (!roles || roles.length === 0) return <p className="text-muted-foreground">Nenhum cargo encontrado.</p>;

  // Helper para buscar descrição da permissão
  const getPermDesc = (permName: string) => {
    const perm = permissions.find((p: any) => p.name === permName);
    return perm ? perm.description : permName;
  };

  return (
    <div className="space-y-4">
      {roles.map((role: any) => (
        <div key={role.id} className="border rounded p-4 bg-muted/30 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
          <div className="flex-1">
            <div className="font-semibold text-primary mb-1">{role.name}</div>
            <div className="text-xs text-muted-foreground mb-2">ID: {role.id}</div>
            <div>
              <span className="font-medium">Permissões:</span>
              <ul className="list-disc ml-6 mt-1">
                {role.permissions.length === 0 ? (
                  <li className="text-muted-foreground">Nenhuma permissão associada.</li>
                ) : (
                  role.permissions.map((perm: string) => (
                    <li key={perm} className="flex gap-2 items-center">
                      <span className="font-mono text-xs text-primary">{perm}</span>
                      <span className="text-xs text-muted-foreground">{getPermDesc(perm)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[120px]">
            <Button variant="outline" size="sm" onClick={() => setEditRole(role)}>Editar</Button>
            <Button variant="destructive" size="sm" onClick={() => setToDelete(role.id)}>Remover</Button>
          </div>
        </div>
      ))}
      {/* Modal de edição de cargo */}
      <EditRoleModal role={editRole} permissions={permissions} onClose={() => setEditRole(null)} />
      {/* Confirmação de remoção */}
      <Dialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Remover cargo?</DialogTitle>
          </DialogHeader>
          <div className="mb-4">Tem certeza que deseja remover este cargo?</div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => { mutationDelete.mutate(toDelete!); setToDelete(null); }}>Remover</Button>
            <Button variant="outline" size="sm" onClick={() => setToDelete(null)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditRoleModal({ role, permissions, onClose }: { role: any, permissions: any[], onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(role?.name || "");
  const [selectedPerms, setSelectedPerms] = useState<string[]>(role?.permissions || []);
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: async (data: { id: number, name: string, permissions: string[] }) => {
      const res = await fetch(`${API_URL}/api/admin/access/roles/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, permissions: data.permissions }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Erro ao editar cargo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries("roles");
      onClose();
    },
    onError: (err: any) => setError(err.message || "Erro ao editar cargo"),
  });

  useEffect(() => {
    setName(role?.name || "");
    setSelectedPerms(role?.permissions || []);
  }, [role]);

  if (!role) return null;

  return (
    <Dialog open={!!role} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Cargo</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (!name) {
              setError("Informe o nome do cargo");
              return;
            }
            mutation.mutate({ id: role.id, name, permissions: selectedPerms });
          }}
        >
          <input
            type="text"
            className="border rounded px-2 py-1 w-48"
            placeholder="Nome do cargo"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {permissions.map((perm: any) => (
              <label key={perm.name} className="flex items-center gap-1 text-xs border rounded px-2 py-1 bg-white">
                <input
                  type="checkbox"
                  checked={selectedPerms.includes(perm.name)}
                  onChange={e => {
                    if (e.target.checked) setSelectedPerms([...selectedPerms, perm.name]);
                    else setSelectedPerms(selectedPerms.filter(p => p !== perm.name));
                  }}
                />
                <span className="font-mono text-primary">{perm.name}</span>
                <span className="text-muted-foreground">({perm.description})</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Button type="submit" disabled={mutation.isPending} className="min-w-[120px]">{mutation.isPending ? "Salvando..." : "Salvar"}</Button>
            {error && <span className="text-red-600 text-xs ml-2">{error}</span>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
