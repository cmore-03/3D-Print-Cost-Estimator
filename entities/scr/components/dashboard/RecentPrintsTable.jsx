import React from 'react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Clock, Printer, XCircle } from 'lucide-react';

const statusConfig = {
  completed: { icon: CheckCircle2, label: "Done", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  printing: { icon: Printer, label: "Printing", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  planned: { icon: Clock, label: "Planned", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  failed: { icon: AlertTriangle, label: "Failed", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  cancelled: { icon: XCircle, label: "Cancelled", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

export default function RecentPrintsTable({ prints }) {
  if (!prints || prints.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Printer className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No prints logged yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Project</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Material</th>
            <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Weight</th>
            <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Cost</th>
            <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Status</th>
            <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3 px-2">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {prints.map((p) => {
            const s = statusConfig[p.status] || statusConfig.completed;
            const StatusIcon = s.icon;
            return (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-2">
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  {p.spool_name && <p className="text-xs text-slate-500 mt-0.5">{p.spool_name}</p>}
                </td>
                <td className="py-3 px-2 text-sm text-slate-400">{p.material || '—'}</td>
                <td className="py-3 px-2 text-sm text-slate-300 text-right font-mono">{p.filament_used_g?.toFixed(0)}g</td>
                <td className="py-3 px-2 text-sm text-white text-right font-mono font-medium">
                  ${p.total_cost?.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-center">
                  <Badge variant="outline" className={`text-xs ${s.className} border`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {s.label}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-xs text-slate-500 text-right">
                  {p.created_date ? format(new Date(p.created_date), 'MMM d') : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
