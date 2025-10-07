"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, Database, Book, ExternalLink } from "lucide-react";
import { isDemoMode, supabase } from "@/lib/supabase";
import { userProfileService } from "@/lib/database";

interface DatabaseStatus {
  mode: 'demo' | 'connected' | 'error';
  message: string;
  canConnect: boolean;
  tablesExist: boolean;
}

export function DatabaseStatus() {
  const [status, setStatus] = useState<DatabaseStatus>({
    mode: 'demo',
    message: 'Checking database connection...',
    canConnect: false,
    tablesExist: false
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    if (isDemoMode) {
      setStatus({
        mode: 'demo',
        message: 'Demo mode active. Follow setup instructions to connect real database.',
        canConnect: false,
        tablesExist: false
      });
      return;
    }

    try {
      // Test basic connection
      const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });

      if (error) {
        setStatus({
          mode: 'error',
          message: `Database connection failed: ${error.message}`,
          canConnect: false,
          tablesExist: false
        });
        return;
      }

      setStatus({
        mode: 'connected',
        message: 'Database connected successfully! All systems ready.',
        canConnect: true,
        tablesExist: true
      });

    } catch (error) {
      setStatus({
        mode: 'error',
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        canConnect: false,
        tablesExist: false
      });
    }
  };

  const testConnection = async () => {
    setTesting(true);
    await checkDatabaseStatus();
    setTesting(false);
  };

  const getStatusIcon = () => {
    switch (status.mode) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'demo':
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.mode) {
      case 'connected':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'demo':
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <Card className={`${getStatusColor()} transition-colors`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection Status
          {getStatusIcon()}
        </CardTitle>
        <CardDescription>
          Current database mode and connection status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={status.mode === 'connected' ? 'default' : status.mode === 'error' ? 'destructive' : 'secondary'}>
            {status.mode === 'demo' ? 'Demo Mode' : status.mode === 'connected' ? 'Connected' : 'Error'}
          </Badge>
          <span className="text-sm text-muted-foreground">{status.message}</span>
        </div>

        {/* Demo Mode Instructions */}
        {status.mode === 'demo' && (
          <Alert>
            <Book className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p><strong>Setup Required:</strong> You're currently in demo mode. Data will not persist.</p>
              <div className="space-y-1 text-sm">
                <p><strong>Next Steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">supabase.com <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Get your Project URL and API Key</li>
                  <li>Update <code className="bg-gray-100 px-1 rounded">.env.local</code> with your credentials</li>
                  <li>Deploy the database schema from <code className="bg-gray-100 px-1 rounded">.same/database-schema.sql</code></li>
                  <li>Restart the development server</li>
                </ol>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/.same/SETUP_INSTRUCTIONS.md', '_blank')}
                className="mt-2"
              >
                <Book className="h-4 w-4 mr-2" />
                View Setup Instructions
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {status.mode === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <p><strong>Connection Failed:</strong> {status.message}</p>
              <p className="text-sm mt-2">
                Check your .env.local file and ensure your Supabase credentials are correct.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Success State */}
        {status.mode === 'connected' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <p><strong>Success!</strong> Database is connected and ready.</p>
              <p className="text-sm mt-1">
                All data will now persist to your Supabase database.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Test Connection Button */}
        <div className="flex gap-2">
          <Button
            onClick={testConnection}
            disabled={testing}
            variant="outline"
            size="sm"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>

          {!isDemoMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Supabase Dashboard
            </Button>
          )}
        </div>

        {/* Environment Info */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
          <p><strong>Environment:</strong></p>
          <p>Demo Mode: {isDemoMode ? 'Yes' : 'No'}</p>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
          <p>API Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
