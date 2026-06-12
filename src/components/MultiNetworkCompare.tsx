import React from "react";
import { Channel, Snapshot, Video } from "../types";
import { getPlatformSummary, PlatformSummary } from "../utils";
import { Users, TrendingUp, Eye, Activity, Award } from "lucide-react";
import { motion } from "motion/react";

interface MultiNetworkCompareProps {
  channels: Channel[];
  snapshots: Snapshot[];
  videos: Video[];
}

export default function MultiNetworkCompare({
  channels,
  snapshots,
  videos
}: MultiNetworkCompareProps) {
  const summaries = getPlatformSummary(channels, snapshots, videos);

  // Find the platform with the highest growth rate
  const winner = [...summaries]
    .filter((s) => s.totalSubscribers > 0)
    .sort((a, b) => b.growthRate - a.growthRate)[0];

  const getCardStyle = (platform: string) => {
    switch (platform) {
      case "youtube":
        return {
          bg: "bg-red-50/40 border-red-100",
          accent: "text-red-600",
          badge: "bg-red-100 text-red-800"
        };
      case "facebook":
        return {
          bg: "bg-blue-50/40 border-blue-100",
          accent: "text-blue-600",
          badge: "bg-blue-100 text-blue-800"
        };
      case "instagram":
        return {
          bg: "bg-pink-50/40 border-pink-100",
          accent: "text-pink-600",
          badge: "bg-pink-100 text-pink-800"
        };
      case "facebook_group":
      default:
        return {
          bg: "bg-teal-50/40 border-teal-100",
          accent: "text-teal-600",
          badge: "bg-teal-100 text-teal-800"
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-sans font-black text-slate-800 flex items-center gap-2">
            <Award size={20} className="text-teal-500" />
            Consolidado Unificado Multi-Red (Comparación)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas consolidadas de comunidad, interacción y velocidad de crecimiento comparativa de todos los frentes.
          </p>
        </div>

        {winner && winner.growthRate > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-150 rounded-xl text-xs font-sans text-emerald-800 font-bold self-start">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Red con Mayor Velocidad: {winner.name} (+{winner.growthRate.toFixed(2)}%)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaries.map((summary) => {
          const style = getCardStyle(summary.platform);
          return (
            <div
              key={summary.platform}
              className={`rounded-xl p-5 border ${style.bg} hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${style.badge}`}>
                    {summary.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {summary.postCount} posts
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* Audiencia */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase font-medium">Audiencia Acumulada</span>
                    <span className="text-xl font-sans font-black text-slate-800 leading-none flex items-baseline gap-1">
                      {summary.totalSubscribers.toLocaleString()}
                      <span className="text-xs font-normal text-slate-400">
                        {summary.platform === "facebook_group" ? "miembros" : "seguidores"}
                      </span>
                    </span>
                  </div>

                  {/* Growth rate */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase font-medium">Velocidad de Crecimiento</span>
                    <span className={`text-sm font-mono font-bold flex items-center gap-1 ${summary.growthRate > 0 ? "text-emerald-600" : summary.growthRate < 0 ? "text-rose-500" : "text-slate-400"}`}>
                      {summary.growthRate > 0 ? `+${summary.growthRate.toFixed(2)}%` : `${summary.growthRate.toFixed(2)}%`}
                    </span>
                  </div>

                  {/* Views */}
                  {summary.platform !== "facebook_group" && (
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase font-medium">Visualizaciones Totales</span>
                      <span className="text-sm font-sans font-bold text-slate-700">
                        {summary.totalViews.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Avg Engagement */}
                  {summary.platform !== "facebook_group" && (
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase font-medium">Engagement Rate Promedio</span>
                      <span className="text-sm font-mono font-black text-slate-800">
                        {summary.avgEngagement.toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
