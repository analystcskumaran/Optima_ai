import React from 'react';

const DatasetPreview = ({ data }) => {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const previewData = data.slice(0, 50);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/40">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-xl font-bold text-slate-900 flex items-center">
          <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3 animate-pulse"></span>
          Dataset Preview
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing top {previewData.length} records</span>
      </div>
      
      <div className="overflow-x-auto max-h-[500px] scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {previewData.map((row, i) => (
              <tr key={i} className="group hover:bg-indigo-50/30 transition-colors duration-200">
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                    {row[col] === null || row[col] === undefined ? (
                      <span className="text-slate-300 italic font-normal text-xs">null</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-8 py-4 bg-slate-50/20 border-t border-slate-100 flex justify-center">
        <div className="h-1.5 w-16 bg-slate-100 rounded-full"></div>
      </div>
    </div>
  );
};

export default DatasetPreview;
