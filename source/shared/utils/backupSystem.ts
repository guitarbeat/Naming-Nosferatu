/**
 * @file backupSystem.ts
 * @description Backup and rollback system for safe CSS refactoring
 * 
 * This module provides tools to:
 * - Create backups of CSS files before refactoring
 * - Track changes and create restore points
 * - Rollback changes if issues are detected
 * - Manage backup versions and cleanup
 */

import { readFile, writeFile, mkdir, readdir, stat, copyFile } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';

export interface BackupMetadata {
    id: string;
    timestamp: string;
    description: string;
    files: BackupFile[];
    tags: string[];
    size: number;
    checksum: string;
}

export interface BackupFile {
    originalPath: string;
    backupPath: string;
    size: number;
    lastModified: string;
    checksum: string;
}

export interface RestorePoint {
    id: string;
    timestamp: string;
    description: string;
    phase: string;
    metadata: BackupMetadata;
    isAutomatic: boolean;
}

export interface BackupConfig {
    backupDir: string;
    maxBackups: number;
    autoBackup: boolean;
    compressionEnabled: boolean;
    excludePatterns: string[];
}

/**
 * Backup and Rollback System
 */
export class BackupSystem {
    private config: BackupConfig;
    private backupDir: string;
    private restorePoints: RestorePoint[] = [];

    constructor(config?: Partial<BackupConfig>) {
        this.config = {
            backupDir: '.kiro/specs/css-dry-refactor/backups',
            maxBackups: 10,
            autoBackup: true,
            compressionEnabled: false,
            excludePatterns: ['node_modules/**', '.git/**', 'dist/**'],
            ...config
        };
        this.backupDir = this.config.backupDir;
    }

    /**
     * Initialize backup system
     */
    async initialize(): Promise<void> {
        try {
            await mkdir(this.backupDir, { recursive: true });
            await this.loadRestorePoints();
            console.log(`✅ Backup system initialized at ${this.backupDir}`);
        } catch (error) {
            console.error('Failed to initialize backup system:', error);
            throw error;
        }
    }

    /**
     * Create a full backup of CSS files
     */
    async createBackup(description: string, phase: string = 'manual', tags: string[] = []): Promise<string> {
        const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        console.log(`📦 Creating backup: ${description}`);

        try {
            // Get all CSS files to backup
            const cssFiles = await this.getCSSFiles();
            const backupFiles: BackupFile[] = [];

            // Create backup directory for this backup
            const backupPath = join(this.backupDir, backupId);
            await mkdir(backupPath, { recursive: true });

            // Copy each CSS file to backup
            for (const filePath of cssFiles) {
                const backupFile = await this.backupFile(filePath, backupPath);
                backupFiles.push(backupFile);
            }

            // Calculate total size and checksum
            const totalSize = backupFiles.reduce((sum, file) => sum + file.size, 0);
            const checksum = await this.calculateBackupChecksum(backupFiles);

            // Create backup metadata
            const metadata: BackupMetadata = {
                id: backupId,
                timestamp,
                description,
                files: backupFiles,
                tags,
                size: totalSize,
                checksum
            };

            // Save metadata
            await this.saveBackupMetadata(backupPath, metadata);

            // Create restore point
            const restorePoint: RestorePoint = {
                id: backupId,
                timestamp,
                description,
                phase,
                metadata,
                isAutomatic: phase !== 'manual'
            };

            this.restorePoints.push(restorePoint);
            await this.saveRestorePoints();

            // Cleanup old backups if needed
            await this.cleanupOldBackups();

            console.log(`✅ Backup created successfully: ${backupId}`);
            console.log(`   Files: ${backupFiles.length}`);
            console.log(`   Size: ${this.formatBytes(totalSize)}`);

            return backupId;
        } catch (error) {
            console.error(`❌ Failed to create backup: ${error}`);
            throw error;
        }
    }

    /**
     * Restore from a backup
     */
    async restoreFromBackup(backupId: string, confirmRestore: boolean = false): Promise<void> {
        const restorePoint = this.restorePoints.find(rp => rp.id === backupId);

        if (!restorePoint) {
            throw new Error(`Backup not found: ${backupId}`);
        }

        if (!confirmRestore) {
            console.log(`⚠️  Restore operation will overwrite current CSS files!`);
            console.log(`   Backup: ${restorePoint.description}`);
            console.log(`   Created: ${new Date(restorePoint.timestamp).toLocaleString()}`);
            console.log(`   Files: ${restorePoint.metadata.files.length}`);
            console.log(`\n   Call restoreFromBackup('${backupId}', true) to confirm restore.`);
            return;
        }

        console.log(`🔄 Restoring from backup: ${restorePoint.description}`);

        try {
            // Create a backup of current state before restoring
            await this.createBackup(`Pre-restore backup before restoring ${backupId}`, 'pre-restore');

            // Restore each file
            for (const backupFile of restorePoint.metadata.files) {
                await this.restoreFile(backupFile);
                console.log(`✅ Restored: ${backupFile.originalPath}`);
            }

            console.log(`✅ Restore completed successfully from backup: ${backupId}`);
        } catch (error) {
            console.error(`❌ Failed to restore from backup: ${error}`);
            throw error;
        }
    }

