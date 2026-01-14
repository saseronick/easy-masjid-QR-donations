# Offline Support Documentation

## Overview

The donation platform now includes comprehensive offline support, enabling users to continue working even in low-connectivity or no-connectivity environments. All data is automatically synchronized when the connection is restored.

## Features Implemented

### 1. Enhanced Service Worker

**Location**: `/public/sw.js`

The service worker implements three caching strategies:

- **Cache-First**: For static assets (JS, CSS, images)
- **Network-First**: For API requests (with 3-5 second timeout)
- **Stale-While-Revalidate**: For dynamic content

**Key Features**:
- Automatic caching of API responses
- Graceful fallback to cached data when offline
- Background cache updates
- Automatic cache versioning and cleanup

### 2. IndexedDB Local Storage

**Location**: `/src/utils/db.ts`

IndexedDB stores all critical data locally:

**Data Stores**:
- `donations`: All donation records
- `expenses`: All expense records
- `organizations`: Organization information
- `syncQueue`: Pending operations to sync

**Key Features**:
- Structured data storage with indexes
- Fast queries by organization
- Sync status tracking
- Automatic data versioning

### 3. Offline Storage Service

**Location**: `/src/services/offlineStorage.ts`

Manages offline data persistence and synchronization:

**Capabilities**:
- Save donations/expenses when offline
- Cache Supabase data for offline access
- Sync unsynced items when online
- Track sync status per item

**Key Methods**:
- `saveDonationOffline()`: Save donation to IndexedDB
- `saveExpenseOffline()`: Save expense to IndexedDB
- `syncDonationsToSupabase()`: Sync pending donations
- `syncExpensesToSupabase()`: Sync pending expenses
- `cacheSupabaseData()`: Cache online data for offline use

### 4. Sync Queue System

**Location**: `/src/services/syncQueue.ts`

Manages automatic synchronization:

**Features**:
- Auto-sync every 5 minutes (configurable)
- Immediate sync when coming back online
- Sync status tracking
- Error handling and retry logic

**Status Information**:
- `isSyncing`: Whether sync is in progress
- `lastSyncTime`: When last sync occurred
- `pendingCount`: Number of items waiting to sync
- `error`: Any sync errors

### 5. Sync Status UI

**Location**: `/src/components/SyncStatus.tsx`

Visual indicator of sync status:

**States**:
- **Online & Synced**: Green indicator
- **Offline**: Amber indicator with pending count
- **Syncing**: Blue spinner with progress
- **Error**: Red indicator with error message

**Features**:
- Manual sync button
- Pending item count
- Last sync timestamp
- Error notifications

### 6. Offline-First Dashboard

**Location**: `/src/components/Dashboard.tsx`

The dashboard now works offline-first:

**Data Flow**:
1. Load data from IndexedDB (instant)
2. Show cached data to user immediately
3. Fetch fresh data from Supabase in background
4. Update UI when fresh data arrives

**Offline Operations**:
- Add donations while offline
- Add expenses while offline
- View all cached data
- Export reports

## Testing Offline Functionality

### Method 1: Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to "Network" tab
3. Select "Offline" from throttling dropdown
4. Test adding donations/expenses
5. Check that data is saved
6. Switch back to "Online"
7. Verify data syncs automatically

### Method 2: Airplane Mode

1. Enable airplane mode on your device
2. Open the application
3. Navigate to admin dashboard
4. Add donations/expenses
5. Verify "Offline Mode" indicator appears
6. Disable airplane mode
7. Watch sync status update

### Method 3: Slow Connection Simulation

1. Open Chrome DevTools (F12)
2. Go to "Network" tab
3. Select "Slow 3G" or "Fast 3G"
4. Test application responsiveness
5. Verify cached data loads quickly
6. Check that sync works despite slow connection

### Method 4: Service Worker Cache Testing

1. Load the application while online
2. Open DevTools > Application > Service Workers
3. Verify service worker is active
4. Go to Application > Cache Storage
5. Verify caches are populated
6. Go offline and reload
7. Application should still work

## How Data Syncs

### Automatic Sync

- Runs every 5 minutes while online
- Triggers immediately when coming back online
- Only syncs items marked as `synced: false`

### Manual Sync

- Click "Sync Now" button in sync status widget
- Forces immediate sync attempt
- Shows progress and results

### Sync Process

1. Get all unsynced donations from IndexedDB
2. Insert each into Supabase
3. Mark successful items as synced
4. Repeat for expenses
5. Update pending count
6. Show sync result to user

## Data Integrity

### Conflict Resolution

- Offline items get temporary IDs (e.g., `offline-1234567890-abc`)
- When synced, Supabase assigns real UUID
- Original offline record is marked as synced
- No data loss during sync

### Failure Handling

