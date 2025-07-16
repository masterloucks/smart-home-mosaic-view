import { useState, useEffect } from 'react';
import { useHomeAssistant } from '@/hooks/useHomeAssistant';
import { useSecureConfig } from '@/hooks/useSecureConfig';
import { SecurityConfig } from '@/components/SecurityConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Home, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Bug,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ConnectionTest = () => {
  const { config, setConfig, isConfigured } = useSecureConfig();
  const { 
    entities, 
    isConnected, 
    isLoading, 
    error, 
    refreshEntities 
  } = useHomeAssistant(config);
  
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const runConnectionTest = async () => {
    if (!config?.baseUrl || !config?.token) {
      toast({
        title: "Configuration Required",
        description: "Please configure your Home Assistant connection first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    const results = [];

    // Test 1: Basic connectivity
    try {
      const response = await fetch(`${config.baseUrl}/api/`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      results.push({
        test: 'Basic API Connectivity',
        status: response.ok ? 'success' : 'error',
        message: response.ok 
          ? `Connected successfully (Status: ${response.status})` 
          : `HTTP Error: ${response.status} - ${response.statusText}`,
        details: `URL: ${config.baseUrl}/api/`
      });
    } catch (err) {
      results.push({
        test: 'Basic API Connectivity',
        status: 'error',
        message: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: `URL: ${config.baseUrl}/api/`
      });
    }

    // Test 2: Authentication
    try {
      const response = await fetch(`${config.baseUrl}/api/config`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          test: 'Authentication',
          status: 'success',
          message: `Authenticated successfully`,
          details: `Home Assistant version: ${data.version || 'Unknown'}, Location: ${data.location_name || 'Unknown'}`
        });
      } else {
        results.push({
          test: 'Authentication',
          status: 'error',
          message: `Authentication failed (Status: ${response.status})`,
          details: response.status === 401 ? 'Invalid token' : 'Unknown authentication error'
        });
      }
    } catch (err) {
      results.push({
        test: 'Authentication',
        status: 'error',
        message: `Authentication test failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: 'Could not verify token validity'
      });
    }

    // Test 3: States endpoint
    try {
      const response = await fetch(`${config.baseUrl}/api/states`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          test: 'States Endpoint',
          status: 'success',
          message: `Retrieved ${data.length} entities`,
          details: `Endpoint: ${config.baseUrl}/api/states`
        });
      } else {
        results.push({
          test: 'States Endpoint',
          status: 'error',
          message: `Failed to retrieve states (Status: ${response.status})`,
          details: `Endpoint: ${config.baseUrl}/api/states`
        });
      }
    } catch (err) {
      results.push({
        test: 'States Endpoint',
        status: 'error',
        message: `States test failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        details: `Endpoint: ${config.baseUrl}/api/states`
      });
    }

    setTestResults(results);
    setIsTestingConnection(false);
  };

  useEffect(() => {
    if (isConfigured) {
      runConnectionTest();
    }
  }, [isConfigured]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const commonIssues = [
    {
      issue: "CORS / Cross-Origin Errors",
      solution: "Ensure your Home Assistant is accessible and CORS is properly configured. Add your domain to trusted_proxies in configuration.yaml"
    },
    {
      issue: "Connection Refused",
      solution: "Check if Home Assistant is running and accessible at the provided URL. Verify port number and protocol (http/https)"
    },
    {
      issue: "Invalid Token",
      solution: "Generate a new Long-Lived Access Token in Home Assistant Profile settings"
    },
    {
      issue: "SSL/HTTPS Issues",
      solution: "If using HTTPS, ensure your SSL certificate is valid. For local testing, you may need to use HTTP"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Bug className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Connection Test</h1>
              <p className="text-sm text-muted-foreground">
                Home Assistant Connection Diagnostics
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={runConnectionTest}
            disabled={isTestingConnection || !isConfigured}
            className="touch-target"
          >
            <RefreshCw className={`h-4 w-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </div>
      </div>

      {/* Configuration Section */}
      {!isConfigured && (
        <div className="mb-6">
          <SecurityConfig onConfigSaved={setConfig} isConnected={isConnected} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Tests */}
        <div className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Connection Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Run a connection test to see diagnostics</p>
                </div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <h3 className="font-semibold">{result.test}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    <p className="text-xs text-muted-foreground">{result.details}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Connection Status</p>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Entities Count</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(entities).length}
                  </p>
                </div>
              </div>
              
              {error && (
                <div className="border-l-4 border-red-500 pl-4 py-2">
                  <p className="text-sm font-medium text-red-600">Current Error</p>
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
              
              {config && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Configuration</p>
                  <div className="text-xs space-y-1">
                    <p>Base URL: {config.baseUrl}</p>
                    <p>Token: {config.token ? '***configured***' : 'Not set'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Troubleshooting Guide */}
        <div className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Common Issues & Solutions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commonIssues.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm">{item.issue}</h3>
                  <p className="text-sm text-muted-foreground">{item.solution}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Network Details */}
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Network Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Browser Information</p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>User Agent: {navigator.userAgent}</p>
                  <p>Protocol: {window.location.protocol}</p>
                  <p>Host: {window.location.host}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Tips</p>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Ensure Home Assistant is on the same network</li>
                  <li>Check firewall settings</li>
                  <li>Verify port accessibility</li>
                  <li>Test with browser dev tools open</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;