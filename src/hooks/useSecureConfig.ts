import { useState, useCallback, useEffect } from 'react';

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

const STORAGE_KEY = 'homeassistant_secure_config';

export const useSecureConfig = (): UseSecureConfigReturn => {
  const [config, setConfigState] = useState<SecureConfig | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        setConfigState(parsedConfig);
      }
    } catch (error) {
      console.error('Failed to load secure config from localStorage:', error);
    }
  }, []);

  const setConfig = useCallback((newConfig: SecureConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfigState(newConfig);
    } catch (error) {
      console.error('Failed to save secure config to localStorage:', error);
      setConfigState(newConfig);
    }
  }, []);

  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear secure config from localStorage:', error);
    }
    setConfigState(null);
  }, []);

  return {
    config,
    setConfig,
    clearConfig,
    isConfigured: config !== null,
  };
};