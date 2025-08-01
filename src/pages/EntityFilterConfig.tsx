import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntityConfig } from '@/hooks/useEntityConfig';
import { useHomeAssistant } from '@/hooks/useHomeAssistant';
import { useSecureConfig } from '@/hooks/useSecureConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GroupCustomization } from '@/components/GroupCustomization';
import { LayoutCustomization } from '@/components/LayoutCustomization';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SecurityConfig } from '@/components/SecurityConfig';

const EntityFilterConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { config, isConfigured } = useSecureConfig();
  const { 
    entityFilter, 
    setEntityFilter, 
    addEntity, 
    removeEntity 
  } = useEntityConfig();

  // Get all entities without filter - only if configured
  const configWithoutFilter = (config && isConfigured) ? { ...config, entityFilter: undefined } : null;
  const { entities: allEntities, isLoading, error, isConnected } = useHomeAssistant(configWithoutFilter);

  // Debug logging for connection and entities
  console.log('EntityFilterConfig Connection Debug:', {
    config: !!config,
    isConfigured,
    configWithoutFilter: !!configWithoutFilter,
    baseUrl: config?.baseUrl,
    hasToken: !!config?.token,
    isConnected,
    isLoading,
    error,
    allEntitiesCount: Object.keys(allEntities || {}).length,
    allEntitiesFirst5: Object.keys(allEntities || {}).slice(0, 5)
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>([]);

  // Get entity type from entity_id
  const getEntityType = (entityId: string) => {
    const domain = entityId.split('.')[0];
    switch (domain) {
      case 'automation':
        return 'Automation';
      case 'binary_sensor':
        return 'Binary Sensor';
      case 'button':
        return 'Button';
      case 'camera':
        return 'Camera';
      case 'climate':
        return 'Climate';
      case 'conversation':
        return 'Conversation';
      case 'cover':
        return 'Cover';
      case 'device_tracker':
        return 'Device Tracker';
      case 'event':
        return 'Event';
      case 'fan':
        return 'Fan';
      case 'group':
        return 'Group';
      case 'humidifier':
        return 'Humidifier';
      case 'input_boolean':
        return 'Input Boolean';
      case 'input_datetime':
        return 'Input Datetime';
      case 'input_number':
        return 'Input Number';
      case 'input_select':
        return 'Input Select';
      case 'input_text':
        return 'Input Text';
      case 'lawn_mower':
        return 'Lawn Mower';
      case 'light':
        return 'Light';
      case 'lock':
        return 'Lock';
      case 'media_player':
        return 'Media Player';
      case 'number':
        return 'Number';
      case 'person':
        return 'Person';
      case 'remote':
        return 'Remote';
      case 'scene':
        return 'Scene';
      case 'script':
        return 'Script';
      case 'select':
        return 'Select';
      case 'sensor':
        return 'Sensor';
      case 'siren':
        return 'Siren';
      case 'stt':
        return 'Stt';
      case 'sun':
        return 'Sun';
      case 'switch':
        return 'Switch';
      case 'timer':
        return 'Timer';
      case 'todo':
        return 'Todo';
      case 'tts':
        return 'Tts';
      case 'update':
        return 'Update';
      case 'weather':
        return 'Weather';
      case 'zone':
        return 'Zone';
      default:
        return domain.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Get friendly name or fallback to entity_id
  const getFriendlyName = (entityId: string) => {
    const entity = allEntities[entityId];
    return entity?.attributes?.friendly_name || entityId;
  };

  // Get unique entity types from all entities
  const availableEntityTypes = useMemo(() => {
    if (!allEntities) return [];
    const types = new Set<string>();
    Object.keys(allEntities).forEach(entityId => {
      types.add(getEntityType(entityId));
    });
    return Array.from(types).sort();
  }, [allEntities]);

  // Filter and search entities
  const filteredEntities = useMemo(() => {
    const availableEntityIds = Object.keys(allEntities || {});
    
    if (!allEntities || Object.keys(allEntities).length === 0) {
      return [];
    }
    
    const results = availableEntityIds
      .filter(entityId => {
        const friendlyName = getFriendlyName(entityId);
        const entityType = getEntityType(entityId);
        
        // Filter by search term (if there is one)
        const matchesSearch = !searchTerm || (
          entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          friendlyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entityType.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Filter by selected entity types
        const matchesType = selectedEntityTypes.length === 0 || 
          selectedEntityTypes.includes(entityType);
        
        return matchesSearch && matchesType;
      })
      .filter(entityId => !entityFilter.includes(entityId))
      .slice(0, 100); // Limit results for performance
      
    return results;
  }, [allEntities, searchTerm, entityFilter, selectedEntityTypes]);

  const handleSelectEntity = (entityId: string, checked: boolean) => {
    if (checked) {
      setSelectedEntities(prev => [...prev, entityId]);
    } else {
      setSelectedEntities(prev => prev.filter(id => id !== entityId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntities(filteredEntities);
    } else {
      setSelectedEntities([]);
    }
  };

  const handleEntityTypeToggle = (entityType: string, checked: boolean) => {
    if (checked) {
      setSelectedEntityTypes(prev => [...prev, entityType]);
    } else {
      setSelectedEntityTypes(prev => prev.filter(type => type !== entityType));
    }
  };

  const handleAddSelected = () => {
    const newFilter = [...entityFilter, ...selectedEntities];
    setEntityFilter(newFilter);
    setSelectedEntities([]);
    
    toast({
      title: "Entities Added",
      description: `Added ${selectedEntities.length} entities to the filter`,
    });
  };

  const handleRemoveEntity = (entityId: string) => {
    removeEntity(entityId);
    toast({
      title: "Entity Removed",
      description: `Removed ${getFriendlyName(entityId)} from the filter`,
    });
  };

  const handleClearAll = () => {
    setEntityFilter([]);
    toast({
      title: "Filter Cleared",
      description: "All entities removed from the filter",
    });
  };

  // Clear selection when search changes
  useEffect(() => {
    setSelectedEntities([]);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure your Home Assistant connection and manage entities
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue={window.location.hash === '#entities' ? 'entities' : 'connection'} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-[600px]">
          <TabsTrigger value="connection">Home Assistant</TabsTrigger>
          <TabsTrigger value="entities">Entity Filter</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection">
          <SecurityConfig 
            onConfigSaved={() => {}} 
            isConnected={isConnected} 
          />
        </TabsContent>
        
        <TabsContent value="entities">
          {!isConfigured ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Home Assistant is not configured. Please configure your connection in the Home Assistant tab first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Search and Add Panel - 75% width */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Search & Add Entities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Entity Type Filters - Always visible */}
                    {availableEntityTypes.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Filter by type:</div>
                        <div className="flex flex-wrap gap-2">
                          {availableEntityTypes.map(entityType => (
                            <label
                              key={entityType}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedEntityTypes.includes(entityType)}
                                onCheckedChange={(checked) => handleEntityTypeToggle(entityType, checked as boolean)}
                              />
                              <span className="text-xs">{entityType}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search entities by name, ID, or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Bulk Actions */}
                    {filteredEntities.length > 0 && (
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedEntities.length === filteredEntities.length}
                            onCheckedChange={handleSelectAll}
                          />
                          <span className="text-xs">
                            {selectedEntities.length > 0 
                              ? `${selectedEntities.length} selected` 
                              : 'Select all'
                            }
                          </span>
                        </div>
                        
                        {selectedEntities.length > 0 && (
                          <Button 
                            size="sm"
                            onClick={handleAddSelected}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Plus className="h-3 w-3" />
                            Add Selected ({selectedEntities.length})
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Search Results */}
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {filteredEntities.map((entityId) => (
                        <div 
                          key={entityId}
                          className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedEntities.includes(entityId)}
                            onCheckedChange={(checked) => handleSelectEntity(entityId, checked as boolean)}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {getFriendlyName(entityId)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {entityId}
                            </div>
                          </div>
                          
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {getEntityType(entityId)}
                          </Badge>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              addEntity(entityId);
                              toast({
                                title: "Entity Added",
                                description: `Added ${getFriendlyName(entityId)} to the filter`,
                              });
                            }}
                            className="flex items-center gap-1 h-7 px-2 text-xs"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                        </div>
                      ))}
                      
                      {searchTerm && filteredEntities.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No entities found matching "{searchTerm}"</p>
                        </div>
                      )}
                      
                      {!searchTerm && filteredEntities.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No entities available to add</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Currently Added Entities Panel - 25% width */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        Added Entities
                      </CardTitle>
                      {entityFilter.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClearAll}
                          className="flex items-center gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Clear All
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {entityFilter.map((entityId) => (
                        <div 
                          key={entityId}
                          className="flex items-center gap-2 p-1.5 border rounded hover:bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {getFriendlyName(entityId)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {entityId}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveEntity(entityId)}
                            className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                      
                      {entityFilter.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No entities in filter yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="groups">
          <GroupCustomization 
            addedEntities={entityFilter}
            allEntities={allEntities || {}}
            getFriendlyName={getFriendlyName}
            getEntityType={getEntityType}
          />
        </TabsContent>
        
        <TabsContent value="layout">
          <LayoutCustomization />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EntityFilterConfig;