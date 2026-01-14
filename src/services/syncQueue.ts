import { offlineStorage } from './offlineStorage';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  error: string | null;
}

type SyncListener = (status: SyncStatus) => void;

class SyncQueueService {
  private listeners: Set<SyncListener> = new Set();
  private status: SyncStatus = {
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    error: null,
  };
  private syncInterval: number | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.setupOnlineListener();
    this.loadLastSyncTime();
    this.updatePendingCount();
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateStatus({ isSyncing: false });
    });
  }

  private async loadLastSyncTime() {
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      this.updateStatus({ lastSyncTime: lastSync });
    }
  }

  private saveLastSyncTime() {
    const now = new Date().toISOString();
    localStorage.setItem('lastSyncTime', now);
    this.updateStatus({ lastSyncTime: now });
  }

  private updateStatus(updates: Partial<SyncStatus>) {
    this.status = { ...this.status, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.status));
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async updatePendingCount() {
    try {
      const count = await offlineStorage.getUnsyncedCount();
      this.updateStatus({ pendingCount: count });
    } catch (error) {
      console.error('Failed to update pending count:', error);
    }
  }

  async syncNow(): Promise<boolean> {
    if (this.status.isSyncing || !this.isOnline) {
      return false;
    }

    this.updateStatus({ isSyncing: true, error: null });

    try {
      const result = await offlineStorage.syncAll();

      const totalSuccess = result.donations.success + result.expenses.success;
      const totalFailed = result.donations.failed + result.expenses.failed;

      if (totalFailed > 0) {
        this.updateStatus({
          isSyncing: false,
          error: `${totalFailed} items failed to sync`,
        });
        await this.updatePendingCount();
        return false;
      }

      if (totalSuccess > 0) {
        this.saveLastSyncTime();
      }

      this.updateStatus({ isSyncing: false, error: null });
      await this.updatePendingCount();
      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateStatus({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      });
      return false;
    }
  }

  startAutoSync(intervalMinutes: number = 5) {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && this.status.pendingCount > 0) {
        this.syncNow();
      }
    }, intervalMinutes * 60 * 1000);

    if (this.isOnline && this.status.pendingCount > 0) {
      this.syncNow();
    }
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  isOnlineMode(): boolean {
    return this.isOnline;
  }
}

export const syncQueue = new SyncQueueService();