- Failed sync items remain marked as unsynced
- Retry automatically on next sync cycle
- Error details shown in sync status
- User can manually retry

## Performance Optimizations

### Cache Strategy Benefits

- **Static assets**: Load instantly from cache
- **API responses**: 3-5 second timeout before fallback
- **Dynamic content**: Show cached version while fetching fresh

### IndexedDB Performance

- Indexed by organization_id for fast queries
- Indexed by synced status for quick sync queries
- Indexed by date for sorted lists

### Memory Management

- Service worker clears old cache versions
- IndexedDB auto-compacts
- Large datasets handled efficiently

## Browser Support

### Required Features

- Service Workers (Chrome 40+, Firefox 44+, Safari 11.1+)
- IndexedDB (All modern browsers)
- Fetch API (All modern browsers)
- Promises (All modern browsers)

### Fallback Behavior

- If Service Workers unavailable: Online-only mode
- If IndexedDB unavailable: Direct Supabase only
- Graceful degradation for all features

## Monitoring Offline Usage

### Developer Tools

**Check Service Worker**:
```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('Service Worker ready:', reg);
});
```

**Check IndexedDB Data**:
```javascript
// Open DevTools > Application > IndexedDB > DonationPlatformDB
```

**Check Sync Status**:
```javascript
import { syncQueue } from './services/syncQueue';
console.log(syncQueue.getStatus());
```

### User Analytics

Track these metrics:
- Percentage of offline operations
- Average sync time
- Sync success/failure rates
- Items in sync queue

## Best Practices

### For Users

1. Wait for initial sync when coming online
2. Watch for sync status indicators
3. Verify important data after syncing
4. Export reports regularly as backup

### For Developers

1. Always check `navigator.onLine` before network requests
2. Use try/catch around all Supabase calls
3. Update pending count after offline operations
4. Test both online and offline scenarios
5. Handle sync errors gracefully

### For Deployment

1. Ensure service worker is properly registered
2. Test cache headers are correct
3. Monitor sync queue sizes
4. Set up error logging for sync failures

## Troubleshooting

### "Data not syncing"

1. Check network connection
2. Verify sync status widget shows pending items
3. Click "Sync Now" manually
4. Check browser console for errors
5. Verify Supabase credentials are correct

### "Old data showing"

1. Check if you're offline (sync status widget)
2. Force refresh (Ctrl/Cmd + Shift + R)
3. Clear cache in DevTools > Application > Clear Storage
4. Wait for automatic sync cycle

### "Service worker not installing"

1. Check HTTPS is enabled (required for SW)
2. Verify sw.js is accessible
3. Check for JavaScript errors
4. Try unregistering and re-registering

### "IndexedDB errors"

1. Check browser supports IndexedDB
2. Verify storage quota not exceeded
3. Close other tabs with same origin
4. Clear IndexedDB in DevTools

## Future Enhancements

Potential improvements:

1. Background Sync API for reliable syncing
2. Conflict resolution for concurrent edits
3. Selective sync (sync only what changed)
4. Compression for large datasets
5. Periodic background cache refresh
6. Push notifications for sync status
7. Bandwidth-aware sync scheduling
8. Differential sync (only changes)

## API Reference

### Sync Queue Service

```typescript
// Start auto-sync every N minutes
syncQueue.startAutoSync(5);

// Stop auto-sync
syncQueue.stopAutoSync();

// Manual sync
const success = await syncQueue.syncNow();

// Get current status
const status = syncQueue.getStatus();

// Subscribe to status changes
const unsubscribe = syncQueue.subscribe((status) => {
  console.log('Sync status:', status);
});
```

### Offline Storage Service

```typescript
// Save offline
const id = await offlineStorage.saveDonationOffline(data, orgId);
const id = await offlineStorage.saveExpenseOffline(data, orgId);

// Get offline data
const donations = await offlineStorage.getDonationsForOrganization(orgId);
const expenses = await offlineStorage.getExpensesForOrganization(orgId);

// Sync to Supabase
const result = await offlineStorage.syncAll();

// Get unsynced count
const count = await offlineStorage.getUnsyncedCount();

// Cache Supabase data
await offlineStorage.cacheSupabaseData(orgId);
```

### IndexedDB Service

```typescript
import { db } from './utils/db';

// Add records
await db.addDonation(donation);
await db.addExpense(expense);

// Query records
const donations = await db.getDonationsByOrganization(orgId);
const expenses = await db.getExpensesByOrganization(orgId);

// Get unsynced
const unsyncedDonations = await db.getUnsyncedDonations();
const unsyncedExpenses = await db.getUnsyncedExpenses();

// Mark as synced
await db.markDonationAsSynced(id);
await db.markExpenseAsSynced(id);
```
