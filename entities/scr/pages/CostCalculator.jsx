import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calculator, Package, Info, Upload, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function CostCalculator() {
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

  const [spoolId, setSpoolId] = useState('');
  const [printerId, setPrinterId] = useState('');
  const [weight, setWeight] = useState(50);
  const [infill, setInfill] = useState(20);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [supports, setSupports] = useState(false);
  const [printTimeMin, setPrintTimeMin] = useState(120);
  const [electricityRate, setElectricityRate] = useState(0.12);
  const [printerWattage, setPrinterWattage] = useState(200);
  const [laborRate, setLaborRate] = useState(0);
  const [wearRate, setWearRate] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(null);

  const selectedSpool = useMemo(
    () => spools.find(s => s.id === spoolId),
    [spoolId, spools]
  );

  const selectedPrinter = useMemo(
    () => printers.find(p => p.id === printerId),
    [printerId, printers]
  );

  // Update wattage when printer changes
  React.useEffect(() => {
    if (selectedPrinter) {
      setPrinterWattage(selectedPrinter.wattage);
    }
  }, [selectedPrinter]);

  const costPerGram = selectedSpool && selectedSpool.total_weight_g > 0
    ? selectedSpool.cost_per_spool / selectedSpool.total_weight_g : 0;

  const filamentCost = costPerGram * weight;
  const electricityCost = (printerWattage / 1000) * (printTimeMin / 60) * electricityRate;
  const laborCost = laborRate * (printTimeMin / 60);
  const wearCost = wearRate * (printTimeMin / 60);
  const totalCost = filamentCost + electricityCost + laborCost + wearCost;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setFileName(file.name);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Analyze 3D model with LLM
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Estimate filament weight (grams) and print time (minutes). Layer: ${layerHeight}mm, infill: ${infill}%, speed: 60mm/s.`,
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
        setWeight(Math.round(result.weight_grams));
      }
      if (result?.print_time_minutes) {
        setPrintTimeMin(Math.round(result.print_time_minutes));
        setEstimatedTime(`${Math.floor(result.print_time_minutes / 60)}h ${Math.round(result.print_time_minutes % 60)}m`);
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Cost Calculator</h1>
        <p className="text-slate-500 mt-1">Estimate the cost of your next 3D print</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Controls */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filament */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Filament</h2>
            
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
                <Info className="w-3 h-3" /> AI will analyze your model and estimate filament weight
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-xs">Spool</Label>
                <Select value={spoolId} onValueChange={setSpoolId}>
                  <SelectTrigger className="mt-1.5 bg-slate-800/50 border-white/10 text-white">
                    <SelectValue placeholder="Select a spool" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSpools.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — ${(s.cost_per_spool / s.total_weight_g).toFixed(3)}/g
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Printer</Label>
                <Select value={printerId} onValueChange={setPrinterId}>
                  <SelectTrigger className="mt-1.5 bg-slate-800/50 border-white/10 text-white">
                    <SelectValue placeholder="Select a printer" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePrinters.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.wattage}W)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!spoolId && !printerId && (
              <p className="text-xs text-slate-600 flex items-center gap-1">
                <Info className="w-3 h-3" /> Select spool and printer for accurate estimates
              </p>
            )}
            <div>
              <div className="flex justify-between">
                <Label className="text-slate-300 text-xs">Estimated Weight</Label>
                <span className="text-xs text-cyan-400 font-mono">{weight}g</span>
              </div>
              <Slider value={[weight]} onValueChange={([v]) => setWeight(v)}
                min={1} max={1000} step={1} className="mt-2" />
            </div>
          </div>

          {/* Print Settings */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Print Settings</h2>
            <div>
              <div className="flex justify-between">
                <Label className="text-slate-300 text-xs">Infill Density</Label>
                <span className="text-xs text-cyan-400 font-mono">{infill}%</span>
              </div>
              <Slider value={[infill]} onValueChange={([v]) => setInfill(v)}
                min={0} max={100} step={5} className="mt-2" />
            </div>
            <div>
              <div className="flex justify-between">
                <Label className="text-slate-300 text-xs">Layer Height</Label>
                <span className="text-xs text-cyan-400 font-mono">{layerHeight}mm</span>
              </div>
              <Slider value={[layerHeight]} onValueChange={([v]) => setLayerHeight(v)}
                min={0.05} max={0.4} step={0.05} className="mt-2" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-xs">Supports</Label>
              <Switch checked={supports} onCheckedChange={setSupports} />
            </div>
            <div>
              <div className="flex justify-between">
                <Label className="text-slate-300 text-xs">Print Time {estimatedTime && <span className="text-[10px] text-emerald-400 ml-1">(AI estimated)</span>}</Label>
                <span className="text-xs text-cyan-400 font-mono">{Math.floor(printTimeMin / 60)}h {printTimeMin % 60}m</span>
              </div>
              <Slider value={[printTimeMin]} onValueChange={([v]) => { setPrintTimeMin(v); setEstimatedTime(null); }}
                min={5} max={2880} step={5} className="mt-2" />
            </div>
          </div>

          {/* Overhead */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Overhead Costs</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 text-xs">Electricity Rate ($/kWh)</Label>
                <Input type="number" step="0.01" value={electricityRate} onChange={(e) => setElectricityRate(Number(e.target.value))} min="0"
                  className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Printer Wattage (W)</Label>
                <Input type="number" value={printerWattage} onChange={(e) => setPrinterWattage(Number(e.target.value))} min="0"
                  className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Labor Rate ($/hr)</Label>
                <Input type="number" step="0.01" value={laborRate} onChange={(e) => setLaborRate(Number(e.target.value))} min="0"
                  className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs">Machine Wear ($/hr)</Label>
                <Input type="number" step="0.01" value={wearRate} onChange={(e) => setWearRate(Number(e.target.value))} min="0"
                  className="mt-1.5 bg-slate-800/50 border-white/10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 sticky top-6 space-y-6">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Cost Breakdown</h2>
            </div>

            {selectedSpool && (
              <div className="rounded-xl bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedSpool.color_hex || '#22d3ee' }} />
                  <span className="text-sm text-white font-medium">{selectedSpool.name}</span>
                </div>
                <p className="text-xs text-slate-500">${costPerGram.toFixed(3)}/g • {selectedSpool.remaining_weight_g?.toFixed(0)}g remaining</p>
              </div>
            )}

            <div className="space-y-3">
              <CostRow label="Filament" value={filamentCost} />
              <CostRow label="Electricity" value={electricityCost} />
              {laborCost > 0 && <CostRow label="Labor" value={laborCost} />}
              {wearCost > 0 && <CostRow label="Machine wear" value={wearCost} />}
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold text-white">Total Cost</span>
                  <span className="text-3xl font-bold text-cyan-400 font-mono">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {selectedSpool && weight > 0 && (
              <div className="text-xs text-slate-500 space-y-1">
                <p>Cost per gram: ${(totalCost / weight).toFixed(3)}</p>
                {printTimeMin > 0 && <p>Cost per hour: ${(totalCost / (printTimeMin / 60)).toFixed(2)}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CostRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-white font-mono">${value.toFixed(2)}</span>
    </div>
  );
}
