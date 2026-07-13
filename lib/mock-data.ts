import { ImageData, Tag } from '@/types';

const now = new Date();
const date = (daysAgo: number) =>
  new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

const tag = (id: string, name: string, color: string): Tag => ({ id, name, color });

export const MOCK_TAGS: Tag[] = [
  tag('tag-editorial', 'Editorial', 'slate'),
  tag('tag-product', 'Photography', 'amber'),
  tag('tag-3d', '3D', 'violet'),
  tag('tag-minimal', 'Character', 'sky'),
  tag('tag-branding', 'Illustration', 'fuchsia'),
  tag('tag-nature', 'Lifestyle', 'green'),
  tag('tag-portrait', 'Portrait', 'cyan'),
  tag('tag-architecture', 'Product', 'lime'),
];

const findTag = (id: string) => MOCK_TAGS.find(item => item.id === id)!;

const prompt = (id: string, title: string, content: string, color: string, order: number) => ({
  id,
  title,
  content,
  color,
  order,
});

const createImage = (
  id: string,
  title: string,
  url: string,
  tagIds: string[],
  prompts: ReturnType<typeof prompt>[],
  daysAgo: number,
): ImageData => ({
  id,
  title,
  url,
  tags: tagIds.map(findTag),
  prompts,
  createdAt: date(daysAgo),
  updatedAt: date(daysAgo),
  usageCount: Math.max(1, 20 - daysAgo),
});

export const MOCK_IMAGES: ImageData[] = [
  createImage('mock-01', '草原上的宇航员', '/mock-images/01-astronaut-day.png', ['tag-editorial', 'tag-branding'], [
    prompt('p-01-a', '场景', 'An astronaut working on a vintage computer in a vast green meadow', 'green', 0),
    prompt('p-01-b', '风格', 'retro science fiction illustration, quiet surreal atmosphere, wide composition', 'slate', 1),
  ], 0),
  createImage('mock-02', '午夜访客', '/mock-images/02-astronaut-night.png', ['tag-editorial', 'tag-product'], [
    prompt('p-02-a', '场景', 'A lone astronaut beside a smiling vintage computer and a white horse at night', 'violet', 0),
    prompt('p-02-b', '灯光', 'cinematic moonlight, dark emerald grass, subtle film grain', 'cyan', 1),
  ], 1),
  createImage('mock-03', '夏日老顽童', '/mock-images/03-cool-santa.png', ['tag-portrait', 'tag-branding'], [
    prompt('p-03-a', '人物', 'Close-up portrait of a stylish white-bearded man wearing orange sunglasses', 'amber', 0),
    prompt('p-03-b', '风格', 'colorful editorial illustration, vibrant cyan and coral palette, textured finish', 'fuchsia', 1),
  ], 2),
  createImage('mock-04', '寿司主厨', '/mock-images/04-sushi-character.png', ['tag-3d', 'tag-minimal'], [
    prompt('p-04-a', '角色', 'A friendly yellow mascot preparing sushi behind a warm wooden counter', 'amber', 0),
    prompt('p-04-b', '渲染', 'playful 3D character, cozy Japanese restaurant, cinematic detail', 'violet', 1),
  ], 3),
  createImage('mock-05', '老城晴日', '/mock-images/05-city-photo.png', ['tag-product', 'tag-nature'], [
    prompt('p-05-a', '场景', 'Dense old residential buildings under a bright patterned sky', 'sky', 0),
    prompt('p-05-b', '镜头', 'documentary street photography, wide angle, natural daylight', 'slate', 1),
  ], 4),
  createImage('mock-06', '等待回答', '/mock-images/06-cartoon-portrait.png', ['tag-3d', 'tag-portrait'], [
    prompt('p-06-a', '人物', 'A worried stylized office character sitting with hands clasped', 'sky', 0),
    prompt('p-06-b', '渲染', 'soft 3D animation style, clean studio background, expressive face', 'violet', 1),
  ], 5),
  createImage('mock-07', '相机新人', '/mock-images/07-photographer.webp', ['tag-portrait', 'tag-product'], [
    prompt('p-07-a', '人像', 'Studio portrait of a young photographer holding a compact camera', 'cyan', 0),
    prompt('p-07-b', '造型', 'formal suit with oversized headphones, clean blue-gray backdrop', 'slate', 1),
  ], 7),
  createImage('mock-08', '拥抱自己', '/mock-images/08-heart-illustration.jpg', ['tag-branding', 'tag-editorial'], [
    prompt('p-08-a', '插画', 'A joyful character hugging an oversized pink and red heart', 'fuchsia', 0),
    prompt('p-08-b', '色彩', 'bold flat illustration, playful proportions, warm optimistic palette', 'amber', 1),
  ], 9),
  createImage('mock-09', '玩具伙伴', '/mock-images/09-toy-bear.png', ['tag-architecture', 'tag-nature'], [
    prompt('p-09-a', '产品', 'Top-down arrangement of a teddy bear surrounded by colorful children toys', 'lime', 0),
    prompt('p-09-b', '摄影', 'clean commercial product photography, soft shadows, bright primary colors', 'amber', 1),
  ], 12),
  createImage('mock-10', '微笑早餐', '/mock-images/10-happy-breakfast.png', ['tag-product', 'tag-nature'], [
    prompt('p-10-a', '食物', 'A smiling pancake breakfast assembled with fruit on a white plate', 'amber', 0),
    prompt('p-10-b', '镜头', 'top-down food photography, natural morning light, friendly composition', 'green', 1),
  ], 14),
  createImage('mock-11', '木轨小火车', '/mock-images/11-toy-train.png', ['tag-architecture', 'tag-product'], [
    prompt('p-11-a', '产品', 'Colorful wooden toy train on a curved track in a sunlit room', 'lime', 0),
    prompt('p-11-b', '摄影', 'minimal product photography, shallow depth of field, warm natural light', 'amber', 1),
  ], 18),
  createImage('mock-12', '冬日好朋友', '/mock-images/12-red-characters.png', ['tag-3d', 'tag-minimal'], [
    prompt('p-12-a', '角色', 'Two cheerful yellow mascots wearing red winter accessories', 'amber', 0),
    prompt('p-12-b', '渲染', 'bright 3D character campaign, seamless red background, soft studio lighting', 'fuchsia', 1),
  ], 21),
];
