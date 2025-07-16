import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeviceTile } from '@/components/DeviceTile';
import { DeviceGroup as DeviceGroupType } from '@/types/homeassistant';
import { 
  Lock, 
  Thermometer, 
  Smartphone, 
  DoorOpen,
  Camera,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceGroupProps {
  group: DeviceGroupType;
  onEntityToggle: (entityId: string) => void;
  className?: string;
}

export const DeviceGroup = ({ group, onEntityToggle, className }: DeviceGroupProps) => {
  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'lock':
        return <Lock className="h-5 w-5" />;
      case 'sensor':
        return <Thermometer className="h-5 w-5" />;
      case 'binary_sensor':
        return <DoorOpen className="h-5 w-5" />;
      case 'device_tracker':
        return <Smartphone className="h-5 w-5" />;
      case 'camera':
        return <Camera className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getActiveCount = () => {
    return group.entities.filter(entity => {
      switch (group.type) {
        case 'lock':
          return entity.state === 'unlocked';
        case 'binary_sensor':
          return entity.state === 'on';
        case 'device_tracker':
          return entity.state === 'home';
        default:
          return entity.state !== 'unavailable';
      }
    }).length;
  };

  const activeCount = getActiveCount();
  const totalCount = group.entities.length;

  return (
    <Card className={cn('glass-effect', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getGroupIcon(group.type)}
            {group.name}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {activeCount}/{totalCount} active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="grid gap-3">
        {group.entities.map((entity) => (
          <DeviceTile
            key={entity.entity_id}
            entity={entity}
            onToggle={() => onEntityToggle(entity.entity_id)}
          />
        ))}
      </CardContent>
    </Card>
  );
};