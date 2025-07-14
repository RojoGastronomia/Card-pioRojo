import { useTheme } from "@/context/theme-context";

export function useThemeHook() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';

  return {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
    isDark,
    isLight,
  };
} 