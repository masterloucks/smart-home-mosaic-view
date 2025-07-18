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
import { ArrowLeft, Search, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EntityFilterConfig = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { config } = useSecureConfig();
  const { 
    entityFilter, 
    isFilterEnabled, 
    setEntityFilter, 
    setIsFilterEnabled, 
    addEntity, 
    removeEntity 
  } = useEntityConfig();

  // Get all entities without filter
  const configWithoutFilter = config ? { ...config, entityFilter: undefined } : null;
  const { entities: allEntities } = useHomeAssistant(configWithoutFilter);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  // Get entity type from entity_id
  const getEntityType = (entityId: string) => {
    const domain = entityId.split('.')[0];
    switch (domain) {
      case 'light':
        return 'Light';
      case 'switch':
        return 'Switch';
      case 'binary_sensor':
        return 'Binary Sensor';
      case 'sensor':
        return 'Sensor';
      case 'climate':
        return 'Climate';
      case 'fan':
        return 'Fan';
      case 'cover':
        return 'Cover';
      case 'media_player':
        return 'Media Player';
      case 'lock':
        return 'Lock';
      case 'camera':
        return 'Camera';
      case 'device_tracker':
        return 'Device Tracker';
      case 'person':
        return 'Person';
      default:
        return domain.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Get friendly name or fallback to entity_id
  const getFriendlyName = (entityId: string) => {
    const entity = allEntities[entityId];
    return entity?.attributes?.friendly_name || entityId;
  };

  // Filter and search entities
  const filteredEntities = useMemo(() => {
    const availableEntityIds = Object.keys(allEntities);
    
    // Debug logging
    console.log('EntityFilterConfig Debug:', {
      searchTerm,
      allEntitiesCount: availableEntityIds.length,
      allEntitiesKeys: availableEntityIds.slice(0, 10), // First 10 for debugging
      entityFilterCount: entityFilter.length
    });
    
    if (!searchTerm) return [];
    
    return availableEntityIds
      .filter(entityId => {
        const friendlyName = getFriendlyName(entityId);
        const entityType = getEntityType(entityId);
        
        return (
          entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          friendlyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entityType.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
      .filter(entityId => !entityFilter.includes(entityId))
      .slice(0, 100); // Limit results for performance
  }, [allEntities, searchTerm, entityFilter]);

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
            <h1 className="text-2xl lg:text-3xl font-bold">Entity Filter Configuration</h1>
            <p className="text-sm text-muted-foreground">
              Manage which entities appear on your dashboard
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox 
              checked={isFilterEnabled}
              onCheckedChange={setIsFilterEnabled}
            />
            Enable Filtering
          </label>
          
          <Badge variant={isFilterEnabled ? "default" : "secondary"}>
            {isFilterEnabled ? `${entityFilter.length} entities filtered` : 'Filter disabled'}
          </Badge>
        </div>
      </div>

      {/* Main Layout */}
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
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedEntities.length === filteredEntities.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm">
                      {selectedEntities.length > 0 
                        ? `${selectedEntities.length} selected` 
                        : 'Select all'
                      }
                    </span>
                  </div>
                  
                  {selectedEntities.length > 0 && (
                    <Button 
                      onClick={handleAddSelected}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Selected ({selectedEntities.length})
                    </Button>
                  )}
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEntities.map((entityId) => (
                  <div 
                    key={entityId}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedEntities.includes(entityId)}
                      onCheckedChange={(checked) => handleSelectEntity(entityId, checked as boolean)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getFriendlyName(entityId)}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {entityId}
                      </div>
                    </div>
                    
                    <Badge variant="outline">
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
                      className="flex items-center gap-1"
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
                
                {!searchTerm && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Start typing to search for entities</p>
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {entityFilter.map((entityId) => (
                  <div 
                    key={entityId}
                    className="flex items-center gap-2 p-2 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
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
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {entityFilter.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No entities added</p>
                    <p className="text-xs mt-1">Search and add entities to filter your dashboard</p>
                  </div>
                )}
              </div>
              
              {entityFilter.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground text-center">
                    {entityFilter.length} entities will be shown on the dashboard
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EntityFilterConfig;