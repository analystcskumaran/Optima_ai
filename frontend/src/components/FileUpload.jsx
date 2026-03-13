import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Database } from 'lucide-react';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a valid CSV file.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const { localPreprocess } = await import('../utils/cleaner');
      const Papa = (await import('papaparse')).default;

      const parseFile = () => {
        return new Promise((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
          });
        });
      };

      const rawData = await parseFile();
      const cleanedData = localPreprocess(rawData);
      
      onUploadSuccess({
        filename: file.name,
        data: cleanedData,
        rawData: rawData,
        columns: cleanedData.length > 0 ? Object.keys(cleanedData[0]) : [],
        rows: cleanedData.length
      });
    } catch (err) {
      setError('Processing failed. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto group">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xl shadow-slate-200/50 transition-all duration-500">
        {!file ? (
          <label className="flex items-center justify-center w-full min-h-[140px] px-12 border-2 border-dashed border-indigo-100 rounded-xl cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/30 transition-all duration-300">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-slate-400 text-sm font-medium">Drag and drop your file here or click to select from your computer</p>
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-100 group-hover:scale-105 transition-all duration-500">
                  <Database className="w-6 h-6 text-[#4f46e5]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Upload CSV Dataset</h3>
              </div>
              <div className="flex items-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-100">
                <span>Format: CSV Only</span>
              </div>
            </div>
            <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-8 px-8 py-4">
            <div className="flex items-center space-x-6 flex-1 min-w-0">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <FileText className="w-8 h-8 text-[#4f46e5]" />
              </div>
              <div className="truncate">
                <p className="text-lg font-bold text-slate-900 truncate max-w-[500px]">{file.name}</p>
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ready for automated refinery</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 shrink-0">
              <button 
                onClick={() => setFile(null)} 
                className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                title="Change file"
              >
                <Upload className="w-5 h-5 rotate-180" />
              </button>
              
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`flex items-center space-x-3 py-4 px-10 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
                  isUploading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-[#4f46e5] text-white hover:bg-[#4338ca] hover:scale-[1.05] active:scale-[0.95] shadow-xl shadow-indigo-500/20'
                }`}
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Start Refining</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
