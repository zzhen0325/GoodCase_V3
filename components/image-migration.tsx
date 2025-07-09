"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToastContext } from '@/components/toast-provider';

interface MigrationStats {
  total: number;
  webp: number;
  jpeg: number;
  png: number;
  gif: number;
  other: number;
  invalid: number;
}

interface MigrationResult {
  success: boolean;
  dryRun: boolean;
  stats: {
    total: number;
    needsMigration: number;
    migrated: number;
    failed: number;
    sizeBefore: number;
    sizeAfter: number;
    compressionRatio: string;
    sizeSaved: number;
    errors: string[];
  };
}

export function ImageMigration() {
  const { toast } = useToastContext();
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  // 获取当前图片格式统计
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/migrate-images');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.stats);
      } else {
        toast.error('获取统计信息失败');
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
      toast.error('获取统计信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 执行迁移（预览模式）
  const previewMigration = async () => {
    setIsMigrating(true);
    const toastId = toast.loading('分析中...', '正在分析需要迁移的图片');
    
    try {
      const response = await fetch('/api/migrate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: true }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMigrationResult(result);
        toast.resolve(toastId, '分析完成', `发现 ${result.stats.needsMigration} 张图片需要迁移`);
      } else {
        toast.reject(toastId, '分析失败', result.error);
      }
    } catch (error) {
      console.error('分析失败:', error);
      toast.reject(toastId, '分析失败', '请稍后重试');
    } finally {
      setIsMigrating(false);
    }
  };

  // 执行实际迁移
  const executeMigration = async () => {
    setIsMigrating(true);
    const toastId = toast.loading('迁移中...', '正在转换图片格式，请稍候');
    
    try {
      const response = await fetch('/api/migrate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: false }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMigrationResult(result);
        toast.resolve(toastId, '迁移完成', `成功转换 ${result.stats.migrated} 张图片`);
        // 刷新统计信息
        fetchStats();
      } else {
        toast.reject(toastId, '迁移失败', result.error);
      }
    } catch (error) {
      console.error('迁移失败:', error);
      toast.reject(toastId, '迁移失败', '请稍后重试');
    } finally {
      setIsMigrating(false);
    }
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">图片格式迁移</h2>
        <Button onClick={fetchStats} disabled={isLoading}>
          {isLoading ? '刷新中...' : '刷新统计'}
        </Button>
      </div>

      {/* 当前格式统计 */}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">当前图片格式分布</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.webp}</div>
              <div className="text-sm text-muted-foreground">WebP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.jpeg}</div>
              <div className="text-sm text-muted-foreground">JPEG</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.png}</div>
              <div className="text-sm text-muted-foreground">PNG</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.gif}</div>
              <div className="text-sm text-muted-foreground">GIF</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.other}</div>
              <div className="text-sm text-muted-foreground">其他</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
              <div className="text-sm text-muted-foreground">无效</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">总图片数</div>
            </div>
          </div>
        </Card>
      )}

      {/* 迁移操作 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">迁移操作</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={previewMigration} 
              disabled={isMigrating || !stats}
              variant="outline"
            >
              {isMigrating ? '分析中...' : '预览迁移'}
            </Button>
            <Button 
              onClick={executeMigration} 
              disabled={isMigrating || !migrationResult || migrationResult.stats.needsMigration === 0}
            >
              {isMigrating ? '迁移中...' : '执行迁移'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            建议先执行"预览迁移"查看迁移效果，确认无误后再执行实际迁移。
          </p>
        </div>
      </Card>

      {/* 迁移结果 */}
      {migrationResult && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {migrationResult.dryRun ? '迁移预览结果' : '迁移执行结果'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{migrationResult.stats.needsMigration}</div>
              <div className="text-sm text-muted-foreground">需要迁移</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{migrationResult.stats.migrated}</div>
              <div className="text-sm text-muted-foreground">已迁移</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{migrationResult.stats.failed}</div>
              <div className="text-sm text-muted-foreground">失败</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{migrationResult.stats.compressionRatio}</div>
              <div className="text-sm text-muted-foreground">压缩率</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-lg font-semibold">{formatSize(migrationResult.stats.sizeBefore)}</div>
              <div className="text-sm text-muted-foreground">迁移前大小</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-lg font-semibold">{formatSize(migrationResult.stats.sizeAfter)}</div>
              <div className="text-sm text-muted-foreground">迁移后大小</div>
            </div>
          </div>
          
          {migrationResult.stats.sizeSaved > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-700">
                  节省空间: {formatSize(migrationResult.stats.sizeSaved)}
                </div>
              </div>
            </div>
          )}
          
          {migrationResult.stats.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-red-600 mb-2">错误信息:</h4>
              <div className="space-y-1">
                {migrationResult.stats.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}