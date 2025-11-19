/**
 * File Sync Manager
 * 
 * Manages local file synchronization with Supabase storage.
 * Downloads missing files, deletes orphaned files, maintains metadata.
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import WebSocket from 'ws';

// WebSocket reference for sending messages
let ws: WebSocket | null = null;

// Local file IDs tracked in metadata.txt
let localIds: Set<string> = new Set();

// Sync state
let isSyncing: boolean = false;

// Paths
const USER_DATA_PATH = app.getPath('userData');
const FILES_DIR = path.join(USER_DATA_PATH, 'files');
const METADATA_FILE = path.join(USER_DATA_PATH, 'metadata.txt');

/**
 * Set WebSocket reference for sending messages
 */
export function setWebSocket(websocket: WebSocket): void {
  ws = websocket;
  console.log('[FileSync] WebSocket reference set');
}

/**
 * Initialize file sync system on app startup
 * Creates directories and loads metadata
 */
export async function initFileSync(): Promise<void> {
  console.log('[FileSync] Initializing file sync...');
  console.log('[FileSync] User data path:', USER_DATA_PATH);
  console.log('[FileSync] Files directory:', FILES_DIR);
  
  try {
    // Ensure directories exist
    ensureDirectories();
    
    // Load existing metadata
    localIds = loadLocalIds();
    console.log('[FileSync] Loaded', localIds.size, 'files from metadata');
    
    console.log('[FileSync] ✅ Initialization complete');
  } catch (error) {
    console.error('[FileSync] ❌ Initialization failed:', error);
  }
}

/**
 * Request file sync from server
 * Called after WebSocket registration is confirmed
 */
export function requestFileSync(): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('[FileSync] Cannot request sync - WebSocket not connected');
    return;
  }
  
  console.log('[FileSync] 📤 Requesting file sync...');
  
  try {
    ws.send(JSON.stringify({
      type: 'file_sync_init'
    }));
    console.log('[FileSync] ✅ File sync request sent');
  } catch (error) {
    console.error('[FileSync] ❌ Failed to send sync request:', error);
  }
}

/**
 * Handle file metadata from server
 * Compares with local files and requests signed URLs for missing ones
 */
export async function handleSyncMetadata(files: Array<{id: string, file_name: string}>): Promise<void> {
  if (isSyncing) {
    console.warn('[FileSync] Sync already in progress, ignoring request');
    return;
  }
  
  isSyncing = true;
  console.log('[FileSync] 📥 Received metadata for', files.length, 'files');
  
  try {
    // Extract server IDs
    const serverIds = new Set(files.map(f => f.id));
    console.log('[FileSync] Server has', serverIds.size, 'files');
    console.log('[FileSync] Local has', localIds.size, 'files');
    
    // Find missing files (on server but not local)
    const missingIds: string[] = [];
    serverIds.forEach(id => {
      if (!localIds.has(id)) {
        missingIds.push(id);
      }
    });
    
    // Find orphaned files (local but not on server)
    const orphanedIds: string[] = [];
    localIds.forEach(id => {
      if (!serverIds.has(id)) {
        orphanedIds.push(id);
      }
    });
    
    console.log('[FileSync] Missing:', missingIds.length, 'files');
    console.log('[FileSync] Orphaned:', orphanedIds.length, 'files');
    
    // Delete orphaned files
    if (orphanedIds.length > 0) {
      deleteOrphanedFiles(orphanedIds);
    }
    
    // Request signed URLs for missing files
    if (missingIds.length > 0) {
      requestSignedUrls(missingIds);
    } else {
      console.log('[FileSync] ✅ All files up to date, no downloads needed');
      isSyncing = false;
    }
    
  } catch (error) {
    console.error('[FileSync] ❌ Error handling metadata:', error);
    isSyncing = false;
  }
}

/**
 * Handle signed URLs from server
 * Downloads each file to local storage
 */
