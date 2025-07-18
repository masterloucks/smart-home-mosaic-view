import { useState } from 'react';
import { useLayoutConfig } from '@/hooks/useLayoutConfig';
import { useGroupConfig } from '@/hooks/useGroupConfig';
import { useSystemWidgets } from '@/hooks/useSystemWidgets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Layout,
  Columns,
  Grid,
  Move,
  ArrowUpDown,
  Settings
} from 'lucide-react';

export const LayoutCustomization = () => {
  const { columns, setColumns } = useLayoutConfig();
  const { groups, updateGroup } = useGroupConfig();
  const { widgets, updateWidget } = useSystemWidgets();
  const { toast } = useToast();

  const handleColumnChange = (newColumns: string) => {
    const columnCount = parseInt(newColumns) as 1 | 2 | 3 | 4;
    setColumns(columnCount);
    toast({
      title: "Layout Updated",
      description: `Dashboard set to ${columnCount} column${columnCount > 1 ? 's' : ''}`,
    });
  };

  const handleGroupColumnChange = (groupId: string, newColumn: string) => {
    const columnNumber = parseInt(newColumn);
    updateGroup(groupId, { column: columnNumber });
    const group = groups.find(g => g.id === groupId);
    toast({
      title: "Group Moved",
      description: `Moved "${group?.name}" to column ${columnNumber}`,
    });
  };

  const handleWidgetColumnChange = (widgetId: string, newColumn: string) => {
    const columnNumber = parseInt(newColumn);
    updateWidget(widgetId, { column: columnNumber });
    const widget = widgets.find(w => w.id === widgetId);
    toast({
      title: "Widget Moved",
      description: `Moved "${widget?.name}" to column ${columnNumber}`,
    });
  };

  const getColumnOptions = () => {
    const options = [];
    const columnCount = columns || 3;
    for (let i = 1; i <= columnCount; i++) {
      options.push({ value: i.toString(), label: `Column ${i}` });
    }
    return options;
  };

  const getItemsInColumn = (column: number) => {
    const groupsInColumn = groups.filter(g => g.column === column && g.entityIds.length > 0);
    const widgetsInColumn = widgets.filter(w => w.column === column && w.enabled);
    return [...groupsInColumn, ...widgetsInColumn].length;
  };

  return (
    <div className="space-y-6">
      {/* Column Layout Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Dashboard Layout
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose how many columns your dashboard should have
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Number of columns:</label>
              <Select value={columns?.toString() || "3"} onValueChange={handleColumnChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Column Preview */}
            <div className="grid gap-2 mt-4" style={{ gridTemplateColumns: `repeat(${columns || 3}, 1fr)` }}>
              {Array.from({ length: columns || 3 }, (_, i) => (
                <div key={i} className="border rounded-lg p-3 bg-muted/30">
                  <div className="text-sm font-medium mb-2">Column {i + 1}</div>
                  <div className="text-xs text-muted-foreground">
                    {getItemsInColumn(i + 1)} items
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Column Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Entity Group Placement
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign each entity group to a column
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {groups
              .filter(group => group.entityIds.length > 0)
              .map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Move className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{group.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {group.entityIds.length} entities
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Column:</span>
                    <Select 
                      value={group.column?.toString() || "1"} 
                      onValueChange={(value) => handleGroupColumnChange(group.id, value)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getColumnOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            
            {groups.filter(group => group.entityIds.length > 0).length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Grid className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No entity groups with entities found</p>
                <p className="text-xs mt-1">Add entities to groups to see them here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Widget Column Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Widget Placement
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign system widgets (cameras, alerts) to columns
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{widget.name}</span>
                  </div>
                  <Badge 
                    variant={widget.enabled ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {widget.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Column:</span>
                  <Select 
                    value={widget.column?.toString() || "1"} 
                    onValueChange={(value) => handleWidgetColumnChange(widget.id, value)}
                    disabled={!widget.enabled}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getColumnOptions().map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};