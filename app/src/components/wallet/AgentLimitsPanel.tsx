import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase';
import { AgentLimits } from '../../types/agent';

interface AgentLimitsPanelProps {
  walletAddress: string;
}

const DEFAULT_LIMITS = {
  max_tokens_per_tx: 100,
  daily_tx_limit: 1000,
  max_tx_per_day: 5,
  monthly_tx_limit: 10000,
  whitelist_addresses: []
};

const AgentLimitsPanel: React.FC<AgentLimitsPanelProps> = ({ walletAddress }) => {
  const [limits, setLimits] = useState<AgentLimits | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formValues, setFormValues] = useState({
    max_tokens_per_tx: 0,
    daily_tx_limit: 0,
    max_tx_per_day: 0,
    monthly_tx_limit: 0,
    whitelist_addresses: ''
  });

  // Cargar límites al iniciar
  useEffect(() => {
    if (walletAddress) {
      fetchLimits();
    }
  }, [walletAddress]);

  // Obtener límites del agente
  const fetchLimits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_limits')
        .select('*')
        .eq('user_address', walletAddress)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No hay configuración - establecer valores predeterminados
          setLimits({
            ...DEFAULT_LIMITS,
            user_address: walletAddress,
            whitelist_addresses: []
          });
          updateFormValues({
            ...DEFAULT_LIMITS, user_address: walletAddress,
            whitelist_addresses: []
          });
        } else {
          console.error('Error al cargar límites:', error);
          toast.error('Could not load agent limits');
        }
      } else if (data) {
        setLimits(data);
        updateFormValues(data);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.error('Error loading configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar valores del formulario
  const updateFormValues = (data: AgentLimits) => {
    setFormValues({
      max_tokens_per_tx: data.max_tokens_per_tx,
      daily_tx_limit: data.daily_tx_limit,
      max_tx_per_day: data.max_tx_per_day,
      monthly_tx_limit: data.monthly_tx_limit,
      whitelist_addresses: Array.isArray(data.whitelist_addresses) 
        ? data.whitelist_addresses.join('\n') 
        : ''
    });
  };

  // Manejar cambios del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: name === 'whitelist_addresses' ? value : Number(value)
    }));
  };

  // Save changes
  const handleSave = async () => {
    try {
      const whitelist = formValues.whitelist_addresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      const updatedLimits = {
        user_address: walletAddress,
        max_tokens_per_tx: formValues.max_tokens_per_tx,
        daily_tx_limit: formValues.daily_tx_limit,
        max_tx_per_day: formValues.max_tx_per_day,
        monthly_tx_limit: formValues.monthly_tx_limit,
        whitelist_addresses: whitelist
      };

      const { data, error } = await supabase
        .from('agent_limits')
        .upsert(updatedLimits)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setLimits(data);
      setIsEditing(false);
      toast.success('Agent limits updated');
    } catch (error) {
      console.error('Error al guardar límites:', error);
      toast.error('Error saving changes');
    }
  };

  // Restablecer a valores predeterminados
  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all limits to default values?')) {
      try {
        const defaultValues = {
          ...DEFAULT_LIMITS,
          user_address: walletAddress
        };

        const { data, error } = await supabase
          .from('agent_limits')
          .upsert(defaultValues)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setLimits(data);
        updateFormValues(data);
        toast.success('Limits reset to default values');
      } catch (error) {
        console.error('Error al restablecer límites:', error);
        toast.error('Error resetting values');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl bg-white shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-800">Agent Limits</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Maximum per transaction (tokens)
            </label>
            <input
              type="number"
              name="max_tokens_per_tx"
              value={formValues.max_tokens_per_tx}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Daily limit (tokens)
            </label>
            <input
              type="number"
              name="daily_tx_limit"
              value={formValues.daily_tx_limit}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Maximum transactions per day
            </label>
            <input
              type="number"
              name="max_tx_per_day"
              value={formValues.max_tx_per_day}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Monthly limit (tokens)
            </label>
            <input
              type="number"
              name="monthly_tx_limit"
              value={formValues.monthly_tx_limit}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Allowed addresses (one per line)
            </label>
            <textarea
              name="whitelist_addresses"
              value={formValues.whitelist_addresses}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="0x123...\n0x456..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to allow all addresses
            </p>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleReset}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Reset to default values
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Maximum per transaction</p>
            <p className="font-medium text-gray-700">
              {limits?.max_tokens_per_tx} tokens
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Daily limit</p>
            <p className="font-medium text-gray-700">
              {limits?.daily_tx_limit} tokens
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Transactions per day</p>
            <p className="font-medium text-gray-700">
              {limits?.max_tx_per_day} transactions
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Monthly limit</p>
            <p className="font-medium text-gray-700">
              {limits?.monthly_tx_limit} tokens
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Allowed addresses</p>
            {limits?.whitelist_addresses && limits.whitelist_addresses.length > 0 ? (
              <div className="max-h-24 overflow-y-auto text-xs">
                {limits.whitelist_addresses.map((addr, i) => (
                  <div key={i} className="font-mono bg-gray-100 p-1 my-1 rounded truncate">
                    {addr}
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-medium text-gray-700">All addresses allowed</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentLimitsPanel;