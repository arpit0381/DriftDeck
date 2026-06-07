import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { ChevronUp, ChevronDown, X, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function GlobalUploadTracker() {
  const { uploadQueue, setUploadStatus, clearUploadQueue } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(true);

  if (uploadQueue.length === 0) return null;

  const activeUploads = uploadQueue.filter(u => u.status === 'uploading' || u.status === 'pending');
  const completedUploads = uploadQueue.filter(u => u.status === 'completed');
  const failedUploads = uploadQueue.filter(u => u.status === 'failed');

  const totalProgress = uploadQueue.reduce((acc, curr) => acc + curr.progress, 0) / uploadQueue.length || 0;

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto w-auto sm:w-80 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-300 ease-in-out">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {activeUploads.length > 0 ? (
            <UploadCloud className="text-blue-400 h-5 w-5 animate-pulse" />
          ) : failedUploads.length > 0 ? (
            <AlertCircle className="text-red-400 h-5 w-5" />
          ) : (
            <CheckCircle className="text-green-400 h-5 w-5" />
          )}
          <span className="text-sm font-medium text-slate-200">
            {activeUploads.length > 0 
              ? `Uploading ${activeUploads.length} item${activeUploads.length > 1 ? 's' : ''}...`
              : 'Uploads Finished'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeUploads.length === 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); clearUploadQueue(); }}
              className="p-1 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Global Progress Bar (only when collapsed and active) */}
      {!isExpanded && activeUploads.length > 0 && (
        <div className="h-1 bg-slate-800 w-full">
          <div 
            className="h-1 bg-blue-500 transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      )}

      {/* Upload List */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
          {uploadQueue.map(item => (
            <div key={item.id} className="p-2 rounded-lg hover:bg-slate-800/50 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-300 truncate w-48" title={item.name}>
                  {item.name}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {item.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-500 inline mr-1" />}
                  {item.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500 inline mr-1" />}
                  {item.status === 'uploading' && `${item.progress}%`}
                  {item.status === 'pending' && 'Waiting...'}
                </span>
              </div>
              
              {/* Individual Progress Bar */}
              {item.status === 'uploading' && (
                <div className="h-1.5 bg-slate-800 rounded-full w-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
