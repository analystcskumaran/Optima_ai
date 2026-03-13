import React from 'react';
import { Hash, Layers, Info, CheckCircle2 } from 'lucide-react';

const DatasetSummary = ({ stats }) => {
  if (!stats) return null;

  const cards = [
    { label: 'Total Rows', value: stats.cleanedRows, sub: `${stats.originalRows} original`, icon: Hash, opacity: 'bg-blue-500/10', color: 'text-blue-400' },
    { label: 'Duplicates Removed', value: stats.rowsRemoved, sub: 'Optimized redundancy', icon: Layers, opacity: 'bg-emerald-500/10', color: 'text-emerald-400' },
    { label: 'Missing Values Fixed', value: stats.missingFixed, sub: 'Logical imputation', icon: Info, opacity: 'bg-indigo-500/10', color: 'text-indigo-400' },
    { label: 'Formatting Issues', value: stats.formattingFixed, sub: 'Standardized strings', icon: CheckCircle2, opacity: 'bg-sky-500/10', color: 'text-sky-400' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {cards.map((card, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 flex items-start space-x-4 group hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
          <div className={`p-3 rounded-2xl bg-indigo-50 ${card.color.replace('text-', 'text-indigo-').replace('400', '600')} group-hover:scale-110 transition-transform duration-500`}>
            <card.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">{card.label}</p>
            <p className="text-2xl font-black text-slate-950 leading-none mb-1.5">{card.value}</p>
            <p className="text-[10px] text-[#4f46e5] font-bold">{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DatasetSummary;
