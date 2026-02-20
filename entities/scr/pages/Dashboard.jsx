import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Package, DollarSign, Printer, Scale, Plus, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import StatCard from '../components/dashboard/StatCard';
import SpoolCard from '../components/dashboard/SpoolCard';
import RecentPrintsTable from '../components/dashboard/RecentPrintsTable';
import CostChart from '../components/dashboard/CostChart';

export default function Dashboard() {
  const { data: spools = [], isLoading: spoolsLoading } = useQuery({
    queryKey: ['spools'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.FilamentSpool.filter({ created_by: user.email }, '-created_date', 50);
    },
  });

  const { data: prints = [], isLoading: printsLoading } = useQuery({
    queryKey: ['prints'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.PrintProject.filter({ created_by: user.email }, '-created_date', 50);
    },
  });

  const isLoading = spoolsLoading || printsLoading;

  const totalSpools = spools.length;
  const activeSpools = spools.filter(s => s.status === 'active' || s.status === 'low').length;
  const totalFilamentCost = prints.reduce((sum, p) => sum + (p.filament_cost || 0), 0);
  const totalCost = prints.reduce((sum, p) => sum + (p.total_cost || 0), 0);
  const totalWeight = prints.reduce((sum, p) => sum + (p.filament_used_g || 0), 0);
  const totalPrints = prints.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Track your 3D printing costs and filament usage</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("AddSpool")}>
            <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Package className="w-4 h-4 mr-2" />
              Add Spool
            </Button>
          </Link>
          <Link to={createPageUrl("AddPrint")}>
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Print
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Spools" value={activeSpools} subtitle={`${totalSpools} total`} icon={Package} accent="cyan" />
          <StatCard title="Total Cost" value={`$${totalCost.toFixed(2)}`} subtitle="all-time" icon={DollarSign} accent="amber" />
          <StatCard title="Total Prints" value={totalPrints} subtitle={`${(totalWeight / 1000).toFixed(1)}kg used`} icon={Printer} accent="emerald" />
          <StatCard title="Filament Cost" value={`$${totalFilamentCost.toFixed(2)}`} subtitle="material only" icon={Scale} accent="violet" />
        </div>
      )}

      {/* Chart + Spools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Printing Costs</h2>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-48 rounded-xl bg-white/5" />
          ) : (
            <CostChart prints={prints} />
          )}
        </div>

        {/* Spool Overview */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Spools</h2>
            <Link to={createPageUrl("Spools")} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : spools.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-500">No spools yet</p>
              <Link to={createPageUrl("AddSpool")}>
                <Button variant="link" className="text-cyan-400 mt-1 text-xs">Add your first spool</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {spools.slice(0, 4).map(spool => (
                <SpoolCard key={spool.id} spool={spool} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Prints */}
      <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Recent Prints</h2>
          <Link to={createPageUrl("Prints")} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg bg-white/5" />
            ))}
          </div>
        ) : (
          <RecentPrintsTable prints={prints.slice(0, 8)} />
        )}
      </div>
    </div>
  );
}
