import React from 'react';
import { FileImage } from 'lucide-react';
import { ImageData } from '@/types';

interface ImagePreviewProps {
  image: ImageData;
  onClose: () => void;
}

export function ImagePreview({ image, onClose }: ImagePreviewProps) {
  const [beforeImageError, setBeforeImageError] = React.useState(false);
  const [afterImageError, setAfterImageError] = React.useState(false);

  // 重置错误状态当图片变化时
  React.useEffect(() => {
    setBeforeImageError(false);
    setAfterImageError(false);
  }, [image.beforeImage?.url, image.afterImage?.url]);

  // 双图模式
  if (image.type === 'comparison') {
    const hasBeforeImage = image.beforeImage && image.beforeImage.url && image.beforeImage.url.trim() !== '';
    const hasAfterImage = image.afterImage && image.afterImage.url && image.afterImage.url.trim() !== '';

    return (
      <div 
        className="w-full h-full flex flex-row bg-white relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Before 图片 */}
        <div className="flex-1 flex flex-col p-4">
          <div className="text-sm font-medium text-gray-600 mb-2 text-center">Before</div>
          <div className="flex-1 flex items-center justify-center">
            {hasBeforeImage && !beforeImageError ? (
              <img
                src={image.beforeImage!.url}
                alt="Before 图片"
                className="max-w-full max-h-[calc(75vh-20rem)] object-contain rounded-lg"
                loading="lazy"
                onError={() => setBeforeImageError(true)}
                onLoad={() => setBeforeImageError(false)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <FileImage className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {hasBeforeImage ? 'Before 图片加载失败' : '未上传 Before 图片'}
                </p>
              </div>
            )}
          </div>
        </div>



        {/* After 图片 */}
        <div className="flex-1 flex flex-col p-4 border-l">
          <div className="text-sm font-medium text-gray-600 mb-2 text-center">After</div>
          <div className="flex-1 flex items-center justify-center">
            {hasAfterImage && !afterImageError ? (
              <img
                src={image.afterImage!.url}
                alt="After 图片"
                className="max-w-full max-h-[calc(75vh-20rem)] object-contain rounded-lg"
                loading="lazy"
                onError={() => setAfterImageError(true)}
                onLoad={() => setAfterImageError(false)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <FileImage className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {hasAfterImage ? 'After 图片加载失败' : '未上传 After 图片'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 单图模式（保持原有逻辑）
  if (!image?.url) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 relative bg-white ">
        <div className="flex flex-col items-center justify-center text-center">
          <FileImage className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">图片加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full flex items-center justify-center p-8 relative bg-white"
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={image.url}
        alt={image.title || '图片'}
        className="max-w-full max-h-[calc(85vh-20rem)] object-contain rounded-2xl"
        loading="lazy"
      />
    </div>
  );
}