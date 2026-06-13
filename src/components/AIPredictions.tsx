import React, { useState } from "react";
import { Channel, Snapshot } from "../types";
import { TrendingUp, TrendingDown, Minus, Brain, Loader2, Target, Calendar, Users } from "lucide-react";

interface AIPredictionsProps {
  channels: Channel[];
  snapshots: Snapshot[];
  geminiApiKey: string;
}

interface Prediction {
  channelId: string;
  channelName: string;
  currentSubs: number;
  dailyGrowthRate: number;
  weeklyGrowthRate: number;
  trend: "up" | "down" | "stable";
  milestone50k?: number | null;
  milestone100k?: number | null;
  milestone500k?: number | null;
  aiSummary: string;
  confidence: "Alta" | "Media" | "Baja";
}

export default function AIPredictions({ channels, snapshots, geminiApiKey }: AIPredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runPredictions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai-predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey })
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setPredictions(data.predictions);
        setLastRun(new Date().toLocaleTimeString("es-ES"));
      } else {
        throw new Error(data.error || "Error desconocido");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const daysToMilestone = (current: number, target: number, dailyRate: number): number | null => {
    if (current >= target || dailyRate <= 0) return null;
    return Math.ceil((target - current) / dailyRate);
  };

  const formatDays = (days: number | null): string => {
    if (days === null) return "—";
    if (days < 7) return `${days} días`;
    if (days < 30) return `${Math.ceil(days / 7)} semanas`;
    if (days < 365) return `${Math.ceil(days / 30)} meses`;
    return `${(days / 365).toFixed(1)} años`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-base font-sans font-black text-slate-800 flex items-center gap-2">
            <Brain size={18} className="text-violet-500" />
            Predicciones de Crecimiento con IA
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Análisis predictivo impulsado por Gemini AI. Basado en el historial de snapshots reales.
            {lastRun && <span className="ml-2 text-violet-400">· Última actualización: {lastRun}</span>}
          </p>
        </div>
        <button
          onClick={runPredictions}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-sans font-bold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
          {isLoading ? "Analizando con IA..." : "Generar Predicciones"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Empty state */}
      {predictions.length === 0 && !isLoading && (
        <div className="text-center py-16 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
          <Brain size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-400 italic font-mono">
            Presiona "Generar Predicciones" para que la IA analice el crecimiento de tus canales.
          </p>
        </div>
      )}

      {/* Predictions grid */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.map((pred) => (
            <div
              key={pred.channelId}
              className="border border-slate-100 rounded-xl p-5 hover:shadow-md transition-shadow bg-gradient-to-br from-slate-50/50 to-white"
            >
              {/* Channel name + trend */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-sans font-black text-slate-800 truncate max-w-[180px]">{pred.channelName}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{pred.currentSubs.toLocaleString()} suscriptores actuales</p>
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                  pred.trend === "up" ? "bg-emerald-50 text-emerald-600" :
                  pred.trend === "down" ? "bg-red-50 text-red-600" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {pred.trend === "up" ? <TrendingUp size={12} /> : pred.trend === "down" ? <TrendingDown size={12} /> : <Minus size={12} />}
                  {pred.trend === "up" ? "Creciendo" : pred.trend === "down" ? "Bajando" : "Estable"}
                </div>
              </div>

              {/* Growth rates */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white border border-slate-100 rounded-lg p-2 text-center">
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wide">Por Día</p>
                  <p className={`text-sm font-sans font-black ${pred.dailyGrowthRate > 0 ? "text-emerald-600" : pred.dailyGrowthRate < 0 ? "text-red-500" : "text-slate-500"}`}>
                    {pred.dailyGrowthRate > 0 ? "+" : ""}{pred.dailyGrowthRate.toFixed(0)} subs
                  </p>
                </div>
                <div className="bg-white border border-slate-100 rounded-lg p-2 text-center">
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wide">Por Semana</p>
                  <p className={`text-sm font-sans font-black ${pred.weeklyGrowthRate > 0 ? "text-emerald-600" : pred.weeklyGrowthRate < 0 ? "text-red-500" : "text-slate-500"}`}>
                    {pred.weeklyGrowthRate > 0 ? "+" : ""}{pred.weeklyGrowthRate.toFixed(0)} subs
                  </p>
                </div>
              </div>

              {/* Milestones */}
              <div className="mb-3 space-y-1.5">
                {[50000, 100000, 500000].map((milestone) => {
                  const days = pred.currentSubs < milestone ? daysToMilestone(pred.currentSubs, milestone, pred.dailyGrowthRate) : -1;
                  if (pred.currentSubs >= milestone) return null;
                  return (
                    <div key={milestone} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500 font-mono">
                        <Target size={10} className="text-violet-400" />
                        {milestone >= 1000 ? `${milestone/1000}K subs` : milestone}
                      </span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Calendar size={10} />
                        {days && days > 0 ? formatDays(days) : pred.dailyGrowthRate <= 0 ? "Sin crecimiento" : "¡Ya alcanzado!"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* AI Summary */}
              <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                <p className="text-[10px] font-mono text-violet-600 leading-relaxed">{pred.aiSummary}</p>
              </div>

              {/* Confidence */}
              <div className="mt-2 flex items-center justify-end gap-1">
                <span className="text-[9px] text-slate-400 font-mono">Confianza:</span>
                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                  pred.confidence === "Alta" ? "bg-emerald-50 text-emerald-600" :
                  pred.confidence === "Media" ? "bg-amber-50 text-amber-600" :
                  "bg-red-50 text-red-600"
                }`}>{pred.confidence}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
