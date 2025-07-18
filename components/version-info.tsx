'use client';

import { useEffect, useState } from 'react';
import { VersionManager, VersionInfo } from '@/lib/version-manager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Info, Database, FileText, Clock } from 'lucide-react';

interface VersionInfoProps {
  showInDev?: boolean;
}

/**
 * 版本信息组件
 * 显示当前数据库版本信息和升级历史
 */
export function VersionInfoComponent({ showInDev = true }: VersionInfoProps) {
  const [versions, setVersions] = useState<VersionInfo | null>(null);
  const [upgradeLogs, setUpgradeLogs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 获取版本信息
    const currentVersions = VersionManager.getCurrentVersions();
    setVersions(currentVersions);

    // 获取升级日志
    const logs = VersionManager.getUpgradeLogs();
    setUpgradeLogs(logs);
  }, []);

  // 在生产环境中隐藏（除非明确要求显示）
  if (process.env.NODE_ENV === 'production' && showInDev) {
    return null;
  }

  if (!versions) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="fixed bottom-4 right-4 z-50 opacity-60 hover:opacity-100 transition-opacity"
        >
          <Info className="h-4 w-4 mr-1" />
          v{versions.documentation}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据库版本信息
          </DialogTitle>
          <DialogDescription>
            当前系统的数据库版本和升级历史记录
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 当前版本信息 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              当前版本
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">IndexedDB:</span>
                  <Badge variant="secondary">v{versions.indexedDB}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">数据导出:</span>
                  <Badge variant="secondary">v{versions.dataExport}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">文档版本:</span>
                  <Badge variant="secondary">{versions.documentation}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">最后更新:</span>
                  <span className="text-sm">{versions.lastUpdated}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 版本历史 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              版本历史
            </h3>
            <div className="space-y-3">
              {VersionManager.getVersionHistory().map((version, index) => (
                <div key={version.version} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        {version.version}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {version.date}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        DB v{version.indexedDB}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Export v{version.dataExport}
                      </Badge>
                    </div>
                  </div>
                  <ul className="text-sm space-y-1">
                    {version.changes.map((change, changeIndex) => (
                      <li key={changeIndex} className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 升级日志 */}
          {upgradeLogs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">升级日志</h3>
              <div className="space-y-2">
                {upgradeLogs.slice(-5).reverse().map((log, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <span>
                      v{log.fromVersion} → v{log.toVersion}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}