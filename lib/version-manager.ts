/**
 * 数据库版本管理器
 * 统一管理 IndexedDB、数据导出和文档版本
 */

export interface VersionInfo {
  indexedDB: number;
  dataExport: string;
  documentation: string;
  lastUpdated: string;
}

export class VersionManager {
  // 当前版本信息
  public static readonly CURRENT_VERSIONS: VersionInfo = {
    indexedDB: 6,
    dataExport: '2.1',
    documentation: 'v1.1',
    lastUpdated: '2024-12-19'
  };

  // 版本历史记录
  public static readonly VERSION_HISTORY = [
    {
      version: 'v1.0',
      date: '2024-12-18',
      changes: [
        '初始数据库设计',
        '基础集合结构',
        '实时监听功能',
        '数据导入导出'
      ],
      indexedDB: 5,
      dataExport: '2.0'
    },
    {
      version: 'v1.1',
      date: '2024-12-19',
      changes: [
        '数据库版本管理优化',
        'IndexedDB schema 升级 (v6)',
        '数据导出格式升级 (v2.1)',
        '版本兼容性检查',
        '新增 updatedAt 和 usageCount 索引'
      ],
      indexedDB: 6,
      dataExport: '2.1'
    }
  ];

  /**
   * 获取当前版本信息
   */
  public static getCurrentVersions(): VersionInfo {
    return this.CURRENT_VERSIONS;
  }

  /**
   * 检查版本兼容性
   */
  public static checkCompatibility(clientVersion: number): {
    compatible: boolean;
    needsUpgrade: boolean;
    message: string;
  } {
    const currentVersion = this.CURRENT_VERSIONS.indexedDB;
    
    if (clientVersion > currentVersion) {
      return {
        compatible: false,
        needsUpgrade: false,
        message: `客户端版本 ${clientVersion} 高于当前支持版本 ${currentVersion}，请更新应用`
      };
    }
    
    if (clientVersion < currentVersion) {
      return {
        compatible: true,
        needsUpgrade: true,
        message: `数据库将从版本 ${clientVersion} 升级到 ${currentVersion}`
      };
    }
    
    return {
      compatible: true,
      needsUpgrade: false,
      message: `数据库版本 ${currentVersion} 已是最新`
    };
  }

  /**
   * 获取版本历史
   */
  public static getVersionHistory() {
    return this.VERSION_HISTORY;
  }

  /**
   * 记录版本升级日志
   */
  public static logVersionUpgrade(fromVersion: number, toVersion: number) {
    const timestamp = new Date().toISOString();
    console.log(`📊 数据库版本升级记录:`);
    console.log(`   时间: ${timestamp}`);
    console.log(`   从版本: ${fromVersion}`);
    console.log(`   到版本: ${toVersion}`);
    console.log(`   状态: 升级完成`);
    
    // 在生产环境中，这里可以发送到监控系统
    if (typeof window !== 'undefined' && window.localStorage) {
      const upgradeLog = {
        timestamp,
        fromVersion,
        toVersion,
        status: 'completed'
      };
      
      try {
        const existingLogs = JSON.parse(
          localStorage.getItem('db_upgrade_logs') || '[]'
        );
        existingLogs.push(upgradeLog);
        
        // 只保留最近10次升级记录
        if (existingLogs.length > 10) {
          existingLogs.splice(0, existingLogs.length - 10);
        }
        
        localStorage.setItem('db_upgrade_logs', JSON.stringify(existingLogs));
      } catch (error) {
        console.warn('无法保存升级日志到 localStorage:', error);
      }
    }
  }

  /**
   * 获取升级日志
   */
  public static getUpgradeLogs(): Array<{
    timestamp: string;
    fromVersion: number;
    toVersion: number;
    status: string;
  }> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    
    try {
      return JSON.parse(localStorage.getItem('db_upgrade_logs') || '[]');
    } catch (error) {
      console.warn('无法读取升级日志:', error);
      return [];
    }
  }

  /**
   * 生成版本报告
   */
  public static generateVersionReport(): string {
    const versions = this.getCurrentVersions();
    const history = this.getVersionHistory();
    const upgradeLogs = this.getUpgradeLogs();
    
    return `
# 数据库版本报告

## 当前版本
- IndexedDB: v${versions.indexedDB}
- 数据导出: v${versions.dataExport}
- 文档版本: ${versions.documentation}
- 最后更新: ${versions.lastUpdated}

## 版本历史
${history.map(v => `
### ${v.version} (${v.date})
${v.changes.map(c => `- ${c}`).join('\n')}`).join('\n')}

## 升级记录
${upgradeLogs.length > 0 ? 
  upgradeLogs.map(log => 
    `- ${log.timestamp}: v${log.fromVersion} → v${log.toVersion} (${log.status})`
  ).join('\n') : 
  '暂无升级记录'
}
    `.trim();
  }
}