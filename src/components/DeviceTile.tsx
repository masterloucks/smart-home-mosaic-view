import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    
    if (entityId.includes('lock')) {
      return entity.state === 'locked' ? <Lock className="h-6 w-6" /> : <LockOpen className="h-6 w-6" />;
    }
    if (entityId.includes('door') && entityId.includes('contact')) {
      return entity.state === 'on' ? <DoorOpen className="h-6 w-6" /> : <DoorClosed className="h-6 w-6" />;
    }
    if (entityId.includes('temperature')) {
      return <Thermometer className="h-6 w-6" />;
    }
    if (entityId.includes('device_tracker')) {
      return <Smartphone className="h-6 w-6" />;
    }
    
    return <Home className="h-6 w-6" />;
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
        'transition-all duration-200 touch-target glass-effect',
        getCardBackground(),
        isInteractive && 'cursor-pointer hover:scale-105',
        className
      )}
      onClick={isInteractive ? onToggle : undefined}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('transition-colors', getStatusColor())}>
            {getIcon()}
          </div>
          {entity.state === 'unavailable' && (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-sm leading-tight">
            {friendlyName}
          </h3>
          
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={cn('text-xs', getStatusColor())}
            >
              {getDisplayValue()}
            </Badge>
            
            {isInteractive && (
              <Button 
                size="sm" 
                variant="ghost"
                className="h-8 px-2 text-xs hover:bg-primary/10"
              >
                Toggle
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-3 text-xs text-muted-foreground">
          Last updated: {new Date(entity.last_updated).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};