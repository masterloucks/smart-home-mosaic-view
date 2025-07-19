import { useState, useEffect } from 'react';

// Default entity configuration - customize this list with your specific entity IDs
const DEFAULT_ENTITY_FILTER = [
  // Locks
  'lock.front_door_lock',
  'lock.back_door_lock',
  
  // Door/Window Sensors  
  'binary_sensor.front_door_contact_sensor',
  'binary_sensor.back_door_contact_sensor',
  'binary_sensor.kitchen_window_sensor',
  
  // Motion Sensors
  'binary_sensor.living_room_motion',
  'binary_sensor.kitchen_motion',
  
  // Temperature Sensors
  'sensor.living_room_temperature',
  'sensor.bedroom_temperature',
  'sensor.outdoor_temperature',
  
  // Cameras
  'camera.front_door_camera',
  'camera.backyard_camera',
  'camera.driveway_camera',
  
  // Device Trackers
  'device_tracker.phone_john',
  'device_tracker.phone_jane',
  
  // Add your specific entity IDs here
];

export const useEntityConfig = () => {
  const [entityFilter, setEntityFilter] = useState<string[]>([]);  // Start with empty array

  // Load configuration from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('entity_filter_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setEntityFilter(config.entityFilter || []);
      } catch (error) {
        console.error('Failed to load entity filter config:', error);
      }
    }
  }, []);

  // Save configuration to localStorage
  const saveConfig = (newFilter: string[]) => {
    const config = {
      entityFilter: newFilter
    };
    localStorage.setItem('entity_filter_config', JSON.stringify(config));
    setEntityFilter(newFilter);
  };

  const getEffectiveFilter = () => {
    // Return filter if has entities, otherwise return empty array to show nothing
    return entityFilter.length > 0 ? entityFilter : [];
  };

  return {
    entityFilter,
    setEntityFilter: (filter: string[]) => saveConfig(filter),
    getEffectiveFilter,
    addEntity: (entityId: string) => {
      if (!entityFilter.includes(entityId)) {
        saveConfig([...entityFilter, entityId]);
      }
    },
    removeEntity: (entityId: string) => {
      saveConfig(entityFilter.filter(id => id !== entityId));
    }
  };
};