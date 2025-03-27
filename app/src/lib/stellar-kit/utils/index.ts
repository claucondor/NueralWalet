// Este archivo exportará todas las utilidades
// En una implementación completa, aquí se exportarían funciones desde otros archivos

// Función para formatear cantidades de XLM 
export function formatXLM(amount: number, decimals: number = 7): string {
  return amount.toFixed(decimals) + ' XLM';
}

// Función para formatear direcciones Stellar (acortar para visualización)
export function formatAddress(address: string, visibleChars: number = 4): string {
  if (!address || address.length <= visibleChars * 2) {
    return address;
  }
  
  const start = address.substring(0, visibleChars);
  const end = address.substring(address.length - visibleChars);
  
  return `${start}...${end}`;
}

// Función para validar una dirección Stellar
export function isValidStellarAddress(address: string): boolean {
  // Una validación básica: las direcciones Stellar comienzan con G
  return typeof address === 'string' && 
         address.length === 56 && 
         address.startsWith('G');
} 