export async function handleSignedUrls(files: Array<{id: string, file_name: string, signed_url: string}>): Promise<void> {
  console.log('[FileSync] 📥 Received signed URLs for', files.length, 'files');
  
  const results = {
    synced: [] as string[],
    failed: [] as string[]
  };
  
  // Download each file sequentially
  for (const file of files) {
    try {
      console.log('[FileSync] ⬇️  Downloading:', file.file_name, `(${file.id})`);
      await downloadFile(file.id, file.file_name, file.signed_url);
      
      // Add to local IDs and metadata
      localIds.add(file.id);
      appendToMetadata(file.id);
      results.synced.push(file.id);
      
      console.log('[FileSync] ✅ Downloaded:', file.file_name);
    } catch (error) {
      console.error('[FileSync] ❌ Failed to download', file.file_name, ':', error);
      results.failed.push(file.id);
    }
  }
  
  console.log('[FileSync] Download summary - Success:', results.synced.length, 'Failed:', results.failed.length);
  
  // Mark sync complete
  isSyncing = false;
  console.log('[FileSync] ✅ File sync complete');
}

/**
 * Get files directory path (utility)
 */
export function getFilesDirectory(): string {
  return FILES_DIR;
}

/**
 * Ensure directory structure exists
 */
function ensureDirectories(): void {
  // Create files directory if it doesn't exist
  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
    console.log('[FileSync] Created files directory:', FILES_DIR);
  }
  
  // Create metadata file if it doesn't exist
  if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(METADATA_FILE, '', 'utf-8');
    console.log('[FileSync] Created metadata file:', METADATA_FILE);
  }
}

/**
 * Load file IDs from metadata.txt
 */
function loadLocalIds(): Set<string> {
  try {
    const content = fs.readFileSync(METADATA_FILE, 'utf-8');
    const ids = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    return new Set(ids);
  } catch (error) {
    console.error('[FileSync] Error loading metadata:', error);
    return new Set();
  }
}

/**
 * Append file ID to metadata.txt
 */
function appendToMetadata(id: string): void {
  try {
    fs.appendFileSync(METADATA_FILE, id + '\n', 'utf-8');
  } catch (error) {
    console.error('[FileSync] Error appending to metadata:', error);
  }
}

/**
 * Save all IDs to metadata.txt (used after deletion)
 */
function saveMetadata(ids: Set<string>): void {
  try {
    const content = Array.from(ids).join('\n') + '\n';
    fs.writeFileSync(METADATA_FILE, content, 'utf-8');
  } catch (error) {
    console.error('[FileSync] Error saving metadata:', error);
  }
}

/**
 * Delete orphaned files (local but not on server)
 */
function deleteOrphanedFiles(orphanedIds: string[]): void {
  console.log('[FileSync] 🗑️  Deleting', orphanedIds.length, 'orphaned files...');
  
  for (const id of orphanedIds) {
    try {
      const filePath = path.join(FILES_DIR, id);
      
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log('[FileSync] ✅ Deleted:', id);
      }
      
      // Remove from local IDs
      localIds.delete(id);
      
    } catch (error) {
      console.error('[FileSync] ❌ Failed to delete', id, ':', error);
    }
  }
  
  // Save updated metadata
  saveMetadata(localIds);
  console.log('[FileSync] ✅ Orphaned files deleted');
}

/**
 * Request signed URLs from server
 */
function requestSignedUrls(fileIds: string[]): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('[FileSync] Cannot request URLs - WebSocket not connected');
    isSyncing = false;
    return;
  }
  
  console.log('[FileSync] 📤 Requesting signed URLs for', fileIds.length, 'files...');
  
  try {
    ws.send(JSON.stringify({
      type: 'request_signed_urls',
      file_ids: fileIds
    }));
    console.log('[FileSync] ✅ Signed URL request sent');
  } catch (error) {
    console.error('[FileSync] ❌ Failed to request signed URLs:', error);
    isSyncing = false;
  }
}

/**
 * Download a file from signed URL
 */
function downloadFile(id: string, fileName: string, signedUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Debug: Log the actual URL we're trying to download from
      console.log('[FileSync] 🔗 Signed URL:', signedUrl);
      
      // Create directory for this file
      const fileDir = path.join(FILES_DIR, id);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      const filePath = path.join(fileDir, fileName);
      console.log('[FileSync] 💾 Saving file to:', filePath);
      
      const fileStream = fs.createWriteStream(filePath);
      
      // Download via HTTPS
      https.get(signedUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        
        fileStream.on('error', (error) => {
          try {
            fs.unlinkSync(filePath); // Delete partial file
          } catch (unlinkError) {
            // File might not exist yet, ignore
          }
          reject(error);
        });
        
      }).on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

