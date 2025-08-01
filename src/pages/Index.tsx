import { useEffect } from 'react';
import { useHomeAssistant } from '@/hooks/useHomeAssistant';
import { useSecureConfig } from '@/hooks/useSecureConfig';
import { useEntityConfig } from '@/hooks/useEntityConfig';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useGroupConfig } from '@/hooks/useGroupConfig';
import { DeviceGroup } from '@/components/DeviceGroup';
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
  Bug,
  Settings
} from 'lucide-react';
import { DeviceGroup as DeviceGroupType } from '@/types/homeassistant';
import { Link } from 'react-router-dom';

const Index = () => {
  const { config, setConfig, isConfigured } = useSecureConfig();
  const { getEffectiveFilter } = useEntityConfig();
  const { columns } = useLayoutConfig();
  const { groups, getGroupsForColumn } = useGroupConfig();
  
  
  // Create config with entity filter for main entities display
  const configWithFilter = config ? {
    ...config,
    entityFilter: getEffectiveFilter()
  } : null;
  
  // Create config without filter to get ALL entities for autocomplete
  const configWithoutFilter = config ? {
    ...config,
    entityFilter: undefined // No filter to get all entities
  } : null;
  
  const { 
    entities, 
    isConnected,
    isLoading, 
    error, 
    callService, 
    refreshEntities 
  } = useHomeAssistant(configWithFilter);
  
  // Get all entities for autocomplete (separate hook call)
  const { entities: allEntities } = useHomeAssistant(configWithoutFilter);
  
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

  // Map domain to group ID for entity assignment
  const getGroupIdFromEntity = (entityId: string): string => {
    const domain = entityId.split('.')[0];
    switch (domain) {
      case 'light':
      case 'switch':
        return 'lights_switches';
      case 'climate':
        return 'climate';
      case 'fan':
        return 'fans';
      case 'cover':
        return 'covers';
      case 'media_player':
        return 'media_players';
      case 'lock':
        return 'locks';
      case 'binary_sensor':
      case 'sensor':
        return 'sensors';
      case 'person':
        return 'people';
      case 'weather':
        return 'weather';
      default:
        return 'sensors'; // fallback group
    }
  };

  // Group entities by configured groups
  const groupEntitiesByConfig = () => {
    // Use the filtered entities, not all entities
    const entityValues = Object.values(entities);
    
    // Debug: log entity filtering status
    console.log('Entity filter status:', { 
      isConnected,
      isFilterEnabled: configWithFilter?.entityFilter !== undefined,
      filterCount: configWithFilter?.entityFilter?.length || 0,
      totalEntities: entityValues.length,
      actualEntityIds: Object.keys(entities),
      filterEntities: configWithFilter?.entityFilter,
      configuredGroups: groups.map(g => ({ id: g.id, name: g.name, column: g.column, entityCount: g.entityIds.length }))
    });

    // Only show groups with explicitly assigned entities
    const groupsWithEntities = groups.map(group => {
      // Only use entities that are explicitly assigned to this group
      const groupEntities = group.entityIds
        .map(entityId => entities[entityId])
        .filter(entity => entity !== undefined);

      return {
        id: group.id,
        name: group.name,
        entities: groupEntities,
        type: group.icon as any,
        column: group.column
      };
    }).filter(group => group.entities.length > 0);

    console.log('Configured groups with entities:', groupsWithEntities.map(g => ({ 
      id: g.id, 
      name: g.name, 
      column: g.column, 
      entityCount: g.entities.length,
      entities: g.entities.map(e => e.entity_id)
    })));

    return groupsWithEntities;
  };

  // Main groupEntities function
  const groupEntities = (): DeviceGroupType[] => {
    // Always try to use the configured groups first
    const configuredGroups = groupEntitiesByConfig();
    if (configuredGroups.length > 0) {
      return configuredGroups;
    }

    // Fallback to legacy system only if no groups are configured at all
    const legacyGroups: DeviceGroupType[] = [];
    const entityValues = Object.values(entities);
    
    console.log('Using legacy grouping system');

    // Lights and switches group (combined as requested)
    const lightsAndSwitches = entityValues.filter(e => 
      e.entity_id.startsWith('light') || e.entity_id.startsWith('switch')
    );
    if (lightsAndSwitches.length > 0) {
      legacyGroups.push({
        id: 'lights',
        name: 'Lights & Switches',
        entities: lightsAndSwitches,
        type: 'light',
        column: 1
      });
    }

    // Climate controls
    const climate = entityValues.filter(e => e.entity_id.startsWith('climate'));
    if (climate.length > 0) {
      legacyGroups.push({
        id: 'climate',
        name: 'Climate',
        entities: climate,
        type: 'climate' as any,
        column: 1
      });
    }

    // Temperature sensors
    const temperatureSensors = entityValues.filter(e => 
      e.entity_id.startsWith('sensor') && 
      e.entity_id.includes('temperature')
    );
    if (temperatureSensors.length > 0) {
      legacyGroups.push({
        id: 'temperature_sensors',
        name: 'Temperature',
        entities: temperatureSensors,
        type: 'sensor',
        column: 1
      });
    }

    return legacyGroups;
  };


  const handleEntityToggle = async (entityId: string) => {
    const entity = entities[entityId];
    if (!entity) return;

    try {
      if (entityId.startsWith('light') || entityId.startsWith('switch')) {
        const domain = entityId.startsWith('light') ? 'light' : 'switch';
        const service = entity.state === 'on' ? 'turn_off' : 'turn_on';
        await callService(domain, service, entityId);
        toast({
          title: "Device Updated",
          description: `${entity.attributes.friendly_name || entityId} ${entity.state === 'on' ? 'turned off' : 'turned on'}`,
        });
      } else if (entityId.startsWith('fan')) {
        const service = entity.state === 'on' ? 'turn_off' : 'turn_on';
        await callService('fan', service, entityId);
        toast({
          title: "Fan Updated",
          description: `${entity.attributes.friendly_name || entityId} ${entity.state === 'on' ? 'turned off' : 'turned on'}`,
        });
      } else if (entityId.startsWith('cover')) {
        const service = entity.state === 'open' ? 'close_cover' : 'open_cover';
        await callService('cover', service, entityId);
        toast({
          title: "Cover Updated",
          description: `${entity.attributes.friendly_name || entityId} ${entity.state === 'open' ? 'closed' : 'opened'}`,
        });
      } else if (entityId.startsWith('media_player')) {
        const service = entity.state === 'playing' ? 'media_pause' : 'media_play';
        await callService('media_player', service, entityId);
        toast({
          title: "Media Player Updated",
          description: `${entity.attributes.friendly_name || entityId} ${entity.state === 'playing' ? 'paused' : 'playing'}`,
        });
      } else if (entityId.startsWith('climate')) {
        // For climate, increase temperature by 1°C
        const currentTemp = entity.attributes.temperature || 20;
        await callService('climate', 'set_temperature', entityId, { temperature: currentTemp + 1 });
        toast({
          title: "Climate Updated",
          description: `${entity.attributes.friendly_name || entityId} temperature increased`,
        });
      } else if (entityId.includes('lock')) {
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

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Home Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Link to="/settings">
            <Button
              variant={isConnected ? "default" : "destructive"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            </Button>
          </Link>
          
          <Link to="/connection-test">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
            >
              <Bug className="h-3 w-3" />
            </Button>
          </Link>
          
          <Link to="/settings#entities">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </Link>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshEntities}
            disabled={isLoading || !isConfigured}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>


      {/* Main Grid Layout - Dynamic Columns */}
      <div 
        className="grid gap-6" 
        style={{ 
          gridTemplateColumns: `repeat(${columns || 3}, 1fr)`,
          display: 'grid'
        }}
      >
        {Array.from({ length: columns || 3 }, (_, columnIndex) => {
          const columnNumber = columnIndex + 1;
          const columnGroups = deviceGroups.filter(group => (group as any).column === columnNumber);
          
          return (
            <div key={columnNumber} className="space-y-6">
              {/* Render groups for this column */}
              {columnGroups.map((group) => (
                <DeviceGroup
                  key={group.id}
                  group={group}
                  onEntityToggle={handleEntityToggle}
                />
              ))}
              
              {/* Show placeholder for empty columns */}
              {columnGroups.length === 0 && (
                <Card className="glass-effect opacity-50">
                  <CardContent className="p-6 text-center">
                    <Home className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Column {columnNumber}</p>
                    <p className="text-xs text-muted-foreground">Add groups or widgets in Settings</p>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          Last updated: {new Date().toLocaleString()} | 
          Entities: {Object.keys(entities).length}
        </p>
      </div>
    </div>
  );
};

export default Index;
