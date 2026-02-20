import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Save, Calculator, ChevronDown, ChevronUp, Upload, Loader2, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Link } from 'react-router-dom';

export default function AddPrint() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState('');

  const { data: spools = [] } = useQuery({
    queryKey: ['spools-active'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.FilamentSpool.filter({ created_by: user.email }, '-created_date', 100);
    },
  });

  const { data: printers = [] } = useQuery({
    queryKey: ['printers'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Printer.filter({ created_by: user.email }, '-created_date', 100);
    },
  });

  const activeSpools = spools.filter(s => s.status !== 'empty' && s.status !== 'archived');
  const activePrinters = printers.filter(p => p.status === 'active');

  const [form, setForm] = useState({
    name: '',
    spool_id: '',
    printer_id: '',
    filament_used_g: '',
    print_time_minutes: '',
    layer_height_mm: 0.2,
    infill_percent: 20,
    print_speed_mm_s: 60,
    supports: false,
    nozzle_temp: '',
    bed_temp: '',
    electricity_cost: 0,
    labor_cost: 0,
    machine_wear_cost: 0,
    status: 'completed',
    notes: '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const selectedSpool = useMemo(
    () => spools.find(s => s.id === form.spool_id),
    [form.spool_id, spools]
  );

  const filamentCost = useMemo(() => {
    if (!selectedSpool || !form.filament_used_g) return 0;
    const costPerGram = selectedSpool.total_weight_g > 0
      ? selectedSpool.cost_per_spool / selectedSpool.total_weight_g
      : 0;
    return costPerGram * Number(form.filament_used_g);
  }, [selectedSpool, form.filament_used_g]);

  const totalCost = filamentCost + Number(form.electricity_cost || 0) + Number(form.labor_cost || 0) + Number(form.machine_wear_cost || 0);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setFileName(file.name);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Estimate filament weight (grams) and print time (minutes) for this 3D model. Layer height: 0.2mm, infill: 20%, speed: 60mm/s.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            weight_grams: { type: "number" },
            print_time_minutes: { type: "number" }
          }
        }
      });

      if (result?.weight_grams) {
        set('filament_used_g', String(Math.round(result.weight_grams)));
      }
      if (result?.print_time_minutes) {
        set('print_time_minutes', String(Math.round(result.print_time_minutes)));
      }
      set('model_file_url', file_url);
    } catch (error) {
      console.error('Error analyzing file:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const printData = {
      name: form.name,
      spool_id: form.spool_id || undefined,
      printer_id: form.printer_id || undefined,
      spool_name: selectedSpool?.name || undefined,
      material: selectedSpool?.material || undefined,
      filament_used_g: Number(form.filament_used_g),
      filament_cost: filamentCost,
      print_time_minutes: form.print_time_minutes ? Number(form.print_time_minutes) : undefined,
      layer_height_mm: form.layer_height_mm,
      infill_percent: form.infill_percent,
      print_speed_mm_s: form.print_speed_mm_s,
      supports: form.supports,
      nozzle_temp: form.nozzle_temp ? Number(form.nozzle_temp) : undefined,
      bed_temp: form.bed_temp ? Number(form.bed_temp) : undefined,
      electricity_cost: Number(form.electricity_cost || 0),
      labor_cost: Number(form.labor_cost || 0),
      machine_wear_cost: Number(form.machine_wear_cost || 0),
      total_cost: totalCost,
      status: form.status,
      notes: form.notes,
      currency: selectedSpool?.currency || 'USD',
    };

    await base44.entities.PrintProject.create(printData);

    // Update spool remaining weight
    if (selectedSpool && form.filament_used_g) {
      const newRemaining = Math.max(0, selectedSpool.remaining_weight_g - Number(form.filament_used_g));
      const status = newRemaining === 0 ? 'empty' : newRemaining < selectedSpool.total_weight_g * 0.1 ? 'low' : 'active';
      await base44.entities.FilamentSpool.update(selectedSpool.id, {
        remaining_weight_g: newRemaining,
        status,
      });
    }

    navigate(createPageUrl("Prints"));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Prints")}>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Log a Print</h1>
          <p className="text-slate-500 text-sm mt-0.5">Calculate cost and track filament usage</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Project</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-slate-300 text-xs">Project Name *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required
                placeholder="e.g., Benchy test print"
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Filament Spool</Label>
              <Select value={form.spool_id} onValueChange={(v) => set('spool_id', v)}>
                <SelectTrigger className="mt-1.5 bg-slate-800/50 border-white/10 text-white">
                  <SelectValue placeholder="Select a spool" />
                </SelectTrigger>
                <SelectContent>
                  {activeSpools.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.remaining_weight_g?.toFixed(0)}g left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Printer</Label>
              <Select value={form.printer_id} onValueChange={(v) => set('printer_id', v)}>
                <SelectTrigger className="mt-1.5 bg-slate-800/50 border-white/10 text-white">
                  <SelectValue placeholder="Select a printer" />
                </SelectTrigger>
                <SelectContent>
                  {activePrinters.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger className="mt-1.5 bg-slate-800/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="printing">Printing</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Filament Usage */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Filament Usage</h2>
          
          {/* 3D Model Upload */}
          <div>
            <Label className="text-slate-300 text-xs">Upload 3D Model (Optional)</Label>
            <label className="mt-1.5 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/10 rounded-lg hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-pointer">
              <input
                type="file"
                accept=".stl,.obj,.3mf"
                onChange={handleFileUpload}
                disabled={analyzing}
                className="hidden"
              />
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-sm text-cyan-400">Analyzing model...</span>
                </>
              ) : fileName ? (
                <>
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">{fileName}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-500">Click to upload STL, OBJ, or 3MF</span>
                </>
              )}
            </label>
            <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
              <Info className="w-3 h-3" /> AI will estimate filament usage from your 3D model
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 text-xs">Filament Used (g) *</Label>
              <Input type="number" step="0.1" value={form.filament_used_g} onChange={(e) => set('filament_used_g', e.target.value)} required min="0"
                placeholder="0"
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600" />
              {selectedSpool && form.filament_used_g && Number(form.filament_used_g) > selectedSpool.remaining_weight_g && (
                <p className="text-xs text-amber-400 mt-1">⚠ Exceeds remaining spool weight</p>
              )}
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Print Time (minutes)</Label>
              <Input type="number" value={form.print_time_minutes} onChange={(e) => set('print_time_minutes', e.target.value)} min="0"
                placeholder="0"
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600" />
            </div>
          </div>
        </div>

        {/* Print Settings */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Print Settings</h2>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between">
                <Label className="text-slate-300 text-xs">Layer Height</Label>
                <span className="text-xs text-cyan-400 font-mono">{form.layer_height_mm}mm</span>
              </div>
              <Slider value={[form.layer_height_mm]} onValueChange={([v]) => set('layer_height_mm', v)}
                min={0.05} max={0.4} step={0.05} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between">
                <Label className="text-slate-300 text-xs">Infill Density</Label>
                <span className="text-xs text-cyan-400 font-mono">{form.infill_percent}%</span>
              </div>
              <Slider value={[form.infill_percent]} onValueChange={([v]) => set('infill_percent', v)}
                min={0} max={100} step={5} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between">
                <Label className="text-slate-300 text-xs">Print Speed</Label>
                <span className="text-xs text-cyan-400 font-mono">{form.print_speed_mm_s} mm/s</span>
              </div>
              <Slider value={[form.print_speed_mm_s]} onValueChange={([v]) => set('print_speed_mm_s', v)}
                min={10} max={200} step={5} className="mt-2" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-xs">Supports</Label>
              <Switch checked={form.supports} onCheckedChange={(v) => set('supports', v)} />
            </div>
          </div>
        </div>

        {/* Advanced Costs */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 overflow-hidden">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-6 text-sm font-semibold text-slate-400 uppercase tracking-wider hover:bg-white/[0.02] transition-colors">
            <span>Additional Costs (Optional)</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showAdvanced && (
            <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300 text-xs">Electricity ($)</Label>
                <Input type="number" step="0.01" value={form.electricity_cost} onChange={(e) => set('electricity_cost', e.target.value)} min="0"
                  className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Labor ($)</Label>
                <Input type="number" step="0.01" value={form.labor_cost} onChange={(e) => set('labor_cost', e.target.value)} min="0"
                  className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Machine Wear ($)</Label>
                <Input type="number" step="0.01" value={form.machine_wear_cost} onChange={(e) => set('machine_wear_cost', e.target.value)} min="0"
                  className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Cost Summary */}
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Cost Estimate</h2>
          </div>
          <div className="space-y-2">
            <CostLine label="Filament cost" value={filamentCost} />
            {Number(form.electricity_cost) > 0 && <CostLine label="Electricity" value={Number(form.electricity_cost)} />}
            {Number(form.labor_cost) > 0 && <CostLine label="Labor" value={Number(form.labor_cost)} />}
            {Number(form.machine_wear_cost) > 0 && <CostLine label="Machine wear" value={Number(form.machine_wear_cost)} />}
            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
              <span className="text-sm font-semibold text-white">Total</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6">
          <Label className="text-slate-300 text-xs">Notes</Label>
          <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
            placeholder="Any notes about this print..."
            className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600 h-20" />
        </div>

        <div className="flex justify-end gap-3">
          <Link to={createPageUrl("Prints")}>
            <Button type="button" variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[120px]">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Print</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CostLine({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-white font-mono">${value.toFixed(2)}</span>
    </div>
  );
}