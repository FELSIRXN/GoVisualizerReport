import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { detectFileType } from '../utils/fileParser';

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
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${isDragging 
            ? 'border-terminal-text bg-white/5' 
            : 'border-terminal-border hover:border-terminal-text/50'
          }
        `}
      >
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
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-terminal-text font-semibold">Selected Files:</h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-terminal-border rounded hover:border-terminal-text/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-terminal-text" />
                  <span className="text-sm text-terminal-text">{file.name}</span>
                  <span className="text-xs text-terminal-text/50">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-terminal-text/50 hover:text-terminal-text transition-colors"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={isLoading || selectedFiles.length === 0}
            className="w-full bg-white text-black font-semibold py-3 px-6 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Files'
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

