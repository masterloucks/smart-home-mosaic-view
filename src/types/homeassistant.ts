export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

export interface HAState {
  entities: Record<string, HAEntity>;
}


export interface SensorEntity extends HAEntity {
  attributes: {
    friendly_name: string;
    unit_of_measurement?: string;
    device_class?: string;
    state_class?: string;
  };
}

export interface BinarySensorEntity extends HAEntity {
  attributes: {
    friendly_name: string;
    device_class?: string;
  };
}

export interface LockEntity extends HAEntity {
  attributes: {
    friendly_name: string;
    supported_features?: number;
  };
}

export interface DeviceTrackerEntity extends HAEntity {
  attributes: {
    friendly_name: string;
    source_type?: string;
    gps_accuracy?: number;
    latitude?: number;
    longitude?: number;
  };
}


export type DeviceGroup = {
  id: string;
  name: string;
  entities: HAEntity[];
  type: 'sensor' | 'binary_sensor' | 'lock' | 'device_tracker' | 'camera' | 'light' | 'climate' | 'fan' | 'cover' | 'media_player' | 'person' | 'weather' | 'automation' | 'script' | 'scene' | 'input' | 'timer' | 'button';
  column?: number;
};