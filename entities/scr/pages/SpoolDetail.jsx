import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Pencil, Trash2, Save, X, Package } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import SpoolGauge from '../components/dashboard/SpoolGauge';
import RecentPrintsTable from '../components/dashboard/RecentPrintsTable';
import { format } from 'date-fns';

export default function SpoolDetail() {
  const params = new URLSearchParams(window.location.search);
  const spoolId = params.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingRemaining, setEditingRemaining] = useState(false);
  const [newRemaining, setNewRemaining] = useState('');

  const { data: spool, isLoading } = useQuery({
    queryKey: ['spool', spoolId],
    queryFn: () => base44.entities.FilamentSpool.filter({ id: spoolId }),
    select: (data) => data?.[0],
    enabled: !!spoolId,
  });

  const { data: prints = [] } = useQuery({
    queryKey: ['spool-prints', spoolId],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.PrintProject.filter({ spool_id: spoolId, created_by: user.email }, '-created_date', 50);
    },
    enabled: !!spoolId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.FilamentSpool.update(spoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spool', spoolId] });
      setEditingRemaining(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.FilamentSpool.delete(spoolId),
    onSuccess: () => navigate(createPageUrl("Spools")),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 bg-white/5" />
        <Skeleton className="h-64 rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!spool) {
    return (
      <div className="text-center py-20">
        <Package className="w-12 h-12 mx-auto mb-3 text-slate-700" />
        <p className="text-slate-500">Spool not found</p>
        <Link to={createPageUrl("Spools")}>
          <Button variant="link" className="text-cyan-400 mt-2">Back to Spools</Button>
        </Link>
      </div>
    );
  }

  const costPerGram = spool.total_weight_g > 0 ? spool.cost_per_spool / spool.total_weight_g : 0;
  const usedWeight = spool.total_weight_g - spool.remaining_weight_g;
  const accentColor = spool.color_hex || "#22d3ee";

  const handleSaveRemaining = () => {
    const val = Number(newRemaining);
    if (val >= 0 && val <= spool.total_weight_g) {
      const status = val === 0 ? 'empty' : val < spool.total_weight_g * 0.1 ? 'low' : 'active';
      updateMutation.mutate({ remaining_weight_g: val, status });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Spools")}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
              <h1 className="text-2xl font-bold text-white">{spool.name}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs border-white/10 text-slate-400">{spool.material}</Badge>
              {spool.brand && <span className="text-sm text-slate-500">{spool.brand}</span>}
            </div>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this spool?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-rose-600 hover:bg-rose-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gauge */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 flex flex-col items-center justify-center">
          <SpoolGauge remaining={spool.remaining_weight_g} total={spool.total_weight_g} color={accentColor} size={120} />
          <p className="text-lg font-bold text-white mt-4">
            {spool.remaining_weight_g?.toFixed(0)}g <span className="text-slate-500 font-normal text-sm">/ {spool.total_weight_g}g</span>
          </p>
          {editingRemaining ? (
            <div className="flex items-center gap-2 mt-3">
              <Input type="number" value={newRemaining} onChange={(e) => setNewRemaining(e.target.value)}
                min="0" max={spool.total_weight_g} className="w-24 bg-slate-800 border-white/10 text-white text-sm h-8" />
              <Button size="sm" onClick={handleSaveRemaining} className="h-8 bg-cyan-600 hover:bg-cyan-700">
                <Save className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingRemaining(false)} className="h-8 text-slate-400">
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => {
              setNewRemaining(String(spool.remaining_weight_g));
              setEditingRemaining(true);
            }} className="mt-3 text-cyan-400 hover:text-cyan-300 text-xs">
              <Pencil className="w-3 h-3 mr-1" /> Update Remaining
            </Button>
          )}
        </div>

        {/* Details */}
        <div className="md:col-span-2 rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <Detail label="Cost per spool" value={`${spool.currency || '$'}${spool.cost_per_spool?.toFixed(2)}`} />
            <Detail label="Cost per gram" value={`$${costPerGram.toFixed(3)}`} />
            <Detail label="Used" value={`${usedWeight.toFixed(0)}g`} />
            <Detail label="Diameter" value={`${spool.diameter_mm}mm`} />
            <Detail label="Density" value={`${spool.density_g_cm3} g/cm³`} />
            <Detail label="Nozzle Temp" value={`${spool.print_temp_min || '—'}–${spool.print_temp_max || '—'}°C`} />
            <Detail label="Bed Temp" value={`${spool.bed_temp_min || '—'}–${spool.bed_temp_max || '—'}°C`} />
            <Detail label="Purchased" value={spool.purchase_date ? format(new Date(spool.purchase_date), 'MMM d, yyyy') : '—'} />
          </div>
          {spool.notes && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-300">{spool.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Prints from this spool */}
      <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Prints from this Spool</h2>
        <RecentPrintsTable prints={prints} />
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-white mt-0.5">{value}</p>
    </div>
  );
}
