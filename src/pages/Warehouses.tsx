import React from 'react';
import { WarehouseList } from '@/components/warehouses/WarehouseList';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const WarehousesPage: React.FC = () => {
  const { user, loading: authLoading, getToken } = useAuth();
  const [token, setToken] = React.useState<string | null>(null);
  const [loadingToken, setLoadingToken] = React.useState(true);

  React.useEffect(() => {
    const loadToken = async () => {
      if (!authLoading && user) {
        try {
          const idToken = await getToken();
          setToken(idToken || null);
        } catch (error) {
          console.error('Failed to get token', error);
        } finally {
          setLoadingToken(false);
        }
      } else if (!authLoading && !user) {
        setLoadingToken(false);
      }
    };

    loadToken();
  }, [user, authLoading, getToken]);

  if (authLoading || loadingToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access warehouses</p>
        </div>
      </div>
    );
  }

  return <WarehouseList token={token} />;
};

export default WarehousesPage;

