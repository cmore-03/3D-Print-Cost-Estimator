import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from 'react-router-dom';

const MATERIALS = ["PLA", "ABS", "PETG", "TPU", "Nylon", "ASA", "PC", "PVA", "HIPS", "Wood", "Carbon Fiber", "Other"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "INR", "BRL", "Other"];

const DENSITY_MAP = {
  PLA: 1.24, ABS: 1.04, PETG: 1.27, TPU: 1.21, Nylon: 1.14, ASA: 1.07,
  PC: 1.20, PVA: 1.23, HIPS: 1.04, Wood: 1.15, "Carbon Fiber": 1.30, Other: 1.20,
};

export default function AddSpool() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    material: 'PLA',
    color: '',
    color_hex: '#22d3ee',
    total_weight_g: 1000,
    remaining_weight_g: 1000,
    cost_per_spool: '',
    currency: 'USD',
    diameter_mm: 1.75,
    density_g_cm3: DENSITY_MAP.PLA,
    print_temp_min: 190,
    print_temp_max: 220,
    bed_temp_min: 50,
    bed_temp_max: 70,
    purchase_date: '',
    purchase_url: '',
    notes: '',
    status: 'active',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleMaterialChange = (mat) => {
    set('material', mat);
    set('density_g_cm3', DENSITY_MAP[mat] || 1.20);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.FilamentSpool.create({
      ...form,
      total_weight_g: Number(form.total_weight_g),
      remaining_weight_g: Number(form.remaining_weight_g),
      cost_per_spool: Number(form.cost_per_spool),
      density_g_cm3: Number(form.density_g_cm3),
      print_temp_min: Number(form.print_temp_min),
      print_temp_max: Number(form.print_temp_max),
      bed_temp_min: Number(form.bed_temp_min),
      bed_temp_max: Number(form.bed_temp_max),
    });
    navigate(createPageUrl("Spools"));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Spools")}>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Spool</h1>
          <p className="text-slate-500 text-sm mt-0.5">Enter your filament spool details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Basic Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="text-slate-300 text-xs">Name *</Label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required
                placeholder="e.g., Blue PLA - Hatchbox"
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Brand</Label>
              <Input value={form.brand} onChange={(e) => set('brand', e.target.value)}
                placeholder="e.g., Hatchbox"
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Material *</Label>
              <Select value={form.material} onValueChange={handleMaterialChange}>
                <SelectTrigger className="mt-1.5 bg-slate-800/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIALS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Color</Label>
              <Input value={form.color} onChange={(e) => set('color', e.target.value)}
                placeholder="e.g., Ocean Blue"
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Color Swatch</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <input type="color" value={form.color_hex} onChange={(e) => set('color_hex', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10" />
                <span className="text-xs text-slate-500 font-mono">{form.color_hex}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weight & Cost */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Weight & Cost</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300 text-xs">Spool Weight (g) *</Label>
              <Input type="number" value={form.total_weight_g} onChange={(e) => {
                set('total_weight_g', e.target.value);
                set('remaining_weight_g', e.target.value);
              }} required min="0"
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Cost *</Label>
              <Input type="number" step="0.01" value={form.cost_per_spool} onChange={(e) => set('cost_per_spool', e.target.value)} required min="0"
                placeholder="0.00"
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Currency</Label>
              <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                <SelectTrigger className="mt-1.5 bg-slate-800/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Technical */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Technical Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300 text-xs">Diameter (mm)</Label>
              <Select value={String(form.diameter_mm)} onValueChange={(v) => set('diameter_mm', Number(v))}>
                <SelectTrigger className="mt-1.5 bg-slate-800/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.75">1.75mm</SelectItem>
                  <SelectItem value="2.85">2.85mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Density (g/cm³)</Label>
              <Input type="number" step="0.01" value={form.density_g_cm3} onChange={(e) => set('density_g_cm3', e.target.value)}
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Nozzle Temp Min (°C)</Label>
              <Input type="number" value={form.print_temp_min} onChange={(e) => set('print_temp_min', e.target.value)}
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Nozzle Temp Max (°C)</Label>
              <Input type="number" value={form.print_temp_max} onChange={(e) => set('print_temp_max', e.target.value)}
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Bed Temp Min (°C)</Label>
              <Input type="number" value={form.bed_temp_min} onChange={(e) => set('bed_temp_min', e.target.value)}
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Bed Temp Max (°C)</Label>
              <Input type="number" value={form.bed_temp_max} onChange={(e) => set('bed_temp_max', e.target.value)}
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Additional</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 text-xs">Purchase Date</Label>
              <Input type="date" value={form.purchase_date} onChange={(e) => set('purchase_date', e.target.value)}
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Purchase URL</Label>
              <Input value={form.purchase_url} onChange={(e) => set('purchase_url', e.target.value)}
                placeholder="https://..."
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-slate-300 text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                placeholder="Any notes about this spool..."
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-600 h-20" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to={createPageUrl("Spools")}>
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
              <><Save className="w-4 h-4 mr-2" /> Save Spool</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
