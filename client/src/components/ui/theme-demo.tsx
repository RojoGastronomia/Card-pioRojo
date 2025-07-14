import { useThemeHook } from "@/hooks/use-theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ThemeDemo() {
  const { theme, resolvedTheme, isDark, isLight } = useThemeHook();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Demonstração do Tema</CardTitle>
        <CardDescription>
          Mostra o estado atual do sistema de temas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tema Configurado:</span>
          <Badge variant={theme === 'system' ? 'secondary' : 'default'}>
            {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Escuro' : 'Claro'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tema Ativo:</span>
          <Badge variant={resolvedTheme === 'dark' ? 'secondary' : 'default'}>
            {resolvedTheme === 'dark' ? 'Escuro' : 'Claro'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado:</span>
          <div className="flex gap-2">
            {isLight && <Badge variant="default">Claro</Badge>}
            {isDark && <Badge variant="secondary">Escuro</Badge>}
          </div>
        </div>
        
        <div className="p-4 rounded-lg border bg-card text-card-foreground">
          <p className="text-sm">
            Este é um exemplo de como os componentes se adaptam automaticamente ao tema.
            O fundo, texto e bordas mudam conforme o tema selecionado.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 