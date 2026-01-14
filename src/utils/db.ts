const DB_NAME = 'DonationPlatformDB';
const DB_VERSION = 2;

export interface DBDonation {
  id: string;
  organization_id: string;
  amount: number;
  donor_name?: string;
  donor_phone?: string;
  donor_email?: string;
  payment_method?: string;
  status: string;
  currency: string;
  date: string;
  notes?: string;
  manual_entry?: boolean;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBExpense {
  id: string;
  organization_id: string;
  amount: number;
  purpose: string;
  notes?: string;
  currency: string;
  date: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBOrganization {
  id: string;
  name: string;
  contact_phone: string;
  contact_email?: string;
  raast_id?: string;
  bank_account?: string;
  easypaisa_account?: string;
  jazzcash_account?: string;
  synced: boolean;
  last_synced?: string;
}

export interface DBPaymentInfo {
  id: string;
  organizationName: string;
  amount: number;
  purpose: string;
  qrCodeData: string;
  paymentMethod: string;
  raastId?: string;
  phoneNumber?: string;
  accountNumber?: string;
  created_at: string;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('donations')) {
          const donationStore = db.createObjectStore('donations', { keyPath: 'id' });
          donationStore.createIndex('organization_id', 'organization_id', { unique: false });
          donationStore.createIndex('synced', 'synced', { unique: false });
          donationStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expenseStore.createIndex('organization_id', 'organization_id', { unique: false });
          expenseStore.createIndex('synced', 'synced', { unique: false });
          expenseStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('organizations')) {
          const orgStore = db.createObjectStore('organizations', { keyPath: 'id' });
          orgStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('paymentInfo')) {
          const paymentStore = db.createObjectStore('paymentInfo', { keyPath: 'id' });
          paymentStore.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  async addDonation(donation: DBDonation): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['donations'], 'readwrite');
      const store = transaction.objectStore('donations');
      const request = store.put(donation);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDonationsByOrganization(organizationId: string): Promise<DBDonation[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['donations'], 'readonly');
      const store = transaction.objectStore('donations');
      const index = store.index('organization_id');
      const request = index.getAll(organizationId);

      request.onsuccess = () => {
        const donations = request.result.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        resolve(donations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addExpense(expense: DBExpense): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['expenses'], 'readwrite');
      const store = transaction.objectStore('expenses');
      const request = store.put(expense);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getExpensesByOrganization(organizationId: string): Promise<DBExpense[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['expenses'], 'readonly');
      const store = transaction.objectStore('expenses');
      const index = store.index('organization_id');
      const request = index.getAll(organizationId);

      request.onsuccess = () => {
        const expenses = request.result.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        resolve(expenses);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addOrganization(organization: DBOrganization): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['organizations'], 'readwrite');
      const store = transaction.objectStore('organizations');
      const request = store.put(organization);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOrganization(id: string): Promise<DBOrganization | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['organizations'], 'readonly');
      const store = transaction.objectStore('organizations');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllOrganizations(): Promise<DBOrganization[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['organizations'], 'readonly');
      const store = transaction.objectStore('organizations');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedDonations(): Promise<DBDonation[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['donations'], 'readonly');
      const store = transaction.objectStore('donations');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedExpenses(): Promise<DBExpense[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['expenses'], 'readonly');
      const store = transaction.objectStore('expenses');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markDonationAsSynced(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['donations'], 'readwrite');
      const store = transaction.objectStore('donations');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const donation = getRequest.result;
        if (donation) {
          donation.synced = true;
          const putRequest = store.put(donation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async markExpenseAsSynced(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['expenses'], 'readwrite');
      const store = transaction.objectStore('expenses');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const expense = getRequest.result;
        if (expense) {
          expense.synced = true;
          const putRequest = store.put(expense);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async addPaymentInfo(paymentInfo: DBPaymentInfo): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['paymentInfo'], 'readwrite');
      const store = transaction.objectStore('paymentInfo');
      const request = store.put(paymentInfo);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPaymentInfo(id: string): Promise<DBPaymentInfo | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['paymentInfo'], 'readonly');
      const store = transaction.objectStore('paymentInfo');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPaymentInfo(): Promise<DBPaymentInfo[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['paymentInfo'], 'readonly');
      const store = transaction.objectStore('paymentInfo');
      const request = store.getAll();

      request.onsuccess = () => {
        const payments = request.result.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        resolve(payments);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['donations', 'expenses', 'organizations', 'syncQueue', 'paymentInfo'], 'readwrite');

      const promises = [
        new Promise((res, rej) => {
          const req = transaction.objectStore('donations').clear();
          req.onsuccess = () => res(undefined);
          req.onerror = () => rej(req.error);
        }),
        new Promise((res, rej) => {
          const req = transaction.objectStore('expenses').clear();
          req.onsuccess = () => res(undefined);
          req.onerror = () => rej(req.error);
        }),
        new Promise((res, rej) => {
          const req = transaction.objectStore('organizations').clear();
          req.onsuccess = () => res(undefined);
          req.onerror = () => rej(req.error);
        }),
        new Promise((res, rej) => {
          const req = transaction.objectStore('syncQueue').clear();
          req.onsuccess = () => res(undefined);
          req.onerror = () => rej(req.error);
        }),
        new Promise((res, rej) => {
          const req = transaction.objectStore('paymentInfo').clear();
          req.onsuccess = () => res(undefined);
          req.onerror = () => rej(req.error);
        })
      ];

      Promise.all(promises).then(() => resolve()).catch(reject);
    });
  }
}

export const db = new IndexedDBService();
