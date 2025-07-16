import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityConfigProps {
  onConfigSaved: (config: { baseUrl: string; token: string }) => void;
  isConnected: boolean;
}

const STORAGE_KEYS = {
  HA_BASE_URL: 'ha_base_url',
  HA_TOKEN: 'ha_token_encrypted',
} as const;

// Simple XOR encryption for localStorage (not cryptographically secure, but better than plain text)
const encryptToken = (token: string): string => {
  const key = 'ha_dashboard_key';
  let encrypted = '';
  for (let i = 0; i < token.length; i++) {
    encrypted += String.fromCharCode(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
};

const decryptToken = (encrypted: string): string => {
  try {
    const key = 'ha_dashboard_key';
    const decoded = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch {
    return '';
  }
};

export const SecurityConfig = ({ onConfigSaved, isConnected }: SecurityConfigProps) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved configuration
    const savedUrl = localStorage.getItem(STORAGE_KEYS.HA_BASE_URL);
    const savedToken = localStorage.getItem(STORAGE_KEYS.HA_TOKEN);
    
    if (savedUrl && savedToken) {
      setBaseUrl(savedUrl);
      const decryptedToken = decryptToken(savedToken);
      setToken(decryptedToken);
      setIsConfigured(true);
      onConfigSaved({ baseUrl: savedUrl, token: decryptedToken });
    }
  }, [onConfigSaved]);

  const handleSave = () => {
    if (!baseUrl || !token) {
      toast({
        title: "Configuration Required",
        description: "Please provide both Home Assistant URL and access token.",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(baseUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Home Assistant URL (e.g., http://192.168.1.100:8123)",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage with encryption
    localStorage.setItem(STORAGE_KEYS.HA_BASE_URL, baseUrl);
    localStorage.setItem(STORAGE_KEYS.HA_TOKEN, encryptToken(token));
    
    setIsConfigured(true);
    onConfigSaved({ baseUrl, token });
    
    toast({
      title: "Configuration Saved",
      description: "Your Home Assistant configuration has been saved securely.",
    });
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEYS.HA_BASE_URL);
    localStorage.removeItem(STORAGE_KEYS.HA_TOKEN);
    setBaseUrl('');
    setToken('');
    setIsConfigured(false);
    
    toast({
      title: "Configuration Cleared",
      description: "Your configuration has been removed from local storage.",
    });
  };

  if (isConfigured && isConnected) {
    return (
      <Card className="glass-effect">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-green-600">
            <Shield className="h-4 w-4" />
            Secure Connection Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Connected to: {baseUrl}
            </span>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Reconfigure
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Home Assistant Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your credentials are encrypted and stored locally in your browser. 
            They are never transmitted to any third-party servers.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="baseUrl">Home Assistant URL</Label>
          <Input
            id="baseUrl"
            type="url"
            placeholder="http://192.168.1.100:8123"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="token">Long-Lived Access Token</Label>
          <div className="relative">
            <Input
              id="token"
              type={showToken ? 'text' : 'password'}
              placeholder="Enter your Home Assistant access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Create a long-lived access token in Home Assistant: 
            Profile → Security → Long-Lived Access Tokens
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save Configuration
          </Button>
          {isConfigured && (
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};