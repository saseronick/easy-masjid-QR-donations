import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { syncQueue, SyncStatus as SyncStatusType } from '../services/syncQueue';

export default function SyncStatus() {
  const [status, setStatus] = useState<SyncStatusType>(syncQueue.getStatus());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const unsubscribe = syncQueue.subscribe(setStatus);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncClick = () => {
    syncQueue.syncNow();
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-20 bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-30 max-w-sm">
        <CloudOff className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">Offline Mode</p>
          {status.pendingCount > 0 && (
            <p className="text-xs text-amber-100 mt-0.5">
              {status.pendingCount} item{status.pendingCount !== 1 ? 's' : ''} pending
            </p>
          )}
        </div>
      </div>
    );
  }

  if (status.pendingCount === 0 && !status.isSyncing && !status.error) {
    return (
      <div className="fixed bottom-4 right-20 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-30">
        <Cloud className="w-4 h-4" />
        <span className="text-sm font-medium">Synced</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-20 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-30 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {status.isSyncing ? (
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          ) : status.error ? (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {status.isSyncing ? 'Syncing...' : status.error ? 'Sync Error' : 'Sync Status'}
            </h3>
            {!status.isSyncing && status.pendingCount > 0 && (
              <button
                onClick={handleSyncClick}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors font-medium"
              >
                Sync Now
              </button>
            )}
          </div>

          {status.error && (
            <p className="text-xs text-rose-600 mt-1">{status.error}</p>
          )}

          <div className="mt-2 space-y-1">
            {status.pendingCount > 0 && (
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-900">{status.pendingCount}</span> item
                {status.pendingCount !== 1 ? 's' : ''} waiting to sync
              </p>
            )}

            {status.lastSyncTime && (
              <p className="text-xs text-gray-500">
                Last synced: {formatLastSync(status.lastSyncTime)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
