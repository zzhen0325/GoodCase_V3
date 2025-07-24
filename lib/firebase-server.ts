// 此文件已被弃用，请使用 firebase-admin.ts
// 为了保持向后兼容性，重新导出 firebase-admin.ts 的功能

import getApp, { getAdminDb, getAdminStorage } from './firebase-admin';

// 重新导出以保持向后兼容
export const getServerFirebase = async () => {
  return {
    app: getApp(),
    db: getAdminDb(),
    storage: getAdminStorage(),
  };
};

// 标记为已弃用
/** @deprecated 请使用 firebase-admin.ts 中的 getApp, getAdminDb, getAdminStorage */
export const firebaseManager = {
  getServerFirebase,
};

export default firebaseManager;
