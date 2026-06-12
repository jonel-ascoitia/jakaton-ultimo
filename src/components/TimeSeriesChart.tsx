import React, { useState } from "react";
import { Channel, Snapshot } from "../types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, HelpCircle, Eye, Users, Layers } from "lucide-react";

interface TimeSeriesChartProps {
  channels: Channel[];
  snapshots: Snapshot[];
}

export default function TimeSeriesChart({ channels, snapshots }: TimeSeriesChartProps) {
  // Metric toggle filter: 'subscribers' or 'totalViews'
  const [metricMode, setMetricMode] = useState<"subscribers" | "totalViews">("subscribers");
  // Multi-select tracking for visible channels (defaults to all visible)
  const [hiddenChannelIds, setHiddenChannelIds] = useState<string[]>([]);

  // 1. Gather all unique dates
  const uniqueDates = Array.from(new Set(snapshots.map((s) => s.date))).sort();

  // Helper to interpolate missing values for whichever metric is targeted
  function interpolateMissingValue(
    channelId: string,
    targetDateStr: string,
    allSnaps: Snapshot[],
    metricKey: "subscribers" | "totalViews"
  ): number | null {
    const channelSnaps = allSnaps
      .filter((s) => s.channelId === channelId)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (channelSnaps.length === 0) return null;

    const targetTime = new Date(targetDateStr).getTime();

    // Find the closest snap before and closest snap after
    let before: Snapshot | null = null;
    let after: Snapshot | null = null;

    for (const snap of channelSnaps) {
      const snapTime = new Date(snap.date).getTime();
      if (snapTime < targetTime) {
        before = snap;
      } else if (snapTime > targetTime && !after) {
        after = snap;
        break;
      }
    }

    if (before && after) {
      const beforeTime = new Date(before.date).getTime();
      const afterTime = new Date(after.date).getTime();
      const fraction = (targetTime - beforeTime) / (afterTime - beforeTime);
      return Math.round(before[metricKey] + fraction * (after[metricKey] - before[metricKey]));
    }

    // fallback if we have only one sided reference
    if (before) return before[metricKey];
    if (after) return after[metricKey];

    return null;
  }
  
  // 2. Map dates to dataset, filtering out hidden channels to keep line metrics clean
  const chartData = uniqueDates.map((date) => {
    const datum: { [key: string]: any } = { date };
    channels.forEach((chan) => {
      // If hidden, do not inject to keep line blank/unrendered from Recharts
      if (hiddenChannelIds.includes(chan.id)) {
        return;
      }
      
      // Find snapshot for this channel and date
      const snap = snapshots.find((s) => s.channelId === chan.id && s.date === date);
      if (snap) {
        datum[chan.customName] = snap[metricMode];
      } else {
        // If snapshot is missing, perform linear interpolation to avoid dropping to zero!
        datum[chan.customName] = interpolateMissingValue(chan.id, date, snapshots, metricMode);
      }
    });
    return datum;
  });

  const toggleChannelVisibility = (channelId: string) => {
    if (hiddenChannelIds.includes(channelId)) {
      setHiddenChannelIds(hiddenChannelIds.filter((id) => id !== channelId));
    } else {
      // Must leave at least one active to avoid empty chart crashes
      if (hiddenChannelIds.length < channels.length - 1) {
        setHiddenChannelIds([...hiddenChannelIds, channelId]);
      }
    }
  };

  const metricKey = metricMode;

  // Pre-selected color palette for channels
  const lineColors = ["#0ea5e9", "#10b981", "#8b5cf6", "#f43f5e", "#f59e0b", "#6366f1", "#14b8a6"];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
      {/* Chart controls and header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-50">
        <div>
          <h2 className="text-base font-sans font-black text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-sky-500" />
            Evolución Histórica Interactiva (Tendencias)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Serie temporal multivariable. Alterne el indicador principal o filtre canales haciendo clic en las marcas.
          </p>
        </div>

        {/* Dynamic Metric selector */}
        <div className="flex items-center gap-1.5 self-start bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMetricMode("subscribers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
              metricMode === "subscribers"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users size={13} />
            Audiencia
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("totalViews")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
              metricMode === "totalViews"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye size={13} />
            Visualizaciones
          </button>
        </div>
      </div>

      {/* Channel series badges filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Layers size={11} />
          Filtrar Curvas:
        </span>
        {channels.map((chan, idx) => {
          const isHidden = hiddenChannelIds.includes(chan.id);
          const color = lineColors[idx % lineColors.length];
          return (
            <button
              key={chan.id}
              onClick={() => toggleChannelVisibility(chan.id)}
              className={`text-xs px-3 py-1 rounded-lg border font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isHidden
                  ? "bg-white border-slate-200 text-slate-350 line-through decoration-slate-300"
                  : "bg-white text-slate-700 shadow-sm"
              }`}
              style={{ borderLeft: isHidden ? undefined : `4px solid ${color}` }}
              title={isHidden ? "Haga clic para activar la curva" : "Haga clic para ocultar de la serie"}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: isHidden ? "#cbd5e1" : color }}
              />
              {chan.customName}
            </button>
          );
        })}
      </div>

      {chartData.length > 0 && channels.length > hiddenChannelIds.length ? (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                dy={8}
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.toLocaleString()}
                dx={-8}
                fontFamily="JetBrains Mono, monospace"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#0f172a", 
                  borderRadius: "12px", 
                  color: "#fff",
                  border: "none",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }}
                labelStyle={{ fontWeight: "bold", color: "#38bdf8", marginBottom: "4px", fontFamily: "monospace" }}
                formatter={(value: any, name: any) => [
                  <span>
                    <strong className="font-mono text-white">{Number(value).toLocaleString()}</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {metricMode === "subscribers" ? "Seguidores/Miembros" : "Visualizaciones Acumuladas"}
                    </span>
                  </span>,
                  name
                ]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
              />
              {channels.map((chan, idx) => {
                if (hiddenChannelIds.includes(chan.id)) return null;
                return (
                  <Line
                    key={chan.id}
                    type="monotone"
                    dataKey={chan.customName}
                    stroke={lineColors[idx % lineColors.length]}
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 3, strokeWidth: 1 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-85 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-6 text-center">
          <HelpCircle size={32} className="text-slate-300 animate-pulse mb-2" />
          <p className="text-sm text-slate-400 font-mono italic">
            {channels.length === hiddenChannelIds.length 
              ? "Ha filtrado todas las curvas. Por favor reactive al menos un canal para visualizar la serie."
              : "No hay suficientes snapshots cargados para dibujar la serie temporal."}
          </p>
        </div>
      )}

      {/* Helpful data notice indicator */}
      <div className="flex items-center gap-1.5 bg-sky-50/50 text-sky-700 px-3 py-2.5 rounded-xl text-[9px] font-mono leading-relaxed border border-sky-100 mt-4">
        <span>💡</span>
        <span>
          <b>Tratamiento Inteligente de Datos Faltantes:</b> Las celdas sin registros diarios se resuelven mediante <b>interpolación lineal</b> automática. Esto evita caídas abruptas a cero debido a días sin ingestas y genera curvas fluidas listas para auditar.
        </span>
      </div>
    </div>
  );
}