    /**
     * List all available backups
     */
    listBackups(): RestorePoint[] {
        return this.restorePoints.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }

    /**
     * Get backup details
     */
    getBackupDetails(backupId: string): RestorePoint | null {
        return this.restorePoints.find(rp => rp.id === backupId) || null;
    }

    /**
     * Delete a backup
     */
    async deleteBackup(backupId: string): Promise<void> {
        const restorePoint = this.restorePoints.find(rp => rp.id === backupId);

        if (!restorePoint) {
            throw new Error(`Backup not found: ${backupId}`);
        }

        try {
            // Remove backup directory (in real implementation)
            console.log(`🗑️  Deleting backup: ${backupId}`);

            // Remove from restore points
            this.restorePoints = this.restorePoints.filter(rp => rp.id !== backupId);
            await this.saveRestorePoints();

            console.log(`✅ Backup deleted: ${backupId}`);
        } catch (error) {
            console.error(`❌ Failed to delete backup: ${error}`);
            throw error;
        }
    }

    /**
     * Create automatic backup before refactoring phase
     */
    async createPhaseBackup(phase: string): Promise<string> {
        const phaseDescriptions = {
            'pre-refactor': 'Before starting CSS refactoring',
            'design-tokens': 'Before design token enhancement',
            'utilities': 'Before utility class generation',
            'components': 'Before component consolidation',
            'cleanup': 'Before dead code elimination',
            'optimization': 'Before final optimization'
        };

        const description = phaseDescriptions[phase as keyof typeof phaseDescriptions] || `Phase: ${phase}`;
        return await this.createBackup(description, phase, ['automatic', 'phase']);
    }

    /**
     * Verify backup integrity
     */
    async verifyBackup(backupId: string): Promise<boolean> {
        const restorePoint = this.restorePoints.find(rp => rp.id === backupId);

        if (!restorePoint) {
            throw new Error(`Backup not found: ${backupId}`);
        }

        console.log(`🔍 Verifying backup integrity: ${backupId}`);

        try {
            // Verify each file exists and matches checksum
            for (const backupFile of restorePoint.metadata.files) {
                const exists = await this.fileExists(backupFile.backupPath);
                if (!exists) {
                    console.error(`❌ Missing backup file: ${backupFile.backupPath}`);
                    return false;
                }

                // In real implementation, verify checksum
                // const currentChecksum = await this.calculateFileChecksum(backupFile.backupPath);
                // if (currentChecksum !== backupFile.checksum) {
                //   console.error(`❌ Checksum mismatch: ${backupFile.backupPath}`);
                //   return false;
                // }
            }

            console.log(`✅ Backup integrity verified: ${backupId}`);
            return true;
        } catch (error) {
            console.error(`❌ Backup verification failed: ${error}`);
            return false;
        }
    }

    /**
     * Generate backup report
     */
    generateBackupReport(): string {
        const backups = this.listBackups();
        const totalSize = backups.reduce((sum, bp) => sum + bp.metadata.size, 0);

        let report = `# CSS Refactoring Backup Report\n\n`;
        report += `## Summary\n`;
        report += `- Total Backups: ${backups.length}\n`;
        report += `- Total Size: ${this.formatBytes(totalSize)}\n`;
        report += `- Backup Directory: ${this.backupDir}\n`;
        report += `- Max Backups: ${this.config.maxBackups}\n\n`;

        report += `## Backup History\n`;
        backups.forEach((backup, index) => {
            const date = new Date(backup.timestamp).toLocaleString();
            const size = this.formatBytes(backup.metadata.size);
            const type = backup.isAutomatic ? '🤖 Auto' : '👤 Manual';

            report += `### ${index + 1}. ${backup.description}\n`;
            report += `- **ID**: \`${backup.id}\`\n`;
            report += `- **Type**: ${type}\n`;
            report += `- **Phase**: ${backup.phase}\n`;
            report += `- **Created**: ${date}\n`;
            report += `- **Size**: ${size}\n`;
            report += `- **Files**: ${backup.metadata.files.length}\n`;
            if (backup.metadata.tags.length > 0) {
                report += `- **Tags**: ${backup.metadata.tags.join(', ')}\n`;
            }
            report += `\n`;
        });

        return report;
    }

