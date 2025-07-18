import { useState, useCallback, useEffect } from 'react';

export interface CustomGroup {
  id: string;
  name: string;
  icon: string;
  entityIds: string[];
  order: number;
  column: number;
}

interface GroupConfig {
  groups: CustomGroup[];
  lastUpdated: string;
}

const STORAGE_KEY = 'homeassistant_group_config';

const DEFAULT_GROUPS: CustomGroup[] = [
  {
    id: 'lights_switches',
    name: 'Lights & Switches',
    icon: 'lightbulb',
    entityIds: [],
    order: 1,
    column: 1
  },
  {
    id: 'climate',
    name: 'Climate',
    icon: 'thermometer',
    entityIds: [],
    order: 2,
    column: 1
  },
  {
    id: 'fans',
    name: 'Fans',
    icon: 'fan',
    entityIds: [],
    order: 3,
    column: 1
  },
  {
    id: 'covers',
    name: 'Covers',
    icon: 'wind',
    entityIds: [],
    order: 4,
    column: 1
  },
  {
    id: 'media_players',
    name: 'Media Players',
    icon: 'volume-2',
    entityIds: [],
    order: 5,
    column: 1
  },
  {
    id: 'locks',
    name: 'Locks',
    icon: 'lock',
    entityIds: [],
    order: 6,
    column: 1
  },
  {
    id: 'sensors',
    name: 'Sensors',
    icon: 'activity',
    entityIds: [],
    order: 7,
    column: 1
  },
  {
    id: 'people',
    name: 'People',
    icon: 'user',
    entityIds: [],
    order: 8,
    column: 1
  },
  {
    id: 'weather',
    name: 'Weather',
    icon: 'cloud',
    entityIds: [],
    order: 9,
    column: 1
  }
];

export const useGroupConfig = () => {
  const [groups, setGroups] = useState<CustomGroup[]>(DEFAULT_GROUPS);

  // Load groups from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config: GroupConfig = JSON.parse(stored);
        setGroups(config.groups);
      }
    } catch (error) {
      console.error('Failed to load group config:', error);
    }
  }, []);

  // Save groups to localStorage
  const saveGroups = useCallback((newGroups: CustomGroup[]) => {
    try {
      const config: GroupConfig = {
        groups: newGroups,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setGroups(newGroups);
    } catch (error) {
      console.error('Failed to save group config:', error);
    }
  }, []);

  // Create a new group
  const createGroup = useCallback((name: string, icon: string, column: number = 1) => {
    const newGroup: CustomGroup = {
      id: `custom_${Date.now()}`,
      name,
      icon,
      entityIds: [],
      order: groups.length + 1,
      column
    };
    const newGroups = [...groups, newGroup];
    saveGroups(newGroups);
    return newGroup.id;
  }, [groups, saveGroups]);

  // Update group details
  const updateGroup = useCallback((groupId: string, updates: Partial<Omit<CustomGroup, 'id'>>) => {
    const newGroups = groups.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    );
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Delete a group
  const deleteGroup = useCallback((groupId: string) => {
    const newGroups = groups.filter(group => group.id !== groupId);
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Add entity to group
  const addEntityToGroup = useCallback((entityId: string, groupId: string) => {
    const newGroups = groups.map(group => {
      // Remove entity from all other groups first
      const filteredEntityIds = group.entityIds.filter(id => id !== entityId);
      
      // Add to target group
      if (group.id === groupId) {
        return { ...group, entityIds: [...filteredEntityIds, entityId] };
      }
      
      return { ...group, entityIds: filteredEntityIds };
    });
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Remove entity from group
  const removeEntityFromGroup = useCallback((entityId: string, groupId: string) => {
    const newGroups = groups.map(group => 
      group.id === groupId 
        ? { ...group, entityIds: group.entityIds.filter(id => id !== entityId) }
        : group
    );
    saveGroups(newGroups);
  }, [groups, saveGroups]);

  // Reorder groups
  const reorderGroups = useCallback((newOrder: string[]) => {
    const reorderedGroups = newOrder.map((groupId, index) => {
      const group = groups.find(g => g.id === groupId);
      return group ? { ...group, order: index + 1 } : null;
    }).filter(Boolean) as CustomGroup[];
    
    saveGroups(reorderedGroups);
  }, [groups, saveGroups]);

  // Get entities not in any group
  const getUngroupedEntities = useCallback((allEntityIds: string[]) => {
    const groupedEntityIds = new Set(
      groups.flatMap(group => group.entityIds)
    );
    return allEntityIds.filter(entityId => !groupedEntityIds.has(entityId));
  }, [groups]);

  // Get group by entity ID
  const getGroupByEntity = useCallback((entityId: string) => {
    return groups.find(group => group.entityIds.includes(entityId));
  }, [groups]);

  // Get groups for specific column
  const getGroupsForColumn = useCallback((column: number) => {
    return groups
      .filter(group => group.column === column && group.entityIds.length > 0)
      .sort((a, b) => a.order - b.order);
  }, [groups]);

  return {
    groups: groups.sort((a, b) => a.order - b.order),
    createGroup,
    updateGroup,
    deleteGroup,
    addEntityToGroup,
    removeEntityFromGroup,
    reorderGroups,
    getUngroupedEntities,
    getGroupByEntity,
    getGroupsForColumn
  };
};