import { useState } from 'react';
import { useEntityConfig } from '@/hooks/useEntityConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Filter } from 'lucide-react';

export const EntityFilterConfig = () => {
  const { 
    entityFilter, 
    isFilterEnabled, 
    setEntityFilter, 
    setIsFilterEnabled,
    removeEntity 
  } = useEntityConfig();
  
  const [newEntity, setNewEntity] = useState('');
  const [bulkEntities, setBulkEntities] = useState('');

  const handleAddEntity = () => {
    if (newEntity.trim() && !entityFilter.includes(newEntity.trim())) {
      setEntityFilter([...entityFilter, newEntity.trim()]);
      setNewEntity('');
    }
  };

  const handleBulkAdd = () => {
    const entities = bulkEntities
      .split('\n')
      .map(e => e.trim())
      .filter(e => e && !entityFilter.includes(e));
    
    if (entities.length > 0) {
      setEntityFilter([...entityFilter, ...entities]);
      setBulkEntities('');
    }
  };

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Entity Filter Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Filter */}
        <div className="flex items-center justify-between">
          <Label htmlFor="filter-enabled">Enable Entity Filtering</Label>
          <Switch
            id="filter-enabled"
            checked={isFilterEnabled}
            onCheckedChange={setIsFilterEnabled}
          />
        </div>

        {isFilterEnabled && (
          <>
            {/* Current Entities */}
            <div>
              <Label className="text-sm font-medium">Filtered Entities ({entityFilter.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted rounded-md max-h-40 overflow-y-auto">
                {entityFilter.map((entityId) => (
                  <Badge key={entityId} variant="secondary" className="flex items-center gap-1">
                    {entityId}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeEntity(entityId)}
                    />
                  </Badge>
                ))}
                {entityFilter.length === 0 && (
                  <p className="text-sm text-muted-foreground">No entities configured</p>
                )}
              </div>
            </div>

            {/* Add Single Entity */}
            <div className="space-y-2">
              <Label htmlFor="new-entity">Add Entity</Label>
              <div className="flex gap-2">
                <Input
                  id="new-entity"
                  value={newEntity}
                  onChange={(e) => setNewEntity(e.target.value)}
                  placeholder="e.g., sensor.living_room_temperature"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEntity()}
                />
                <Button onClick={handleAddEntity} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bulk Add */}
            <div className="space-y-2">
              <Label htmlFor="bulk-entities">Bulk Add (one per line)</Label>
              <Textarea
                id="bulk-entities"
                value={bulkEntities}
                onChange={(e) => setBulkEntities(e.target.value)}
                placeholder="Enter multiple entity IDs, one per line:&#10;sensor.temperature&#10;binary_sensor.door&#10;camera.front_door"
                rows={4}
              />
              <Button onClick={handleBulkAdd} size="sm" className="w-full">
                Add All Entities
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>
                Only entities in this list will be displayed. Leave empty or disable filtering to show all entities.
                Changes take effect after reconnecting to Home Assistant.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};