import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  X,
  Bell
} from 'lucide-react';
import { Alert } from '@/types/homeassistant';
import { cn } from '@/lib/utils';

interface AlertsPanelProps {
  alerts: Alert[];
  onDismissAlert?: (alertId: string) => void;
  className?: string;
}

export const AlertsPanel = ({ alerts, onDismissAlert, className }: AlertsPanelProps) => {
  const getAlertIcon = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-destructive border-destructive/30 bg-destructive/5';
      case 'warning':
        return 'text-warning border-warning/30 bg-warning/5';
      case 'info':
        return 'text-primary border-primary/30 bg-primary/5';
      default:
        return 'text-muted-foreground border-border bg-muted/5';
    }
  };

  const getBadgeVariant = (priority: Alert['priority']) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'default';
      default:
        return 'outline';
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityOrder = { critical: 3, warning: 2, info: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <Card className={cn('glass-effect', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            System Alerts
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {alerts.length} active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="p-4 space-y-3">
            {sortedAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active alerts</p>
              </div>
            ) : (
              sortedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-3 rounded-lg border transition-all duration-200',
                    getAlertColor(alert.priority)
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="mt-0.5">
                        {getAlertIcon(alert.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge 
                            variant={getBadgeVariant(alert.priority)}
                            className="text-xs"
                          >
                            {alert.priority.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {alert.entity_id && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {alert.entity_id}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {onDismissAlert && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-background/80"
                        onClick={() => onDismissAlert(alert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};