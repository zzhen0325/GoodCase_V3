'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

export interface CompressionConfig {
  enabled: boolean;
  quality: number;
  maxWidth: number;
  maxHeight: number;
}

interface CompressionSettingsProps {
  config: CompressionConfig;
  onChange: (config: CompressionConfig) => void;
}

export const CompressionSettings: React.FC<CompressionSettingsProps> = ({
  config,
  onChange
}) => {
  const handleQualityChange = (value: number[]) => {
    onChange({ ...config, quality: value[0] / 100 });
  };

  const handleMaxWidthChange = (value: number[]) => {
    onChange({ ...config, maxWidth: value[0] });
  };

  const handleMaxHeightChange = (value: number[]) => {
    onChange({ ...config, maxHeight: value[0] });
  };

  const handleEnabledChange = (enabled: boolean) => {
    onChange({ ...config, enabled });
  };

  const presets = [
    { name: '高质量', quality: 0.9, maxWidth: 2560, maxHeight: 1440 },
    { name: '标准', quality: 0.8, maxWidth: 1920, maxHeight: 1080 },
    { name: '压缩', quality: 0.6, maxWidth: 1280, maxHeight: 720 },
    { name: '高压缩', quality: 0.4, maxWidth: 800, maxHeight: 600 }
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    onChange({
      ...config,
      quality: preset.quality,
      maxWidth: preset.maxWidth,
      maxHeight: preset.maxHeight
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">图片压缩设置</h4>
            <p className="text-sm text-muted-foreground">
              配置图片压缩参数以优化文件大小
            </p>
          </div>

          {/* 启用压缩开关 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="compression-enabled" className="text-sm">
              启用压缩
            </Label>
            <Switch
              id="compression-enabled"
              checked={config.enabled}
              onCheckedChange={handleEnabledChange}
            />
          </div>

          {config.enabled && (
            <>
              {/* 预设选项 */}
              <div className="space-y-2">
                <Label className="text-sm">快速预设</Label>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="text-xs"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 压缩质量 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">压缩质量</Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(config.quality * 100)}%
                  </span>
                </div>
                <Slider
                  value={[config.quality * 100]}
                  onValueChange={handleQualityChange}
                  max={100}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* 最大宽度 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">最大宽度</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.maxWidth}px
                  </span>
                </div>
                <Slider
                  value={[config.maxWidth]}
                  onValueChange={handleMaxWidthChange}
                  max={4096}
                  min={480}
                  step={160}
                  className="w-full"
                />
              </div>

              {/* 最大高度 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">最大高度</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.maxHeight}px
                  </span>
                </div>
                <Slider
                  value={[config.maxHeight]}
                  onValueChange={handleMaxHeightChange}
                  max={4096}
                  min={360}
                  step={120}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CompressionSettings;