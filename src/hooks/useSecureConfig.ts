import { useState, useCallback } from 'react';

interface SecureConfig {
  baseUrl: string;
  token: string;
}

interface UseSecureConfigReturn {
  config: SecureConfig | null;
  setConfig: (config: SecureConfig) => void;
  clearConfig: () => void;
  isConfigured: boolean;
}

export const useSecureConfig = (): UseSecureConfigReturn => {
  const [config, setConfigState] = useState<SecureConfig | null>(null);

  const setConfig = useCallback((newConfig: SecureConfig) => {
    setConfigState(newConfig);
  }, []);

  const clearConfig = useCallback(() => {
    setConfigState(null);
  }, []);

  return {
    config,
    setConfig,
    clearConfig,
    isConfigured: config !== null,
  };
};