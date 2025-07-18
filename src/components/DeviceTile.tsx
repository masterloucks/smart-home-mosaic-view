import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  LockOpen, 
  DoorOpen, 
  DoorClosed, 
  PersonStanding,
  Activity,
  Thermometer, 
  Smartphone,
  Home,
  AlertTriangle,
  Lightbulb,
  LightbulbOff,
  Fan,
  Volume2,
  Wind,
  User
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
    
    // Debug logging for person entities
    if (entityId.includes('person')) {
      console.log('Person entity debug:', {
        entityId,
        originalEntityId: entity.entity_id,
        startsWithPerson: entityId.startsWith('person'),
        entityState: entity.state
      });
    }
    
    if (entityId.startsWith('light') || entityId.startsWith('switch')) {
      return entity.state === 'on' ? <Lightbulb className={iconClass} /> : <LightbulbOff className={iconClass} />;
    }
    if (entityId.startsWith('climate')) {
      return <Thermometer className={iconClass} />;
    }
    if (entityId.startsWith('fan')) {
      return <Fan className={iconClass} />;
    }
    if (entityId.startsWith('cover')) {
      return <Wind className={iconClass} />;
    }
    if (entityId.startsWith('media_player')) {
      return <Volume2 className={iconClass} />;
    }
    if (entityId.includes('lock')) {
      return entity.state === 'locked' ? <Lock className={iconClass} /> : <LockOpen className={iconClass} />;
    }
    if (entityId.includes('door') || entityId.includes('contact')) {
      return entity.state === 'on' ? <DoorOpen className={iconClass} /> : <DoorClosed className={iconClass} />;
    }
    if (entityId.includes('motion')) {
      return entity.state === 'on' ? <PersonStanding className={iconClass} /> : <PersonStanding className={cn(iconClass, "opacity-50")} />;
    }
    if (entityId.includes('temperature')) {
      return <Thermometer className={iconClass} />;
    }
    if (entityId.startsWith('device_tracker')) {
      // Check if this is a person-like device tracker based on friendly name
      const friendlyName = entity.attributes.friendly_name || '';
      const personNames = ['admin', 'jason', 'mandy', 'zara', 'dashboard'];
      if (personNames.some(name => friendlyName.toLowerCase().includes(name))) {
        return entity.state === 'home' ? <User className={iconClass} /> : <User className={cn(iconClass, "opacity-50")} />;
      }
      return entity.state === 'home' ? <Home className={iconClass} /> : <Smartphone className={iconClass} />;
    }
    if (entityId.startsWith('person')) {
      return entity.state === 'home' ? <User className={iconClass} /> : <User className={cn(iconClass, "opacity-50")} />;
    }

    return <Activity className={iconClass} />;
  };

  const getStatusColor = () => {
    const entityId = entity.entity_id.toLowerCase();
    
    if (entityId.startsWith('light') || entityId.startsWith('switch')) {
      return entity.state === 'on' ? 'text-warning' : 'text-muted-foreground';
    }
    if (entityId.startsWith('climate')) {
      return 'text-info';
    }
    if (entityId.startsWith('fan')) {
      return entity.state === 'on' ? 'text-info' : 'text-muted-foreground';
    }
    if (entityId.startsWith('cover')) {
      return entity.state === 'open' ? 'text-info' : 'text-muted-foreground';
    }
    if (entityId.startsWith('media_player')) {
      return entity.state === 'playing' ? 'text-success' : 'text-muted-foreground';
    }
    if (entityId.includes('lock')) {
      return entity.state === 'locked' ? 'text-success' : 'text-warning';
    }
    if (entityId.includes('door') || entityId.includes('contact')) {
      return entity.state === 'on' ? 'text-warning' : 'text-success';
    }
    if (entityId.includes('motion')) {
      return entity.state === 'on' ? 'text-warning' : 'text-muted-foreground';
    }
    if (entityId.includes('temperature')) {
      const temp = parseFloat(entity.state);
      if (temp > 85) return 'text-destructive';
      if (temp < 32) return 'text-warning';
      return 'text-success';
    }
    if (entityId.startsWith('device_tracker')) {
      return entity.state === 'home' ? 'text-success' : 'text-muted-foreground';
    }
    if (entityId.startsWith('person')) {
      return entity.state === 'home' ? 'text-success' : 'text-muted-foreground';
    }
    
    return 'text-foreground';
  };

  const getDisplayValue = () => {
    const entityId = entity.entity_id.toLowerCase();
    
    if (entityId.startsWith('light') || entityId.startsWith('switch')) {
      return entity.state === 'on' ? 'On' : 'Off';
    }
    if (entityId.startsWith('climate')) {
      const currentTemp = entity.attributes.current_temperature || entity.state;
      const targetTemp = entity.attributes.temperature;
      const unit = entity.attributes.unit_of_measurement || '°C';
      return targetTemp ? `${currentTemp}${unit} → ${targetTemp}${unit}` : `${currentTemp}${unit}`;
    }
    if (entityId.startsWith('fan')) {
      return entity.state === 'on' ? 'On' : 'Off';
    }
    if (entityId.startsWith('cover')) {
      return entity.state === 'open' ? 'Open' : 'Closed';
    }
    if (entityId.startsWith('media_player')) {
      return entity.state === 'playing' ? 'Playing' : entity.state.charAt(0).toUpperCase() + entity.state.slice(1);
    }
    if (entityId.includes('temperature')) {
      const unit = entity.attributes.unit_of_measurement || '';
      return `${entity.state}${unit}`;
    }
    if (entityId.includes('lock')) {
      return entity.state === 'locked' ? 'Locked' : 'Unlocked';
    }
    if (entityId.includes('door') || entityId.includes('contact')) {
      return entity.state === 'on' ? 'Open' : 'Closed';
    }
    if (entityId.includes('motion')) {
      return entity.state === 'on' ? 'Motion' : 'Clear';
    }
    if (entityId.startsWith('device_tracker')) {
      return entity.state === 'home' ? 'Home' : 'Away';
    }
    if (entityId.startsWith('person')) {
      return entity.state === 'home' ? 'Home' : 'Away';
    }

    return entity.state;
  };

  const getCardBackground = () => {
    const entityId = entity.entity_id.toLowerCase();
    
    if ((entityId.startsWith('light') || entityId.startsWith('switch')) && entity.state === 'on') {
      return 'bg-warning/10 border-warning/30';
    }
    if (entityId.startsWith('fan') && entity.state === 'on') {
      return 'bg-info/10 border-info/30';
    }
    if (entityId.startsWith('cover') && entity.state === 'open') {
      return 'bg-info/10 border-info/30';
    }
    if (entityId.startsWith('media_player') && entity.state === 'playing') {
      return 'bg-success/10 border-success/30';
    }
    if (entityId.includes('lock') && entity.state === 'unlocked') {
      return 'bg-warning/10 border-warning/30';
    }
    if (entityId.includes('door') && entity.state === 'on') {
      return 'bg-warning/10 border-warning/30';
    }
    if (entityId.includes('motion') && entity.state === 'on') {
      return 'bg-warning/10 border-warning/30';
    }
    if (entityId.includes('temperature')) {
      const temp = parseFloat(entity.state);
      if (temp > 85) return 'bg-destructive/10 border-destructive/30';
      if (temp < 32) return 'bg-warning/10 border-warning/30';
    }
    
    return 'bg-card border-border hover:bg-muted/50';
  };

  const isInteractive = entity.entity_id.includes('lock') || 
                       entity.entity_id.startsWith('light') || 
                       entity.entity_id.startsWith('switch') ||
                       entity.entity_id.startsWith('climate') ||
                       entity.entity_id.startsWith('fan') ||
                       entity.entity_id.startsWith('cover') ||
                       entity.entity_id.startsWith('media_player');
                       
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
        
        <div className="text-center flex-1 flex flex-col justify-end">
          <div className={cn('text-xs font-medium line-clamp-1 max-w-full', getStatusColor())}>
            {getDisplayValue()}
          </div>
          <div className="text-[10px] text-muted-foreground line-clamp-2 max-w-full mt-0.5 leading-tight" title={friendlyName}>
            {friendlyName}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};