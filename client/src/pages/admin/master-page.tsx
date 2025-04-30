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
      const response = await fetch('/api/admin/system/logs');
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
      const response = await fetch('/api/admin/system/performance');
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
      const response = await fetch(endpoint, { method: "POST" });
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
      const response = await fetch("/api/backup", { method: "POST" });
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
    window.open(`/backups/${backupSuccess.filename}`, '_blank');
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

            {selectedAction && !['logs', 'performance'].includes(selectedAction) && (
              <p className="text-center text-muted-foreground">Visualização para "{selectedAction}" ainda não implementada.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
