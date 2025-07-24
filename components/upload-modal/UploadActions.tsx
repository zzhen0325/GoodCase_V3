'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface UploadActionsProps {
  onUpload: (e?: React.MouseEvent) => void;
  onCancel: () => void;
  canUpload: boolean;
  isUploading: boolean;
}

export const UploadActions: React.FC<UploadActionsProps> = ({
  onUpload,
  onCancel,
  canUpload,
  isUploading
}) => {
  return (
    <div className="flex items-center gap-2  justify-end">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isUploading}
        size="lg"
        className="px-4 border"
      >
        Cancel
      </Button>
      
      <Separator orientation="vertical" className="h-6 mx-2" />
      
      <Button
        type="button"
        onClick={(e) => onUpload(e)} 
        className="bg-black px-4 hover:bg-gray-800 text-white rounded-xl"
        disabled={!canUpload || isUploading}
        size="lg"
      >
        {isUploading ? 'Uploading...' : 'Submit'}
      </Button>
    </div>
  );
};
