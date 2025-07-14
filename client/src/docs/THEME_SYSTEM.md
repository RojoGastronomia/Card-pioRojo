# Sistema de Temas - Modo Escuro e Claro

Este documento explica como usar o sistema de temas implementado no projeto.

## Visão Geral

O sistema de temas permite alternar entre modo claro, escuro e seguir as preferências do sistema operacional. O tema é persistido no localStorage e se adapta automaticamente às mudanças do sistema.

## Componentes Principais

### 1. ThemeProvider
Localização: `src/context/theme-context.tsx`

Fornece o contexto de tema para toda a aplicação. Deve ser usado no nível mais alto da aplicação.

```tsx
import { ThemeProvider } from "@/context/theme-context";

function App() {
  return (
    <ThemeProvider>
      {/* resto da aplicação */}
    </ThemeProvider>
  );
}
```

### 2. useTheme Hook
Localização: `src/context/theme-context.tsx`

Hook principal para acessar o contexto de tema.

```tsx
import { useTheme } from "@/context/theme-context";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div>
      <p>Tema atual: {theme}</p>
      <p>Tema resolvido: {resolvedTheme}</p>
      <button onClick={() => setTheme('dark')}>Modo Escuro</button>
    </div>
  );
}
```

### 3. useThemeHook
Localização: `src/hooks/use-theme.tsx`

Hook personalizado com funcionalidades adicionais.

```tsx
import { useThemeHook } from "@/hooks/use-theme";

function MyComponent() {
  const { theme, toggleTheme, isDark, isLight } = useThemeHook();
  
  return (
    <div>
      <button onClick={toggleTheme}>Alternar Tema</button>
      {isDark && <p>Modo escuro ativo</p>}
      {isLight && <p>Modo claro ativo</p>}
    </div>
  );
}
```

### 4. ThemeToggle
Localização: `src/components/ui/theme-toggle.tsx`

Componente de interface para alternar entre temas.

```tsx
import { ThemeToggle } from "@/components/ui/theme-toggle";

function Navbar() {
  return (
    <nav>
      <ThemeToggle />
    </nav>
  );
}
```

## Como Usar em Componentes

### 1. Usando Classes CSS Condicionais

```tsx
function MyComponent() {
  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-gray-800 dark:text-gray-200">Título</h1>
      <p className="text-gray-600 dark:text-gray-400">Texto</p>
    </div>
  );
}
```

### 2. Usando Variáveis CSS

```tsx
function MyComponent() {
  return (
    <div className="bg-background text-foreground border border-border">
      <h1 className="text-foreground">Título</h1>
      <p className="text-muted-foreground">Texto</p>
    </div>
  );
}
```

### 3. Usando Lógica Condicional

```tsx
function MyComponent() {
  const { isDark } = useThemeHook();
  
  return (
    <div className={isDark ? "bg-gray-900" : "bg-white"}>
      <h1 className={isDark ? "text-white" : "text-black"}>
        Título
      </h1>
    </div>
  );
}
```

## Variáveis CSS Disponíveis

O sistema usa variáveis CSS que mudam automaticamente com o tema:

### Cores Principais
- `--background`: Cor de fundo principal
- `--foreground`: Cor do texto principal
- `--primary`: Cor primária
- `--primary-foreground`: Cor do texto sobre fundo primário

### Cores Secundárias
- `--secondary`: Cor secundária
- `--secondary-foreground`: Cor do texto sobre fundo secundário
- `--muted`: Cor suave
- `--muted-foreground`: Cor do texto suave

### Cores de Interface
- `--card`: Cor de fundo de cards
- `--card-foreground`: Cor do texto em cards
- `--popover`: Cor de fundo de popovers
- `--popover-foreground`: Cor do texto em popovers
- `--border`: Cor das bordas
- `--input`: Cor de fundo de inputs
- `--ring`: Cor do anel de foco

### Cores de Estado
- `--destructive`: Cor para ações destrutivas
- `--destructive-foreground`: Cor do texto sobre fundo destrutivo
- `--accent`: Cor de destaque
- `--accent-foreground`: Cor do texto sobre fundo de destaque

## Classes Tailwind Úteis

### Modo Escuro
- `dark:bg-gray-900`: Fundo escuro
- `dark:text-white`: Texto branco
- `dark:border-gray-700`: Borda escura
- `dark:hover:bg-gray-800`: Hover escuro

### Transições
- `transition-colors`: Transição suave de cores
- `duration-200`: Duração da transição

## Exemplo Completo

```tsx
import { useThemeHook } from "@/hooks/use-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ExampleComponent() {
  const { isDark, toggleTheme } = useThemeHook();

  return (
    <Card className="w-full max-w-md transition-colors duration-200">
      <CardHeader>
        <CardTitle className="text-foreground">
          Exemplo de Componente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Este componente se adapta automaticamente ao tema.
        </p>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </CardContent>
    </Card>
  );
}
```

## Boas Práticas

1. **Use variáveis CSS**: Prefira usar as variáveis CSS definidas no sistema
2. **Transições suaves**: Sempre adicione transições para mudanças de tema
3. **Teste ambos os modos**: Sempre teste seus componentes em ambos os temas
4. **Contraste adequado**: Mantenha contraste suficiente entre texto e fundo
5. **Consistência**: Use as mesmas cores em componentes similares

## Troubleshooting

### Tema não está mudando
1. Verifique se o `ThemeProvider` está envolvendo a aplicação
2. Confirme se o Tailwind está configurado com `darkMode: ["class"]`
3. Verifique se as classes `dark:` estão sendo aplicadas

### Transições não funcionam
1. Adicione `transition-colors` aos elementos
2. Verifique se não há conflitos de CSS

### Cores não estão corretas
1. Use as variáveis CSS do sistema
2. Verifique se as classes `dark:` estão corretas
3. Confirme se o tema está sendo aplicado ao elemento `html` 