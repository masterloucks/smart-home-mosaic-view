import { useState, useCallback, useEffect } from 'react';

export interface LayoutConfig {
  columns: 1 | 2 | 3 | 4;
  lastUpdated: string;
}

const STORAGE_KEY = 'homeassistant_layout_config';

const DEFAULT_LAYOUT: LayoutConfig = {
  columns: 3,
  lastUpdated: new Date().toISOString()
};

export const useLayoutConfig = () => {
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(DEFAULT_LAYOUT);

  // Load layout from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config: LayoutConfig = JSON.parse(stored);
        setLayoutConfig(config);
      }
    } catch (error) {
      console.error('Failed to load layout config:', error);
    }
  }, []);

  // Save layout to localStorage
  const saveLayout = useCallback((newConfig: Partial<LayoutConfig>) => {
    try {
      const updatedConfig: LayoutConfig = {
        ...layoutConfig,
        ...newConfig,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
      setLayoutConfig(updatedConfig);
    } catch (error) {
      console.error('Failed to save layout config:', error);
    }
  }, [layoutConfig]);

  // Update column count
  const setColumns = useCallback((columns: 1 | 2 | 3 | 4) => {
    saveLayout({ columns });
  }, [saveLayout]);

  return {
    layoutConfig,
    setColumns,
    columns: layoutConfig.columns
  };
};