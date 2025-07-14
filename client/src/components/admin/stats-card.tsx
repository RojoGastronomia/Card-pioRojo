import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { LucideIcon, ArrowUp } from "lucide-react";
import { ReactNode, useEffect } from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  secondaryValue?: number | string;
  icon: ReactNode;
  change?: number;
  iconBgColor?: string;
  iconColor?: string;
  subtitle?: string;
  showPotential?: boolean;
}

export default function StatsCard({
  title,
  value,
  secondaryValue,
  icon,
  change,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  subtitle,
  showPotential = true,
}: StatsCardProps) {
  // Debug log when component is rendered
  useEffect(() => {
    if (title.toLowerCase().includes('faturamento')) {
      console.log('FATURAMENTO CARD RENDERED WITH:', {
        value,
        valueType: typeof value,
        secondaryValue,
        secondaryValueType: typeof secondaryValue,
        showPotential,
        formatted: {
          primary: typeof value === 'number' ? formatCurrency(value) : value,
          secondary: typeof secondaryValue === 'number' ? formatCurrency(secondaryValue) : secondaryValue,
        }
      });
    }
  }, [title, value, secondaryValue, showPotential]);

  // Format number value with thousands separator
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') {
      return val;
    }
    
    if (val >= 1000) {
      return val.toLocaleString('pt-BR');
    }
    
    return val;
  };

  // Determine if this is a currency card (for faturamento specifically)
  const isCurrencyCard = title.toLowerCase().includes('faturamento');

  // Enhanced parsing for numeric values
  const parseNumericValue = (val: any): number => {
    if (val === null || val === undefined) return 0;
    
    if (typeof val === 'number') return val;
    
    // Try to parse string to number
    const parsed = parseFloat(String(val).replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  // For currency cards, ensure values are treated as numbers
  const safeValue = isCurrencyCard 
    ? parseNumericValue(value) 
    : value;
    
  const safeSecondaryValue = isCurrencyCard && secondaryValue !== undefined
    ? parseNumericValue(secondaryValue)
    : secondaryValue;

  // Debug after parsing
  useEffect(() => {
    if (title.toLowerCase().includes('faturamento')) {
      console.log('FATURAMENTO CARD AFTER PARSING:', {
        originalValue: value,
        parsedValue: safeValue,
        originalSecondaryValue: secondaryValue,
        parsedSecondaryValue: safeSecondaryValue,
        showPotential
      });
    }
  }, [title, value, secondaryValue, safeValue, safeSecondaryValue, showPotential]);

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer bg-card border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-card-foreground">{title}</h3>
          <div className={`w-10 h-10 flex items-center justify-center ${iconBgColor} rounded-full`}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
        </div>
        <div>
          {/* Always use formatCurrency for revenue values to ensure proper formatting */}
          {isCurrencyCard ? (
            <>
              <p className="text-3xl font-semibold text-card-foreground">
                {typeof safeValue === 'number' ? formatCurrency(safeValue) : safeValue}
              </p>
              
              {/* Mostrar potencial apenas se showPotential for true */}
              {showPotential && safeSecondaryValue && Number(safeSecondaryValue) > 0 && (
                <p className="text-lg font-medium text-emerald-600 mt-1">
                  + {typeof safeSecondaryValue === 'number' ? formatCurrency(safeSecondaryValue) : safeSecondaryValue} 
                  <span className="text-xs font-normal">
                    (potencial)
                  </span>
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold text-card-foreground">{formatValue(value)}</p>
              
              {secondaryValue && showPotential && (
                <p className="text-lg font-medium text-emerald-600 mt-1">
                  + {typeof secondaryValue === 'number' && secondaryValue > 0 ? formatValue(secondaryValue) : secondaryValue} <span className="text-xs font-normal">(potencial)</span>
                </p>
              )}
            </>
          )}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
        
        {change !== undefined && (
          <div className="flex items-center mt-2">
            <span className="text-success flex items-center text-sm">
              <ArrowUp className="mr-1" size={14} />
              {change}%
            </span>
            <span className="text-muted-foreground text-sm ml-2">desde o último mês</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
