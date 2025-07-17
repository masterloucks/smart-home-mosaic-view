import { useState, useRef, useEffect } from 'react';
import { useEntityConfig } from '@/hooks/useEntityConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Filter, Check } from 'lucide-react';

interface EntityFilterConfigProps {
  availableEntities?: string[]; // Optional list of all available entity IDs
}

export const EntityFilterConfig = ({ availableEntities = [] }: EntityFilterConfigProps) => {
  const { 
    entityFilter, 
    isFilterEnabled, 
    setEntityFilter, 
    setIsFilterEnabled,
    removeEntity 
  } = useEntityConfig();
  
  const [newEntity, setNewEntity] = useState('');
  const [bulkEntities, setBulkEntities] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionListRef = useRef<HTMLDivElement>(null);

  // Get filtered suggestions from available entities
  const filteredSuggestions = availableEntities.filter(entityId => 
    !entityFilter.includes(entityId) && 
    entityId.toLowerCase().includes(newEntity.toLowerCase())
  ).slice(0, 10); // Limit to 10 suggestions

  const handleAddEntity = (entityId?: string) => {
    const entityToAdd = entityId || newEntity.trim();
    if (entityToAdd && !entityFilter.includes(entityToAdd)) {
      setEntityFilter([...entityFilter, entityToAdd]);
      setNewEntity('');
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEntity(value);
    setShowSuggestions(value.length > 0);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleAddEntity();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleAddEntity(filteredSuggestions[highlightedIndex]);
        } else {
          handleAddEntity();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          suggestionListRef.current && !suggestionListRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <div className="space-y-2 relative">
              <Label htmlFor="new-entity">Add Entity</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    id="new-entity"
                    value={newEntity}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => newEntity.length > 0 && setShowSuggestions(true)}
                    placeholder="e.g., sensor.living_room_temperature"
                    autoComplete="off"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div 
                      ref={suggestionListRef}
                      className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                      {filteredSuggestions.map((entityId, index) => {
                        
                        return (
                          <div
                            key={entityId}
                            className={`px-3 py-2 cursor-pointer border-b border-border/50 last:border-b-0 ${
                              index === highlightedIndex 
                                ? 'bg-muted' 
                                : 'hover:bg-muted/50'
                            }`}
                            onClick={() => handleAddEntity(entityId)}
                          >
                            <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{entityId}</div>
                              <div className="text-xs text-muted-foreground">Entity ID</div>
                            </div>
                              {index === highlightedIndex && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Button onClick={() => handleAddEntity()} size="sm">
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