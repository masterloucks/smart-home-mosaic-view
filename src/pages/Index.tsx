import { useEffect } from 'react';
import { useHomeAssistant } from '@/hooks/useHomeAssistant';
import { useSecureConfig } from '@/hooks/useSecureConfig';
import { DeviceGroup } from '@/components/DeviceGroup';
import { CameraFeed } from '@/components/CameraFeed';
import { AlertsPanel } from '@/components/AlertsPanel';
import { SecurityConfig } from '@/components/SecurityConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Home, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Clock,
  Bug
} from 'lucide-react';
import { DeviceGroup as DeviceGroupType, CameraEntity } from '@/types/homeassistant';
import { Link } from 'react-router-dom';

const Index = () => {
  const { config, setConfig, isConfigured } = useSecureConfig();
  const { 
    entities, 
    alerts, 
    isConnected, 
    isLoading, 
    error, 
    callService, 
    refreshEntities 
  } = useHomeAssistant(config);
  
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: "Connection Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Group entities by type
  const groupEntities = (): DeviceGroupType[] => {
    const groups: DeviceGroupType[] = [];
    const entityValues = Object.values(entities);

    // Locks group
    const locks = entityValues.filter(e => e.entity_id.includes('lock'));
    if (locks.length > 0) {
      groups.push({
        id: 'locks',
        name: 'Locks',
        entities: locks,
        type: 'lock'
      });
    }

    // Binary sensors (doors, motion, etc.)
    const binarySensors = entityValues.filter(e => e.entity_id.startsWith('binary_sensor'));
    if (binarySensors.length > 0) {
      groups.push({
        id: 'binary_sensors',
        name: 'Sensors',
        entities: binarySensors,
        type: 'binary_sensor'
      });
    }

    // Temperature sensors
    const temperatureSensors = entityValues.filter(e => 
      e.entity_id.startsWith('sensor') && 
      e.entity_id.includes('temperature')
    );
    if (temperatureSensors.length > 0) {
      groups.push({
        id: 'temperature_sensors',
        name: 'Temperature',
        entities: temperatureSensors,
        type: 'sensor'
      });
    }

    // Device trackers
    const deviceTrackers = entityValues.filter(e => e.entity_id.startsWith('device_tracker'));
    if (deviceTrackers.length > 0) {
      groups.push({
        id: 'device_trackers',
        name: 'Presence',
        entities: deviceTrackers,
        type: 'device_tracker'
      });
    }

    return groups;
  };

  // Get camera entities
  const getCameras = (): CameraEntity[] => {
    return Object.values(entities)
      .filter(e => e.entity_id.startsWith('camera'))
      .map(e => e as CameraEntity);
  };

  const handleEntityToggle = async (entityId: string) => {
    const entity = entities[entityId];
    if (!entity) return;

    try {
      if (entityId.includes('lock')) {
        const service = entity.state === 'locked' ? 'unlock' : 'lock';
        await callService('lock', service, entityId);
        toast({
          title: "Lock Updated",
          description: `${entity.attributes.friendly_name || entityId} ${service}ed`,
        });
      }
    } catch (err) {
      toast({
        title: "Action Failed",
        description: "Failed to update device",
        variant: "destructive",
      });
    }
  };

  const deviceGroups = groupEntities();
  const cameras = getCameras();

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Home className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Home Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Smart Home Control Center
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          
          <Link to="/connection-test">
            <Button
              variant="outline"
              size="sm"
              className="touch-target"
            >
              <Bug className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshEntities}
            disabled={isLoading || !isConfigured}
            className="touch-target"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Security Configuration */}
      {!isConfigured && (
        <div className="mb-6">
          <SecurityConfig onConfigSaved={setConfig} isConnected={isConnected} />
        </div>
      )}
      
      {isConfigured && !isConnected && (
        <div className="mb-6">
          <SecurityConfig onConfigSaved={setConfig} isConnected={isConnected} />
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Device Groups - Left Column */}
        <div className="lg:col-span-4 space-y-6">
          {deviceGroups.map((group) => (
            <DeviceGroup
              key={group.id}
              group={group}
              onEntityToggle={handleEntityToggle}
            />
          ))}
          
          {deviceGroups.length === 0 && !isLoading && (
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <Home className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No devices found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Camera Feeds - Center Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Live Cameras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cameras.map((camera) => (
                <CameraFeed
                  key={camera.entity_id}
                  camera={camera}
                  baseUrl={config?.baseUrl}
                  token={config?.token}
                />
              ))}
              
              {cameras.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No cameras configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts Panel - Right Column */}
        <div className="lg:col-span-3">
          <AlertsPanel 
            alerts={alerts}
            onDismissAlert={(alertId) => {
              // Handle alert dismissal if needed
              console.log('Dismiss alert:', alertId);
            }}
          />
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          Last updated: {new Date().toLocaleString()} | 
          Entities: {Object.keys(entities).length} | 
          Active alerts: {alerts.length}
        </p>
      </div>
    </div>
  );
};

export default Index;
