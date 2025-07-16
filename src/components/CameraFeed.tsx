import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CameraEntity } from '@/types/homeassistant';
import { cn } from '@/lib/utils';

interface CameraFeedProps {
  camera: CameraEntity;
  className?: string;
  baseUrl?: string;
  token?: string;
}

export const CameraFeed = ({ camera, className, baseUrl, token }: CameraFeedProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentStreamType, setCurrentStreamType] = useState<'webrtc' | 'mjpeg' | null>('webrtc');

  const friendlyName = camera.attributes.friendly_name || camera.entity_id.replace(/_/g, ' ');

  const getStreamUrl = (type: 'webrtc' | 'mjpeg') => {
    if (!baseUrl || !camera.entity_id || !token) return null;

    if (type === 'webrtc') {
      // WebRTC proxy for low-latency streaming (HA 2024.11+)
      return `${baseUrl}/api/camera_proxy/${camera.entity_id}?token=${token}`;
    } else {
      // Traditional MJPEG stream fallback
      return `${baseUrl}/api/camera_proxy_stream/${camera.entity_id}?token=${token}`;
    }
  };

  // Reset stream type when camera changes
  useEffect(() => {
    setCurrentStreamType('webrtc');
    setIsLoading(true);
    setHasError(false);
  }, [camera.entity_id]);
  
  
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    if (currentStreamType === 'webrtc') {
      console.log(`WebRTC stream failed for ${camera.entity_id}, trying MJPEG fallback...`);
      setCurrentStreamType('mjpeg');
      setIsLoading(true);
      setHasError(false);
    } else {
      console.log(`All stream types failed for ${camera.entity_id}`);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const currentStreamUrl = currentStreamType ? getStreamUrl(currentStreamType) : null;

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
          
          {camera.state === 'streaming' && currentStreamUrl && (
            <img
              key={`${camera.entity_id}-${currentStreamType}`}
              src={currentStreamUrl}
              alt={friendlyName}
              className="w-full h-full object-cover"
              onLoad={handleLoad}
              onError={handleError}
              style={{ display: isLoading || hasError ? 'none' : 'block' }}
            />
          )}
          
          {camera.state === 'streaming' && !currentStreamUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm">Configuration required</span>
              </div>
            </div>
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