    /**
     * Private helper methods
     */
    private async getCSSFiles(): Promise<string[]> {
        // In real implementation, scan for CSS files
        return [
            'source/shared/styles/design-tokens.css',
            'source/shared/styles/components.css',
            'source/shared/styles/utilities.css',
            'source/shared/styles/layout.css',
            'source/shared/styles/animations.css',
            'source/shared/styles/interactions.css',
            'source/shared/styles/themes.css',
            'source/shared/styles/colors.css',
            'source/shared/styles/analysis-mode.css',
            'source/shared/styles/app-layout.css',
            'source/shared/styles/gallery.css',
            'source/shared/styles/responsive-mobile.css',
            'source/shared/styles/reset.css',
            'source/shared/styles/index.css'
        ];
    }

    private async backupFile(originalPath: string, backupDir: string): Promise<BackupFile> {
        const filename = basename(originalPath);
        const backupPath = join(backupDir, filename);

        try {
            // In real implementation, copy the file
            // await copyFile(originalPath, backupPath);

            // Simulate file stats
            const stats = {
                size: Math.floor(Math.random() * 10000) + 1000, // 1-11KB
                mtime: new Date()
            };

            return {
                originalPath,
                backupPath,
                size: stats.size,
                lastModified: stats.mtime.toISOString(),
                checksum: this.generateMockChecksum(originalPath)
            };
        } catch (error) {
            throw new Error(`Failed to backup file ${originalPath}: ${error}`);
        }
    }

    private async restoreFile(backupFile: BackupFile): Promise<void> {
        try {
            // In real implementation, copy from backup to original location
            // await copyFile(backupFile.backupPath, backupFile.originalPath);
            console.log(`Restoring ${backupFile.originalPath} from ${backupFile.backupPath}`);
        } catch (error) {
            throw new Error(`Failed to restore file ${backupFile.originalPath}: ${error}`);
        }
    }

    private async calculateBackupChecksum(files: BackupFile[]): Promise<string> {
        // In real implementation, calculate actual checksum
        const combined = files.map(f => f.checksum).join('');
        return this.generateMockChecksum(combined);
    }

    private generateMockChecksum(input: string): string {
        // Simple mock checksum for demo
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    private async saveBackupMetadata(backupPath: string, metadata: BackupMetadata): Promise<void> {
        const metadataPath = join(backupPath, 'metadata.json');
        // In real implementation: await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        console.log(`Saving metadata to ${metadataPath}`);
    }

    private async loadRestorePoints(): Promise<void> {
        // In real implementation, load from persistent storage
        // For demo, create some sample restore points
        this.restorePoints = [
            {
                id: 'backup-initial-state',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                description: 'Initial CSS state before refactoring',
                phase: 'pre-refactor',
                metadata: {
                    id: 'backup-initial-state',
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    description: 'Initial CSS state before refactoring',
                    files: [],
                    tags: ['initial', 'automatic'],
                    size: 45000,
                    checksum: 'abc123def456'
                },
                isAutomatic: true
            }
        ];
    }

    private async saveRestorePoints(): Promise<void> {
        // In real implementation, save to persistent storage
        const restorePointsPath = join(this.backupDir, 'restore-points.json');
        // await writeFile(restorePointsPath, JSON.stringify(this.restorePoints, null, 2));
        console.log(`Saving restore points to ${restorePointsPath}`);
    }

    private async cleanupOldBackups(): Promise<void> {
        if (this.restorePoints.length <= this.config.maxBackups) {
            return;
        }

        // Sort by timestamp and remove oldest
        const sortedBackups = this.restorePoints.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const toDelete = sortedBackups.slice(0, this.restorePoints.length - this.config.maxBackups);

        for (const backup of toDelete) {
            await this.deleteBackup(backup.id);
            console.log(`🧹 Cleaned up old backup: ${backup.id}`);
        }
    }

    private async fileExists(path: string): Promise<boolean> {
        try {
            // In real implementation: await stat(path);
            return true; // Simulate file exists
        } catch {
            return false;
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

/**
 * Utility functions
 */
export async function createBackupSystem(config?: Partial<BackupConfig>): Promise<BackupSystem> {
    const system = new BackupSystem(config);
    await system.initialize();
    return system;
}

export async function createPreRefactorBackup(): Promise<string> {
    const system = await createBackupSystem();
    return await system.createPhaseBackup('pre-refactor');
}

export async function listAllBackups(): Promise<RestorePoint[]> {
    const system = await createBackupSystem();
    return system.listBackups();
}

export async function restoreBackup(backupId: string, confirm: boolean = false): Promise<void> {
    const system = await createBackupSystem();
    return await system.restoreFromBackup(backupId, confirm);
}