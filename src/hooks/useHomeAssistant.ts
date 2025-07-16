import { useState, useEffect, useCallback } from 'react';
import { HAEntity, HAState, Alert } from '@/types/homeassistant';

interface HomeAssistantConfig {
  baseUrl: string;
  token: string;
}

interface HomeAssistantHook {
  entities: Record<string, HAEntity>;
  alerts: Alert[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  callService: (domain: string, service: string, entity_id: string, data?: any) => Promise<void>;
  refreshEntities: () => Promise<void>;
  isConfigured: boolean;
}

export const useHomeAssistant = (config: HomeAssistantConfig | null): HomeAssistantHook => {
  const [entities, setEntities] = useState<Record<string, HAEntity>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = config !== null;

  const getHeaders = useCallback(() => {
    if (!config?.token) return {};
    return {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    };
  }, [config?.token]);

  const fetchEntities = useCallback(async () => {
    if (!config?.baseUrl || !config?.token) {
      setError('Configuration required');
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const headers = getHeaders();
      const response = await fetch(`${config.baseUrl}/api/states`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: HAEntity[] = await response.json();
      const entitiesMap = data.reduce((acc, entity) => {
        acc[entity.entity_id] = entity;
        return acc;
      }, {} as Record<string, HAEntity>);

      setEntities(entitiesMap);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entities');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [config?.baseUrl, config?.token, getHeaders]);

  const callService = useCallback(async (domain: string, service: string, entity_id: string, data?: any) => {
    if (!config?.baseUrl || !config?.token) {
      setError('Configuration required for service calls');
      return;
    }

    try {
      const headers = getHeaders();
      const response = await fetch(`${config.baseUrl}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entity_id,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Service call failed: ${response.status}`);
      }

      // Refresh entities after service call
      await fetchEntities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Service call failed');
    }
  }, [config?.baseUrl, config?.token, getHeaders, fetchEntities]);

  const generateAlerts = useCallback((entities: Record<string, HAEntity>): Alert[] => {
    const newAlerts: Alert[] = [];

    // Check for open doors
    Object.values(entities).forEach(entity => {
      if (entity.entity_id.includes('door_contact_sensor') && entity.state === 'on') {
        newAlerts.push({
          id: `${entity.entity_id}-open`,
          message: `${entity.attributes.friendly_name || entity.entity_id} is open`,
          priority: 'warning',
          timestamp: entity.last_changed,
          entity_id: entity.entity_id,
        });
      }
    });

    // Check for temperature alerts
    Object.values(entities).forEach(entity => {
      if (entity.entity_id.includes('temperature') && entity.attributes.unit_of_measurement === '°F') {
        const temp = parseFloat(entity.state);
        if (temp > 85) {
          newAlerts.push({
            id: `${entity.entity_id}-hot`,
            message: `${entity.attributes.friendly_name || entity.entity_id} temperature is high: ${temp}°F`,
            priority: 'critical',
            timestamp: entity.last_changed,
            entity_id: entity.entity_id,
          });
        } else if (temp < 32) {
          newAlerts.push({
            id: `${entity.entity_id}-cold`,
            message: `${entity.attributes.friendly_name || entity.entity_id} temperature is low: ${temp}°F`,
            priority: 'warning',
            timestamp: entity.last_changed,
            entity_id: entity.entity_id,
          });
        }
      }
    });

    return newAlerts;
  }, []);

  useEffect(() => {
    if (isConfigured) {
      fetchEntities();
      
      // Set up polling for real-time updates (every 5 seconds for better performance)
      const interval = setInterval(fetchEntities, 5000);

      return () => clearInterval(interval);
    }
  }, [fetchEntities, isConfigured]);

  useEffect(() => {
    const newAlerts = generateAlerts(entities);
    setAlerts(newAlerts);
  }, [entities, generateAlerts]);

  return {
    entities,
    alerts,
    isConnected,
    isLoading,
    error,
    callService,
    refreshEntities: fetchEntities,
    isConfigured,
  };
};