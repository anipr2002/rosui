import Dexie, { Table } from 'dexie';

/**
 * Cached MCAP file metadata and blob
 * Used for temporary storage of files downloaded from S3
 */
export interface CachedFile {
  id?: number;
  s3Key: string;
  fileName: string;
  fileSize: number;
  blob: Blob;
  cachedAt: number;
  lastAccessedAt: number;
}

/**
 * Database for temporary MCAP file caching
 * Files are cached when loaded from S3 for visualization
 * and automatically cleaned up when no longer needed
 */
class RosbagCacheDatabase extends Dexie {
  cachedFiles!: Table<CachedFile, number>;

  constructor() {
    super('RosbagCacheDB');

    this.version(1).stores({
      cachedFiles: '++id, s3Key, fileName, cachedAt, lastAccessedAt',
    });
  }

  /**
   * Cache a file downloaded from S3
   */
  async cacheFile(
    s3Key: string,
    fileName: string,
    blob: Blob
  ): Promise<number> {
    const now = Date.now();
    
    // Check if file already exists
    const existing = await this.cachedFiles
      .where('s3Key')
      .equals(s3Key)
      .first();

    if (existing) {
      // Update existing cache entry
      await this.cachedFiles.update(existing.id!, {
        blob,
        fileSize: blob.size,
        lastAccessedAt: now,
      });
      return existing.id!;
    }

    // Create new cache entry
    return await this.cachedFiles.add({
      s3Key,
      fileName,
      fileSize: blob.size,
      blob,
      cachedAt: now,
      lastAccessedAt: now,
    });
  }

  /**
   * Get a cached file by S3 key
   */
  async getCachedFile(s3Key: string): Promise<CachedFile | undefined> {
    const file = await this.cachedFiles.where('s3Key').equals(s3Key).first();
    
    if (file) {
      // Update last accessed time
      await this.cachedFiles.update(file.id!, {
        lastAccessedAt: Date.now(),
      });
    }
    
    return file;
  }

  /**
   * Remove a cached file by S3 key
   */
  async removeCachedFile(s3Key: string): Promise<void> {
    await this.cachedFiles.where('s3Key').equals(s3Key).delete();
  }

  /**
   * Clear old cached files older than maxAgeMs
   * Default: 24 hours
   */
  async clearOldCache(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffTime = Date.now() - maxAgeMs;
    return await this.cachedFiles
      .where('lastAccessedAt')
      .below(cutoffTime)
      .delete();
  }

  /**
   * Get total storage used by cached files
   */
  async getStorageUsage(): Promise<{
    totalFiles: number;
    totalBytes: number;
    files: Array<{ s3Key: string; fileName: string; fileSize: number; cachedAt: number }>;
  }> {
    const files = await this.cachedFiles.toArray();
    const totalBytes = files.reduce((sum, f) => sum + f.fileSize, 0);

    return {
      totalFiles: files.length,
      totalBytes,
      files: files.map((f) => ({
        s3Key: f.s3Key,
        fileName: f.fileName,
        fileSize: f.fileSize,
        cachedAt: f.cachedAt,
      })),
    };
  }

  /**
   * Clear all cached files
   */
  async clearAll(): Promise<void> {
    await this.cachedFiles.clear();
  }

  /**
   * Check if a file is cached
   */
  async isCached(s3Key: string): Promise<boolean> {
    const count = await this.cachedFiles.where('s3Key').equals(s3Key).count();
    return count > 0;
  }
}

// Export singleton instance
export const rosbagCacheDB = new RosbagCacheDatabase();
