import { useState, useCallback, useRef } from 'react';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface FileValidationConfig {
  maxSizeInMB: number;
  allowedTypes: string[]; // MIME types or extensions
  allowedExtensions?: string[]; // e.g., ['.pdf', '.docx']
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  file?: File;
}

export interface FileUploadValidatorProps {
  config: FileValidationConfig;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  currentFile?: File | null;
  uploadProgress?: number; // 0-100
  isUploading?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

export function validateFile(
  file: File,
  config: FileValidationConfig
): FileValidationResult {
  const errors: string[] = [];

  // Check file size
  const maxSizeInBytes = config.maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    errors.push(`File size must be less than ${config.maxSizeInMB}MB`);
  }

  // Check file type
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidType =
    config.allowedTypes.some((type) => file.type.includes(type)) ||
    (config.allowedExtensions &&
      config.allowedExtensions.includes(fileExtension));

  if (!isValidType) {
    const allowedFormats = config.allowedExtensions
      ? config.allowedExtensions.join(', ')
      : config.allowedTypes.join(', ');
    errors.push(`File type not allowed. Allowed formats: ${allowedFormats}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    file: errors.length === 0 ? file : undefined,
  };
}

export function FileUploadValidator({
  config,
  onFileSelect,
  onFileRemove,
  currentFile,
  uploadProgress = 0,
  isUploading = false,
  className,
  label = 'Upload File',
  description,
}: FileUploadValidatorProps) {
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const validation = validateFile(file, config);
      
      if (validation.isValid) {
        setValidationErrors([]);
        onFileSelect(file);
      } else {
        setValidationErrors(validation.errors);
      }
    },
    [config, onFileSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setValidationErrors([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onFileRemove?.();
  }, [onFileRemove]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Upload area or file preview */}
      {!currentFile ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
            validationErrors.length > 0 && 'border-red-500 bg-red-50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={config.allowedExtensions?.join(',') || config.allowedTypes.join(',')}
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            {config.allowedExtensions?.join(', ').toUpperCase() ||
              config.allowedTypes.join(', ')} (max {config.maxSizeInMB}MB)
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          {/* File info */}
          <div className="flex items-start gap-3">
            <File className="w-10 h-10 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(currentFile.size)}
              </p>
            </div>
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Success indicator */}
          {!isUploading && uploadProgress === 100 && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Upload complete</span>
            </div>
          )}
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="flex items-start gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <ul className="space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
