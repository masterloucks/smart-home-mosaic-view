import { useSystemWidgets } from '@/hooks/useSystemWidgets';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings,
  Camera,
  AlertTriangle,
  Cloud,
  Zap,
  Wifi,
  Plus,
  Trash2
} from 'lucide-react';

const WIDGET_ICONS = {
  cameras: Camera,
  alerts: AlertTriangle,
  weather_summary: Cloud,
  energy_usage: Zap,
  network_status: Wifi
};

const WIDGET_DESCRIPTIONS = {
  cameras: 'Live camera feeds from your Home Assistant setup',
  alerts: 'System alerts and notifications',
  weather_summary: 'Weather information and forecasts',
  energy_usage: 'Energy consumption monitoring',
  network_status: 'Network connectivity and device status'
};

export const SystemWidgetConfig = () => {
  const { widgets, updateWidget, toggleWidget, addWidget, removeWidget } = useSystemWidgets();
  const { layoutConfig } = useLayoutConfig();
  const { toast } = useToast();

  const handleToggleWidget = (widgetId: string) => {
    toggleWidget(widgetId);
    const widget = widgets.find(w => w.id === widgetId);
    toast({
      title: "Widget Updated",
      description: `${widget?.name} ${widget?.enabled ? 'disabled' : 'enabled'}`,
    });
  };

  const handleOrderChange = (widgetId: string, newOrder: string) => {
    const orderNumber = parseInt(newOrder);
    updateWidget(widgetId, { order: orderNumber });
    const widget = widgets.find(w => w.id === widgetId);
    toast({
      title: "Widget Reordered",
      description: `Updated order for "${widget?.name}"`,
    });
  };

  const handleColumnChange = (widgetId: string, newColumn: string) => {
    const columnNumber = newColumn === "none" ? 0 : parseInt(newColumn);
    updateWidget(widgetId, { column: columnNumber });
    const widget = widgets.find(w => w.id === widgetId);
    const columnText = columnNumber === 0 ? 'None (hidden)' : `Column ${columnNumber}`;
    toast({
      title: "Widget Placement Updated",
      description: `Moved "${widget?.name}" to ${columnText}`,
    });
  };

  const handleRemoveWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget && ['cameras', 'alerts'].includes(widget.id)) {
      toast({
        title: "Cannot Remove",
        description: "Core widgets cannot be removed, only disabled",
        variant: "destructive"
      });
      return;
    }
    
    if (widget) {
      removeWidget(widgetId);
      toast({
        title: "Widget Removed",
        description: `Removed "${widget.name}" widget`,
      });
    }
  };

  const addNewWidget = (type: keyof typeof WIDGET_ICONS) => {
    // Prevent duplicates of certain widget types
    const existingWidget = widgets.find(w => w.type === type);
    if (existingWidget && ['weather_summary', 'energy_usage', 'network_status'].includes(type)) {
      toast({
        title: "Widget Already Exists",
        description: `${WIDGET_DESCRIPTIONS[type]} widget already exists`,
        variant: "destructive"
      });
      return;
    }

    const newWidget = {
      name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type,
      enabled: true,
      column: 1,
      order: widgets.length + 1
    };

    addWidget(newWidget);
    toast({
      title: "Widget Added",
      description: `Added ${newWidget.name} widget`,
    });
  };

  const getAvailableWidgetTypes = () => {
    const existing = new Set(widgets.map(w => w.type));
    return Object.keys(WIDGET_ICONS).filter(type => 
      !existing.has(type as keyof typeof WIDGET_ICONS) ||
      ['cameras'].includes(type) // Allow multiple cameras widgets
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Home Assistant System Widgets
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage system widgets like cameras, alerts, and other Home Assistant features
              </p>
            </div>
            
            {getAvailableWidgetTypes().length > 0 && (
              <Select onValueChange={addNewWidget}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add widget..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableWidgetTypes().map(type => {
                    const IconComponent = WIDGET_ICONS[type as keyof typeof WIDGET_ICONS];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {widgets.map((widget) => {
              const IconComponent = WIDGET_ICONS[widget.type];
              const isCore = ['cameras', 'alerts'].includes(widget.id);
              
              return (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{widget.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {WIDGET_DESCRIPTIONS[widget.type]}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={widget.enabled ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {widget.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge 
                        variant={widget.column === 0 ? "outline" : "secondary"}
                        className="text-xs"
                      >
                        {widget.column === 0 ? 'Hidden' : `Col ${widget.column}`}
                      </Badge>
                      {isCore && (
                        <Badge variant="outline" className="text-xs">
                          Core
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Column:</span>
                      <Select 
                        value={widget.column === 0 ? "none" : widget.column.toString()} 
                        onValueChange={(value) => handleColumnChange(widget.id, value)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border shadow-lg z-50">
                          <SelectItem value="none" className="cursor-pointer">
                            None
                          </SelectItem>
                          {Array.from({ length: layoutConfig?.columns || 3 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()} className="cursor-pointer">
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Order:</span>
                      <Select 
                        value={widget.order.toString()} 
                        onValueChange={(value) => handleOrderChange(widget.id, value)}
                      >
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md">
                          {Array.from({ length: widgets.length }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Switch
                      checked={widget.enabled}
                      onCheckedChange={() => handleToggleWidget(widget.id)}
                    />
                    
                    {!isCore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {widgets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No system widgets configured</p>
                <p className="text-xs mt-1">Add widgets to customize your dashboard</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};