import { useState, useCallback, useEffect } from 'react';

export interface SystemWidget {
  id: string;
  name: string;
  type: 'cameras' | 'alerts' | 'weather_summary' | 'energy_usage' | 'network_status';
  enabled: boolean;
  column: number;
  order: number;
}

interface SystemWidgetsConfig {
  widgets: SystemWidget[];
  lastUpdated: string;
}

const STORAGE_KEY = 'homeassistant_system_widgets';

const DEFAULT_WIDGETS: SystemWidget[] = [
  {
    id: 'cameras',
    name: 'Live Cameras',
    type: 'cameras',
    enabled: true,
    column: 2,
    order: 1
  },
  {
    id: 'alerts',
    name: 'System Alerts',
    type: 'alerts',
    enabled: true,
    column: 3,
    order: 1
  }
];

export const useSystemWidgets = () => {
  const [widgets, setWidgets] = useState<SystemWidget[]>(DEFAULT_WIDGETS);

  // Load widgets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config: SystemWidgetsConfig = JSON.parse(stored);
        setWidgets(config.widgets);
      }
    } catch (error) {
      console.error('Failed to load system widgets config:', error);
    }
  }, []);

  // Save widgets to localStorage
  const saveWidgets = useCallback((newWidgets: SystemWidget[]) => {
    try {
      const config: SystemWidgetsConfig = {
        widgets: newWidgets,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setWidgets(newWidgets);
    } catch (error) {
      console.error('Failed to save system widgets config:', error);
    }
  }, []);

  // Update widget
  const updateWidget = useCallback((widgetId: string, updates: Partial<Omit<SystemWidget, 'id'>>) => {
    const newWidgets = widgets.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    );
    saveWidgets(newWidgets);
  }, [widgets, saveWidgets]);

  // Toggle widget enabled state
  const toggleWidget = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      updateWidget(widgetId, { enabled: !widget.enabled });
    }
  }, [widgets, updateWidget]);

  // Add new system widget (for future expansion)
  const addWidget = useCallback((widget: Omit<SystemWidget, 'id'>) => {
    const newWidget: SystemWidget = {
      ...widget,
      id: `widget_${Date.now()}`
    };
    const newWidgets = [...widgets, newWidget];
    saveWidgets(newWidgets);
    return newWidget.id;
  }, [widgets, saveWidgets]);

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    const newWidgets = widgets.filter(widget => widget.id !== widgetId);
    saveWidgets(newWidgets);
  }, [widgets, saveWidgets]);

  // Get widgets for specific column
  const getWidgetsForColumn = useCallback((column: number) => {
    return widgets
      .filter(widget => widget.enabled && widget.column === column)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  return {
    widgets: widgets.sort((a, b) => a.order - b.order),
    updateWidget,
    toggleWidget,
    addWidget,
    removeWidget,
    getWidgetsForColumn
  };
};