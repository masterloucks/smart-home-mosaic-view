import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  const wsRef = useRef<WebSocket | null>(null);
  const messageIdRef = useRef(1);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConfigured = config !== null;

  const getHeaders = useCallback(() => {
    if (!config?.token) return {};
    return {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    };
  }, [config?.token]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Auth messages shouldn't have an id field
      if (message.type === 'auth') {
        wsRef.current.send(JSON.stringify(message));
      } else {
        wsRef.current.send(JSON.stringify({ ...message, id: messageIdRef.current++ }));
      }
    }
  }, []);

  const fetchInitialStates = useCallback(async () => {
    // Use WebSocket to get initial states instead of HTTP to avoid CORS issues
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({ type: 'get_states' });
    }
  }, [sendMessage]);

  const connectWebSocket = useCallback(() => {
    if (!config?.baseUrl || !config?.token) {
      setError('Configuration required');
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = config.baseUrl.replace(/^http/, 'ws') + '/api/websocket';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'auth_required':
              // Send authentication
              sendMessage({ type: 'auth', access_token: config.token });
              break;
              
            case 'auth_ok':
              setIsConnected(true);
              setError(null);
              // Subscribe to state changes
              sendMessage({ type: 'subscribe_events', event_type: 'state_changed' });
              // Fetch initial states
              fetchInitialStates();
              break;
              
            case 'auth_invalid':
              setError('Authentication failed');
              setIsConnected(false);
              break;
              
            case 'event':
              if (message.event?.event_type === 'state_changed') {
                const newState = message.event.data.new_state;
                if (newState) {
                  setEntities(prev => ({
                    ...prev,
                    [newState.entity_id]: newState
                  }));
                }
              }
              break;
              
            case 'result':
              // Handle get_states response
              if (message.success && Array.isArray(message.result)) {
                const entitiesMap = message.result.reduce((acc: Record<string, HAEntity>, entity: HAEntity) => {
                  acc[entity.entity_id] = entity;
                  return acc;
                }, {});
                setEntities(entitiesMap);
                setIsLoading(false);
              }
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect after 5 seconds if not manually closed
        if (event.code !== 1000 && config) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connectWebSocket();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect WebSocket');
      setIsConnected(false);
    }
  }, [config, sendMessage, fetchInitialStates]);

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

      // No need to refresh entities manually - WebSocket will provide real-time updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Service call failed');
    }
  }, [config?.baseUrl, config?.token, getHeaders]);

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
      connectWebSocket();
      
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [connectWebSocket, isConfigured]);

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
    refreshEntities: fetchInitialStates,
    isConfigured,
  };
};