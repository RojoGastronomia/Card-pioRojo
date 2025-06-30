import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/language-context';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLang: 'pt' | 'en') => {
    setLanguage(newLang);
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        className={`text-xs px-2 font-medium ${language === 'pt' ? 'bg-primary/10 text-primary' : ''}`}
        onClick={() => handleLanguageChange('pt')}
      >
        PT
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`text-xs px-2 font-medium ${language === 'en' ? 'bg-primary/10 text-primary' : ''}`}
        onClick={() => handleLanguageChange('en')}
      >
        EN
      </Button>
    </div>
  );
} 