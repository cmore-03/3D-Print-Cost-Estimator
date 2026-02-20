import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Search, Printer, Trash2, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';

const statusConfig = {
  completed: { icon: CheckCircle2, label: "Done", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  printing: { icon: Printer, label: "Printing", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  planned: { icon: Clock, label: "Planned", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  failed: { icon: AlertTriangle, label: "Failed", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  cancelled: { icon: XCircle, label: "Cancelled", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

export default function Prints() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: prints = [], isLoading } = useQuery({
    queryKey: ['prints'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.PrintProject.filter({ created_by: user.email }, '-created_date', 100);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PrintProject.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prints'] }),
  });

  const filtered = prints.filter(p => {
    const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Print History</h1>
          <p className="text-slate-500 mt-1">{prints.length} prints logged</p>
        </div>
        <Link to={createPageUrl("AddPrint")}>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Print
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input placeholder="Search prints..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-slate-900/50 border-white/10 text-slate-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="printing">Printing</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Printer className="w-12 h-12 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-500">
            {search || statusFilter !== 'all' ? 'No prints match your filters' : 'No prints logged yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const s = statusConfig[p.status] || statusConfig.completed;
            const StatusIcon = s.icon;
            return (
              <div key={p.id} className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-5 hover:border-white/[0.12] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                      <Badge variant="outline" className={`text-[10px] ${s.className} border`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {s.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                      {p.spool_name && <span>{p.spool_name}</span>}
                      {p.material && <span>{p.material}</span>}
                      <span>{p.filament_used_g?.toFixed(0)}g</span>
                      {p.print_time_minutes && <span>{Math.floor(p.print_time_minutes / 60)}h {p.print_time_minutes % 60}m</span>}
                      {p.created_date && <span>{format(new Date(p.created_date), 'MMM d, yyyy')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white font-mono">${p.total_cost?.toFixed(2)}</p>
                      {p.filament_cost > 0 && p.filament_cost !== p.total_cost && (
                        <p className="text-[10px] text-slate-500">material: ${p.filament_cost?.toFixed(2)}</p>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this print?</AlertDialogTitle>
                          <AlertDialogDescription>This will not restore the filament to the spool.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)} className="bg-rose-600 hover:bg-rose-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
