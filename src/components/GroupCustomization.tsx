import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useGroupConfig, CustomGroup } from '@/hooks/useGroupConfig';
import { useEntityConfig } from '@/hooks/useEntityConfig';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical, 
  Settings,
  Lightbulb,
  Thermometer,
  Fan,
  Wind,
  Volume2,
  Lock,
  Activity,
  User,
  Cloud,
  Camera,
  Smartphone,
  AlertTriangle
} from 'lucide-react';

interface GroupCustomizationProps {
  addedEntities: string[];
  allEntities: Record<string, any>;
  getFriendlyName: (entityId: string) => string;
  getEntityType: (entityId: string) => string;
}

const ICON_OPTIONS = [
  { value: 'lightbulb', label: 'Lightbulb', icon: Lightbulb },
  { value: 'thermometer', label: 'Thermometer', icon: Thermometer },
  { value: 'fan', label: 'Fan', icon: Fan },
  { value: 'wind', label: 'Wind', icon: Wind },
  { value: 'volume-2', label: 'Volume', icon: Volume2 },
  { value: 'lock', label: 'Lock', icon: Lock },
  { value: 'activity', label: 'Activity', icon: Activity },
  { value: 'user', label: 'User', icon: User },
  { value: 'cloud', label: 'Cloud', icon: Cloud },
  { value: 'camera', label: 'Camera', icon: Camera },
  { value: 'smartphone', label: 'Smartphone', icon: Smartphone }
];

