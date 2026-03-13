import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import DatasetSummary from '../components/DatasetSummary';
import DatasetPreview from '../components/DatasetPreview';
import Chatbot from '../components/Chatbot';
import { getAiDiagnostic, getRefinementCode } from '../api/api';
import { getSafeSummary, applyCleaningCode, getCleaningStats } from '../utils/cleaner';
import { ShieldCheck, Download, Sparkles, Activity, FileText } from 'lucide-react';

const Dashboard = () => {
  const [dataset, setDataset] = useState(null); 
  const [cleaningStatus, setCleaningStatus] = useState('idle'); // idle, processing, complete
  const [cleanStats, setCleanStats] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);

  const startAutomaticCleaning = async (datasetInfo) => {
    setDataset(datasetInfo);
    setCleaningStatus('processing');
    try {
      const summary = getSafeSummary(datasetInfo.data);
      
      // 1. Get Diagnostic
      const report = await getAiDiagnostic(summary);
      setDiagnostic(report);
      
      // 2. Get Refinement Code
      const code = await getRefinementCode(summary, report);
      
      // 3. Apply Cleaning
      const cleanedData = applyCleaningCode(datasetInfo.data, code);
      
      // 4. Calculate Stats
      const stats = getCleaningStats(datasetInfo.rawData || datasetInfo.data, cleanedData);
      setCleanStats(stats);
      
      // 5. Update State
      setDataset(prev => ({
        ...prev,
        data: cleanedData,
        rows: cleanedData.length
      }));
      
      setCleaningStatus('complete');
    } catch (err) {
      console.error("Automatic cleaning failed:", err);
      setCleaningStatus('idle');
    }
  };

  const handleDownload = () => {
    if (!dataset) return;
    const { data, filename } = dataset;
    const csvContent = "data:text/csv;charset=utf-8," 
      + [Object.keys(data[0]).join(","), ...data.map(row => Object.values(row).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `refined_${filename.split('.')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#4f46e5] text-slate-900 flex flex-col font-sans selection:bg-white/20">
      {/* Header */}
      <header className="h-20 border-b border-white/10 bg-[#4f46e5]/80 backdrop-blur-xl px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-2 rounded-2xl shadow-xl shadow-black/10">
            <ShieldCheck className="w-6 h-6 text-[#4f46e5]" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white underline decoration-white/30 decoration-4 underline-offset-4">OPTIMA <span className="text-indigo-200">AI</span></span>
        </div>
        <div>
          {/* Header links removed as per request */}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-20 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0.1)_100%)]">
        <div className="max-w-[1440px] mx-auto space-y-24">
          
          {/* Hero Section */}
          <section className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-indigo-50 text-xs font-bold uppercase tracking-[0.2em] animate-fade-in shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen Data Refinery</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight leading-[1.1]">
              Clean and Refine Your <span className="text-indigo-200">CSV Dataset</span> Instantly
            </h1>
            <p className="text-xl text-indigo-50 font-medium leading-relaxed opacity-90">
              Upload a CSV dataset and let Optima AI automatically detect and clean duplicates, missing values, and formatting issues.
            </p>
          </section>

          {/* Core Workflow Area */}
          <section className="w-full">
            {cleaningStatus === 'idle' && !dataset && (
              <FileUpload onUploadSuccess={startAutomaticCleaning} />
            )}

            {cleaningStatus === 'processing' && (
              <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center space-y-12">
                <div className="relative">
                  <div className="w-24 h-24 border-[6px] border-white/10 border-t-white rounded-full animate-spin shadow-inner"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>
                <div className="text-center animate-pulse">
                  <h3 className="text-2xl font-bold text-white mb-2">Refining Your Data</h3>
                  <p className="text-indigo-100 text-sm font-medium">Optima AI is analyzing and cleaning your dataset...</p>
                </div>
              </div>
            )}

            {(cleaningStatus === 'complete' || dataset) && cleaningStatus !== 'processing' && (
              <div className="space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Summary Panel */}
                <DatasetSummary stats={cleanStats} />

                {/* Preview Table */}
                <DatasetPreview data={dataset.data} />

                {/* Chatbot Section */}
                <section className="pt-20 border-t border-white/10">
                  <Chatbot 
                    context={dataset ? `Dataset Summary: ${getSafeSummary(dataset.data)}` : ""} 
                    onCommand={async (cmd) => {
                      setCleaningStatus('processing');
                      try {
                        const summary = getSafeSummary(dataset.data);
                        const code = await getRefinementCode(summary, `Action Requested: ${cmd}`);
                        const cleanedData = applyCleaningCode(dataset.data, code);
                        
                        const stats = getCleaningStats(dataset.data, cleanedData);
                        setCleanStats(stats);
                        
                        setDataset(prev => ({
                          ...prev,
                          data: cleanedData,
                          rows: cleanedData.length
                        }));
                        setCleaningStatus('complete');
                      } catch (err) {
                        console.error("Manual cleaning failed:", err);
                        setCleaningStatus('idle');
                      }
                    }}
                  />
                </section>

                {/* Download Section */}
                <section className="flex flex-col items-center justify-center py-20 space-y-8 relative">
                   {cleanStats && (
                     <div className="absolute -top-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/20 animate-bounce">
                       Dataset Updated
                     </div>
                   )}
                   <div className="bg-white/10 p-1 rounded-3xl border border-white/10 shadow-2xl shadow-black/20">
                    <button
                      onClick={handleDownload}
                      className="group relative flex items-center space-x-4 px-12 py-5 bg-white text-[#4f46e5] rounded-[2rem] font-black text-xl hover:bg-slate-50 transition-all hover:scale-[1.05] active:scale-[0.95] shadow-2xl"
                    >
                      <div className="bg-[#4f46e5] p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                        <Download className="w-6 h-6" />
                      </div>
                      <span>Download Clean CSV</span>
                    </button>
                   </div>
                   <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-[0.3em]">Ready for Production Export</p>
                </section>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Background elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] bg-white/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-black/5 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
};

export default Dashboard;
