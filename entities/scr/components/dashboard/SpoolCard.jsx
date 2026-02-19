import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SpoolGauge from './SpoolGauge';
import { Badge } from "@/components/ui/badge";

const materialColors = {
  PLA: "#22d3ee",
  ABS: "#f59e0b",
  PETG: "#10b981",
  TPU: "#a78bfa",
  Nylon: "#f472b6",
  ASA: "#fb923c",
  PC: "#64748b",
  PVA: "#6366f1",
  HIPS: "#84cc16",
  Wood: "#92400e",
  "Carbon Fiber": "#374151",
  Other: "#94a3b8",
};

export default function SpoolCard({ spool }) {
  const percentage = spool.total_weight_g > 0 
    ? Math.round((spool.remaining_weight_g / spool.total_weight_g) * 100) 
    : 0;

  const costPerGram = spool.total_weight_g > 0 
    ? (spool.cost_per_spool / spool.total_weight_g) 
    : 0;

  const accentColor = spool.color_hex || materialColors[spool.material] || "#22d3ee";

  return (
    <Link 
      to={createPageUrl("SpoolDetail") + `?id=${spool.id}`}
      className="block group"
    >
      <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-sm p-5 
        hover:border-white/[0.12] transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
        <div className="flex items-start gap-4">
          <SpoolGauge 
            remaining={spool.remaining_weight_g} 
            total={spool.total_weight_g} 
            color={accentColor}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: accentColor }} 
              />
              <h3 className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                {spool.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-[10px] border-white/10 text-slate-400">
                {spool.material}
              </Badge>
              {spool.brand && (
                <span className="text-[10px] text-slate-600">{spool.brand}</span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-500">
                {spool.remaining_weight_g?.toFixed(0)}g / {spool.total_weight_g?.toFixed(0)}g
              </span>
              <span className="text-xs font-mono text-slate-400">
                ${costPerGram.toFixed(3)}/g
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
