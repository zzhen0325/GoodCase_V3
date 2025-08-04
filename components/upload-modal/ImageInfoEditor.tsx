'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageInfoEditorProps {
  imageName: string;
  onImageNameChange: (name: string) => void;
  disabled?: boolean;
}

// export const ImageInfoEditor: React.FC<ImageInfoEditorProps> = ({
//   imageName,
//   onImageNameChange,
//   disabled = false
// }) => {
//   return (
//     <div className="space-y-4">
//       <div>
//         <Label htmlFor="image-name" className="text-sm font-medium">
//           图片名称 <span className="text-red-500">*</span>
//         </Label>
//         <Input
//           id="image-name"
//           type="text"
//           placeholder="请输入图片名称"
//           value={imageName}
//           onChange={(e) => onImageNameChange(e.target.value)}
//           disabled={disabled}
//           className="mt-1"
//           maxLength={100}
//         />
//         <div className="text-xs text-gray-500 mt-1">
//           {imageName.length}/100 字符
//         </div>
//       </div>
//     </div>
//   );
// };