export const GroupCustomization = ({ 
  addedEntities, 
  allEntities, 
  getFriendlyName, 
  getEntityType 
}: GroupCustomizationProps) => {
  const { 
    groups, 
    createGroup, 
    updateGroup, 
    deleteGroup, 
    addEntityToGroup, 
    removeEntityFromGroup,
    getUngroupedEntities,
    reorderGroups 
  } = useGroupConfig();

  const { removeEntity } = useEntityConfig();
  const { layoutConfig } = useLayoutConfig();
  
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('activity');
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('activity');

  const ungroupedEntities = getUngroupedEntities(addedEntities);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    createGroup(newGroupName.trim(), newGroupIcon);
    setNewGroupName('');
    setNewGroupIcon('activity');
    setIsCreating(false);
    
    toast({
      title: "Group Created",
      description: `Created group "${newGroupName}"`,
    });
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    deleteGroup(groupId);
    toast({
      title: "Group Deleted",
      description: `Deleted group "${groupName}"`,
    });
  };

  const handleAddToGroup = (entityId: string, groupId: string) => {
    addEntityToGroup(entityId, groupId);
    const groupName = groups.find(g => g.id === groupId)?.name || 'group';
    toast({
      title: "Entity Added",
      description: `Added ${getFriendlyName(entityId)} to ${groupName}`,
    });
  };

  const handleRemoveFromGroup = (entityId: string, groupId: string) => {
    removeEntityFromGroup(entityId, groupId);
    toast({
      title: "Entity Removed",
      description: `Removed ${getFriendlyName(entityId)} from group`,
    });
  };

  const handleRemoveEntity = (entityId: string) => {
    removeEntity(entityId);
    toast({
      title: "Entity Removed",
      description: `Removed ${getFriendlyName(entityId)} from added entities`,
    });
  };

  const handleRemoveAllUngrouped = () => {
    ungroupedEntities.forEach(entityId => removeEntity(entityId));
    toast({
      title: "All Entities Removed",
      description: `Removed ${ungroupedEntities.length} ungrouped entities from added entities`,
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Handle reordering within the same column
    if (source.droppableId === destination.droppableId) {
      const columnNumber = parseInt(source.droppableId.replace('column-', ''));
      const columnGroups = groups.filter(g => g.column === columnNumber);
      const [reorderedGroup] = columnGroups.splice(source.index, 1);
      columnGroups.splice(destination.index, 0, reorderedGroup);
      
      // Update order by group IDs
      const groupIds = columnGroups.map(g => g.id);
      reorderGroups(groupIds);
    } else {
      // Handle moving between columns
      const groupId = result.draggableId;
      const newColumn = parseInt(destination.droppableId.replace('column-', ''));
      
      updateGroup(groupId, { column: newColumn });
      
      toast({
        title: "Group Moved",
        description: `Moved group to column ${newColumn}`,
      });
    }
  };

  const handleEditGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setEditName(group.name);
      setEditIcon(group.icon);
      setEditingGroup(groupId);
    }
  };

  const handleSaveEdit = () => {
    if (!editingGroup || !editName.trim()) return;
    
    updateGroup(editingGroup, { name: editName.trim(), icon: editIcon });
    setEditingGroup(null);
    setEditName('');
    setEditIcon('activity');
    
    toast({
      title: "Group Updated",
      description: `Updated group "${editName}"`,
    });
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditName('');
    setEditIcon('activity');
  };


  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
    if (iconOption) {
      const IconComponent = iconOption.icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return <Activity className="h-4 w-4" />;
  };

  const getGroupsByColumn = (columnNumber: number) => {
    return groups.filter(group => group.column === columnNumber);
  };

  const renderGroupCard = (group: CustomGroup, index: number) => (
    <Draggable key={group.id} draggableId={group.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border rounded-lg p-3 mb-3 bg-card ${
            snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:bg-muted/50'
          } transition-all`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div {...provided.dragHandleProps}>
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              </div>
              {getIconComponent(group.icon)}
              <span className="font-medium">{group.name}</span>
              <Badge variant="outline" className="text-xs">
                {group.entityIds.filter(entityId => addedEntities.includes(entityId)).length} entities
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Edit Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditGroup(group.id)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              
              {/* Delete Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteGroup(group.id, group.name)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Edit Form */}
          {editingGroup === group.id && (
            <div className="mt-3 p-3 border rounded bg-muted/30 space-y-3">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter group name..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Icon</label>
                <Select value={editIcon} onValueChange={setEditIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={!editName.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Group Entities */}
          {group.entityIds.filter(entityId => addedEntities.includes(entityId)).length > 0 && (
            <div className="space-y-1 mt-2">
              {group.entityIds.filter(entityId => addedEntities.includes(entityId)).map((entityId) => (
                <div
                  key={entityId}
                  className="flex items-center justify-between text-sm p-1 rounded hover:bg-muted/30"
                >
                  <span className="truncate">
                    {getFriendlyName(entityId)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromGroup(entityId, group.id)}
                    className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {group.entityIds.filter(entityId => addedEntities.includes(entityId)).length === 0 && (
            <div className="text-xs text-muted-foreground italic mt-2">
              No entities assigned
            </div>
          )}
        </div>
      )}
    </Draggable>
  );

  return (
    <div className="space-y-6">
      {/* Ungrouped Entities */}
      {ungroupedEntities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Ungrouped Entities ({ungroupedEntities.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  These entities have been added but aren't assigned to any group. 
                  They won't appear on the dashboard until grouped.
                </p>
              </div>
              {ungroupedEntities.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveAllUngrouped}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {ungroupedEntities.map((entityId) => (
                <div 
                  key={entityId}
                  className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {getFriendlyName(entityId)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {entityId} • {getEntityType(entityId)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(groupId) => handleAddToGroup(entityId, groupId)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Add to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEntity(entityId)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Group Management
            </CardTitle>
            
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Group Name</label>
                    <Input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter group name..."
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Icon</label>
                    <Select value={newGroupIcon} onValueChange={setNewGroupIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                      Create Group
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div 
              className="grid gap-6"
              style={{ 
                gridTemplateColumns: `repeat(${layoutConfig?.columns || 3}, 1fr)` 
              }}
            >
              {Array.from({ length: layoutConfig?.columns || 3 }, (_, columnIndex) => {
                const columnNumber = columnIndex + 1;
                const columnGroups = getGroupsByColumn(columnNumber);
                
                return (
                  <div key={columnNumber} className="space-y-2">
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Column {columnNumber}
                      </h3>
                    </div>
                    
                    <Droppable droppableId={`column-${columnNumber}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[200px] p-3 border-2 border-dashed rounded-lg transition-colors ${
                            snapshot.isDraggingOver 
                              ? 'border-primary bg-primary/10' 
                              : 'border-muted-foreground/30 bg-muted/20'
                          }`}
                        >
                          {columnGroups.map((group, index) => 
                            renderGroupCard(group, index)
                          )}
                          {provided.placeholder}
                          
                          {columnGroups.length === 0 && !snapshot.isDraggingOver && (
                            <div className="text-center text-muted-foreground text-sm py-8">
                              Drag groups here
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </CardContent>
      </Card>
    </div>
  );
};