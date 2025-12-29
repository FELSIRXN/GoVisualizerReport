import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { detectFileType } from '../utils/fileParser';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const navigate = useNavigate();
  const { processFiles, isLoading, error, processedData, metrics } = useDataStore();

  // Navigate to dashboard after successful processing
  useEffect(() => {
    if (processedData.length > 0 && metrics && !isLoading) {
      navigate('/dashboard');
    }
  }, [processedData, metrics, isLoading, navigate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => detectFileType(file) !== 'unknown'
    );
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      file => detectFileType(file) !== 'unknown'
    );
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    await processFiles(selectedFiles);
  }, [selectedFiles, processFiles]);

  return (
    <div className="space-y-6">
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed p-12 text-center transition-colors cursor-pointer",
          isDragging 
            ? 'border-terminal-text bg-white/5' 
            : 'hover:border-terminal-text/50'
        )}
      >
        <CardContent className="p-0">
          <Upload className="mx-auto h-12 w-12 text-terminal-text mb-4" />
          <p className="text-terminal-text mb-2">
            Drag and drop CSV or XLSX files here, or
          </p>
          <label className="cursor-pointer">
            <span className="text-terminal-text hover:underline">browse files</span>
            <input
              type="file"
              multiple
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <p className="text-sm text-terminal-text/50 mt-4">
            Supports multiple file uploads. Files will be consolidated automatically.
          </p>
        </CardContent>
      </Card>

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-terminal-text font-semibold">Selected Files:</h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <Card key={index} className="bg-[#1a1a1a]">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-terminal-text" />
                      <span className="text-sm text-terminal-text">{file.name}</span>
                      <span className="text-xs text-terminal-text/50">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={isLoading}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {isLoading && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-terminal-text/60 text-center">Processing files...</p>
            </div>
          )}
          <Button
            onClick={handleUpload}
            disabled={isLoading || selectedFiles.length === 0}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Process Files'
            )}
          </Button>
        </div>
      )}

      {error && (
        <Card className="bg-red-900/20 border-red-500/50">
          <CardContent className="p-4">
            <p className="font-semibold text-red-400">Error:</p>
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

