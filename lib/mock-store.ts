import { ImageData, Tag } from '@/types';
import { MOCK_IMAGES, MOCK_TAGS } from './mock-data';

type MockState = { images: ImageData[]; tags: Tag[] };
type ImagesListener = (images: ImageData[]) => void;
type TagsListener = (tags: Tag[]) => void;

const STORAGE_KEY = 'goodcase-mock-data-v2';
const imageListeners = new Set<ImagesListener>();
const tagListeners = new Set<TagsListener>();
let memoryState: MockState | null = null;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const seedState = (): MockState => ({
  images: clone(MOCK_IMAGES),
  tags: clone(MOCK_TAGS),
});

const readState = (): MockState => {
  if (memoryState) return memoryState;

  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) memoryState = JSON.parse(saved) as MockState;
    } catch (error) {
      console.warn('读取本地 mock 数据失败，将使用初始数据:', error);
    }
  }

  memoryState ||= seedState();
  return memoryState;
};

const allTags = (state: MockState): Tag[] => {
  const usage = new Map<string, number>();
  state.images.forEach(image => image.tags.forEach(item => {
    usage.set(item.id, (usage.get(item.id) || 0) + 1);
  }));

  return state.tags
    .map(item => ({ ...item, usageCount: usage.get(item.id) || 0 }))
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
};

const persistAndNotify = () => {
  const state = readState();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('保存本地 mock 数据失败，当前会话仍可继续使用:', error);
    }
  }
  imageListeners.forEach(listener => listener(clone(state.images)));
  const tags = allTags(state);
  tagListeners.forEach(listener => listener(clone(tags)));
};

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error || new Error('读取图片失败'));
  reader.readAsDataURL(file);
});

export const MockStore = {
  subscribeToImages(listener: ImagesListener) {
    imageListeners.add(listener);
    queueMicrotask(() => listener(clone(readState().images)));
    return () => imageListeners.delete(listener);
  },

  subscribeToTags(listener: TagsListener) {
    tagListeners.add(listener);
    queueMicrotask(() => listener(clone(allTags(readState()))));
    return () => tagListeners.delete(listener);
  },

  subscribeToImage(id: string, listener: (image: ImageData | null) => void) {
    const relay = (images: ImageData[]) => listener(images.find(image => image.id === id) || null);
    return this.subscribeToImages(relay);
  },

  async getAllImages() {
    return clone(readState().images);
  },

  async getAllTags() {
    return clone(allTags(readState()));
  },

  async getImageById(id: string) {
    return clone(readState().images.find(image => image.id === id) || null);
  },

  async addImage(file: File, title: string, tagNames: string): Promise<ImageData> {
    const state = readState();
    const now = new Date().toISOString();
    const names = tagNames.split(',').map(name => name.trim()).filter(Boolean);
    const tags = names.map(name => {
      const existing = state.tags.find(item => item.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
      const created = { id: `mock-tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, color: 'slate' };
      state.tags.push(created);
      return created;
    });
    const image: ImageData = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: await fileToDataUrl(file),
      title,
      prompts: [{ id: `prompt-${Date.now()}`, title, content: title, color: 'slate', order: 0 }],
      tags: clone(tags),
      createdAt: now,
      updatedAt: now,
      isLocal: true,
    };
    state.images.unshift(image);
    persistAndNotify();
    return clone(image);
  },

  async updateImage(id: string, updates: Partial<ImageData>) {
    const state = readState();
    const index = state.images.findIndex(image => image.id === id);
    if (index < 0) return null;
    state.images[index] = {
      ...state.images[index],
      ...clone(updates),
      id,
      updatedAt: new Date().toISOString(),
    };
    persistAndNotify();
    return clone(state.images[index]);
  },

  async deleteImage(id: string) {
    const state = readState();
    const before = state.images.length;
    state.images = state.images.filter(image => image.id !== id);
    if (state.images.length === before) return false;
    persistAndNotify();
    return true;
  },

  async addTag(tagData: Omit<Tag, 'id'>) {
    const state = readState();
    const existing = state.tags.find(item => item.name.toLowerCase() === tagData.name.toLowerCase());
    if (existing) return clone(existing);
    const created: Tag = { ...tagData, id: `mock-tag-${Date.now()}` };
    state.tags.push(created);
    persistAndNotify();
    return clone(created);
  },

  async deleteTag(id: string) {
    const state = readState();
    state.tags = state.tags.filter(tag => tag.id !== id);
    state.images = state.images.map(image => ({
      ...image,
      tags: image.tags.filter(tag => tag.id !== id),
    }));
    persistAndNotify();
    return true;
  },

  reset() {
    memoryState = seedState();
    persistAndNotify();
  },
};
