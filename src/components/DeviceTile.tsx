import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  LockOpen, 
  DoorOpen, 
  DoorClosed, 
  Thermometer, 
  Smartphone,
  Home,
  AlertTriangle
} from 'lucide-react';
import { HAEntity } from '@/types/homeassistant';
import { cn } from '@/lib/utils';

interface DeviceTileProps {
  entity: HAEntity;
  onToggle?: () => void;
  className?: string;
}

export const DeviceTile = ({ entity, onToggle, className }: DeviceTileProps) => {
  const getIcon = () => {
    const entityId = entity.entity_id.toLowerCase();
    const iconClass = "h-6 w-6 md:h-8 md:w-8";
    
    if (entityId.includes('lock')) {
      return entity.state === 'locked' ? <Lock className={iconClass} /> : <LockOpen className={iconClass} />;
    }
    if (entityId.includes('door') && entityId.includes('contact')) {
      return entity.state === 'on' ? <DoorOpen className={iconClass} /> : <DoorClosed className={iconClass} />;
    }
    if (entityId.includes('temperature')) {
      return <Thermometer className={iconClass} />;
    }
    if (entityId.includes('device_tracker')) {
      return <Smartphone className={iconClass} />;
    }
    
    return <Home className={iconClass} />;
  };

  const getStatusColor = () => {
    const entityId = entity.entity_id.toLowerCase();
    
    if (entityId.includes('lock')) {
      return entity.state === 'locked' ? 'text-success' : 'text-warning';
    }
    if (entityId.includes('door') && entityId.includes('contact')) {
      return entity.state === 'on' ? 'text-warning' : 'text-success';
    }
    if (entityId.includes('temperature')) {
      const temp = parseFloat(entity.state);
      if (temp > 85) return 'text-destructive';
      if (temp < 32) return 'text-warning';
      return 'text-success';
    }
    if (entityId.includes('device_tracker')) {
      return entity.state === 'home' ? 'text-success' : 'text-muted-foreground';
    }
    
    return 'text-foreground';
  };

  const getDisplayValue = () => {
    const entityId = entity.entity_id.toLowerCase();
    
    if (entityId.includes('temperature')) {
      const unit = entity.attributes.unit_of_measurement || '';
      return `${entity.state}${unit}`;
    }
    if (entityId.includes('device_tracker')) {
      return entity.state === 'home' ? 'Home' : 'Away';
    }
    if (entityId.includes('lock')) {
      return entity.state === 'locked' ? 'Locked' : 'Unlocked';
    }
    if (entityId.includes('door') && entityId.includes('contact')) {
      return entity.state === 'on' ? 'Open' : 'Closed';
    }
    
    return entity.state;
  };

  const getCardBackground = () => {
    const entityId = entity.entity_id.toLowerCase();
    
    if (entityId.includes('lock') && entity.state === 'unlocked') {
      return 'bg-warning/10 border-warning/30';
    }
    if (entityId.includes('door') && entity.state === 'on') {
      return 'bg-warning/10 border-warning/30';
    }
    if (entityId.includes('temperature')) {
      const temp = parseFloat(entity.state);
      if (temp > 85) return 'bg-destructive/10 border-destructive/30';
      if (temp < 32) return 'bg-warning/10 border-warning/30';
    }
    
    return 'bg-card border-border hover:bg-muted/50';
  };

  const isInteractive = entity.entity_id.includes('lock');
  const friendlyName = entity.attributes.friendly_name || entity.entity_id.replace(/_/g, ' ');

  return (
    <Card 
      className={cn(
        'transition-all duration-200 cursor-pointer hover:scale-105 relative',
        getCardBackground(),
        'h-20 w-20 md:h-24 md:w-24',
        className
      )}
      onClick={isInteractive ? onToggle : undefined}
    >
      <CardContent className="p-2 h-full flex flex-col items-center justify-center relative">
        {entity.state === 'unavailable' && (
          <AlertTriangle className="absolute top-1 right-1 h-3 w-3 text-destructive" />
        )}
        
        <div className={cn('transition-colors mb-1', getStatusColor())}>
          <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center">
            {getIcon()}
          </div>
        </div>
        
        <div className="text-center">
          <div className={cn('text-xs font-medium truncate max-w-full', getStatusColor())}>
            {getDisplayValue()}
          </div>
          <div className="text-[10px] text-muted-foreground truncate max-w-full mt-0.5">
            {friendlyName.split(' ').slice(-1)[0]}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};