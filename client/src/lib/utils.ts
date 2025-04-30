import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getApiBaseUrl as getApiBaseUrlOriginal } from "./queryClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico para moeda brasileira (BRL)
 * @param value - Valor a ser formatado
 * @returns Valor formatado em BRL (ex: R$ 1.234,56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Obtém a URL base da API
 * @returns URL base da API
 * @deprecated Use a mesma função de @/lib/queryClient diretamente
 */
export function getApiBaseUrl(): string {
  return getApiBaseUrlOriginal();
}
