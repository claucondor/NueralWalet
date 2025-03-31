import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check if a user exists in Supabase by email
 * @param email User email
 * @returns Object with exists flag
 */
export const checkUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 es el código para "no se encontró ningún registro"
      console.error('Error checking user email in Supabase:', error);
      return { exists: false, error: error.message };
    }

    return { exists: !!data, error: null };
  } catch (error: any) {
    console.error('Exception when checking user email in Supabase:', error);
    return { exists: false, error: error.message };
  }
};

/**
 * Obtiene la dirección de Stellar asociada a un email
 * @param email Email del usuario
 * @returns Objeto con la dirección y estado de éxito
 */
export const getAddressByEmail = async (email: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('address')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error obteniendo dirección por email en Supabase:', error);
      return { success: false, error: error.message };
    }

    if (!data || !data.address) {
      return { success: false, error: 'Email no asociado a ninguna dirección' };
    }

    return { success: true, address: data.address };
  } catch (error: any) {
    console.error('Excepción al obtener dirección por email en Supabase:', error);
    return { success: false, error: error.message };
  }
};