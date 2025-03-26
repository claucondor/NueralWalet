/**
 * Utilidades para formateo de valores
 */

/**
 * Formatea un balance en bruto según los decimales del token
 * @param balance Balance en bruto (como string)
 * @param decimals Decimales del token
 * @returns Balance formateado como string
 */
export function formatTokenBalance(balance: string, decimals: number): string {
  try {
    // Si el balance está vacío o es cero, devolver "0"
    if (!balance || balance === '0') {
      return '0';
    }
    
    // Convertir el string a número
    const balanceNum = Number(balance);
    
    // Si no es un número válido, devolver el balance original
    if (isNaN(balanceNum)) {
      return balance;
    }
    
    // Aplicar factor de decimales
    const formattedNum = balanceNum / Math.pow(10, decimals);
    
    // Convertir a string con el número apropiado de decimales
    let formattedStr = formattedNum.toString();
    
    // Para números grandes, utilizar notación fija hasta 8 decimales significativos
    if (formattedNum > 1) {
      formattedStr = formattedNum.toFixed(Math.min(8, decimals));
      // Eliminar ceros finales y punto decimal si no hay decimales
      formattedStr = formattedStr.replace(/\.?0+$/, '');
    }
    
    return formattedStr;
  } catch (error) {
    console.error('Error al formatear balance:', error);
    return balance; // Devolver el balance original en caso de error
  }
}

/**
 * Valida y trunca el texto del memo si es necesario
 * @param memo Texto del memo
 * @param maxLength Longitud máxima permitida en bytes
 * @returns Texto validado (truncado si es necesario)
 */
export function validateMemoText(memo: string, maxLength: number = 28): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(memo);
  
  if (bytes.length > maxLength) {
    console.warn(`Advertencia: El memo "${memo}" excede el límite de ${maxLength} bytes. Será truncado.`);
    // Truncar el memo a un número de caracteres que probablemente cumpla con el límite de bytes
    // Este enfoque es simple pero puede no ser perfecto con caracteres multibyte
    return memo.substring(0, maxLength - 3) + '...';
  }
  
  return memo;
}

/**
 * Formatea una fecha en formato ISO a una cadena legible
 * @param date Fecha en formato ISO
 * @returns Fecha formateada
 */
export function formatDate(date: string): string {
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleString();
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return date;
  }
} 