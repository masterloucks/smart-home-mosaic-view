import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { CameraEntity } from '@/types/homeassistant';
import { cn } from '@/lib/utils';

interface CameraFeedProps {
  camera: CameraEntity;
  className?: string;
}

const HA_BASE_URL = 'http://192.168.0.159:8123';
const LONG_LIVED_TOKEN = 'YOUR_LONG_LIVED_TOKEN_HERE'; // Replace with actual token

export const CameraFeed = ({ camera, className }: CameraFeedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const friendlyName = camera.attributes.friendly_name || camera.entity_id.replace(/_/g, ' ');
  
  // Construct stream URL for Home Assistant camera
  const streamUrl = `${HA_BASE_URL}/api/camera_proxy_stream/${camera.entity_id}?token=${LONG_LIVED_TOKEN}`;
  
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Card className={cn('glass-effect overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {friendlyName}
          </CardTitle>
          <Badge 
            variant={camera.state === 'streaming' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {camera.state === 'streaming' ? 'Live' : camera.state}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="camera-container relative bg-muted">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Loading stream...</span>
              </div>
            </div>
          )}
          
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm">Stream unavailable</span>
              </div>
            </div>
          )}
          
          {camera.state === 'streaming' && (
            <img
              src={streamUrl}
              alt={friendlyName}
              className="w-full h-full object-cover"
              onLoad={handleLoad}
              onError={handleError}
              style={{ display: isLoading || hasError ? 'none' : 'block' }}
            />
          )}
          
          {camera.state !== 'streaming' && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera className="h-8 w-8" />
                <span className="text-sm">Camera offline</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 bg-card/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {camera.attributes.brand} {camera.attributes.model}
            </span>
            <span>
              Updated: {new Date(camera.last_updated).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};