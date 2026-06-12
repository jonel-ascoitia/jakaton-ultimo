import React from "react";
import { BusinessMetrics } from "../types";
import { TrendingUp, Award, Zap, AlertTriangle, Play, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface StatsSummaryProps {
  metrics: BusinessMetrics;
  stagnationThreshold: number;
}

export default function StatsSummary({ metrics, stagnationThreshold }: StatsSummaryProps) {
  const { fastestGrowingChannel, mostSuccessfulVideo, contentPerformance, stagnationList } = metrics;
  
  const stagnantCount = stagnationList.filter((s) => s.isStagnant).length;
  const healthyCount = stagnationList.length - stagnantCount;

  // Animation variants for standard commercial look
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      {/* 1. Canal Crecimiento Más Rápido */}
      <motion.div 
        id="stat-fastest-channel" 
        variants={cardVariants}
        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-shadow duration-300 hover:shadow-md hover:border-slate-200 cursor-default"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <span className="text-xs font-mono font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
            Líder de Crecimiento
          </span>
        </div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
          Crecimiento Más Rápido
        </h3>
        {fastestGrowingChannel ? (
          <div>
            <p className="text-xl font-sans font-bold text-slate-800 line-clamp-1">
              {fastestGrowingChannel.channel.customName}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-sans font-black text-teal-600">
                +{fastestGrowingChannel.growthRate.toFixed(2)}%
              </span>
              <span className="text-xs text-slate-400">
                tasa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Neto: <span className="font-semibold text-slate-700">+{fastestGrowingChannel.netGrowth.toLocaleString()} subs</span> 
              <br />
              ({fastestGrowingChannel.startSubs.toLocaleString()} → {fastestGrowingChannel.endSubs.toLocaleString()})
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No hay suficientes snapshots para calcular</p>
        )}
      </motion.div>

      {/* 2. Video Más Exitoso */}
      <motion.div 
        id="stat-best-video" 
        variants={cardVariants}
        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-shadow duration-300 hover:shadow-md hover:border-slate-200 cursor-default"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Award size={24} />
          </div>
          <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Top Publicación
          </span>
        </div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
          Video Más Exitoso
        </h3>
        {mostSuccessfulVideo ? (
          <div>
            <p className="text-sm font-sans font-bold text-slate-800 line-clamp-1" title={mostSuccessfulVideo.video.title}>
              {mostSuccessfulVideo.video.title}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Canal: {mostSuccessfulVideo.channel.customName}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-sans font-black text-blue-600">
                {mostSuccessfulVideo.interactions.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                interacciones
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Engagement: <span className="font-semibold text-blue-600">{mostSuccessfulVideo.engagementRate.toFixed(2)}%</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No hay videos en el sistema para calcular</p>
        )}
      </motion.div>

      {/* 3. Formato Dominante */}
      <motion.div 
        id="stat-format-duel" 
        variants={cardVariants}
        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-shadow duration-300 hover:shadow-md hover:border-slate-200 cursor-default"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Zap size={24} />
          </div>
          <span className="text-xs font-mono font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
            Comparación Formatos
          </span>
        </div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
          Mejor Engagement Promedio
        </h3>
        <div className="mt-1">
          <p className="text-xl font-sans font-bold text-slate-800">
            {contentPerformance.winner === "Shorts" ? "🔥 Shorts Dominan" : 
             contentPerformance.winner === "Videos Largos" ? "🎬 Videos Largos" : 
             contentPerformance.winner === "Sin Datos" ? "Sin Datos" : "⚖️ Empate Técnico"}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-50">
            <div>
              <p className="text-[10px] font-mono text-slate-400">SHORTS (≤ 60s)</p>
              <p className="text-sm font-sans font-bold text-slate-700">
                {contentPerformance.shorts.avgEngagement.toFixed(2)}%
              </p>
              <p className="text-[9px] font-mono text-slate-400">({contentPerformance.shorts.count} vids)</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-400">LARGOS (&gt; 60s)</p>
              <p className="text-sm font-sans font-bold text-slate-700">
                {contentPerformance.longs.avgEngagement.toFixed(2)}%
              </p>
              <p className="text-[9px] font-mono text-slate-400">({contentPerformance.longs.count} vids)</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. Alertas de Estancamiento */}
      <motion.div 
        id="stat-stagnation-alerts" 
        variants={cardVariants}
        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-shadow duration-300 hover:shadow-md hover:border-slate-200 cursor-default"
      >
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 ${stagnantCount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"} rounded-xl`}>
            <AlertTriangle size={24} />
          </div>
          <span className={`text-xs font-mono font-medium ${stagnantCount > 0 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"} px-2.5 py-1 rounded-full`}>
            Umbral: {stagnationThreshold}%
          </span>
        </div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
          Estado de Canales
        </h3>
        <div className="mt-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-sans font-black ${stagnantCount > 0 ? "text-amber-500" : "text-emerald-600"}`}>
              {stagnantCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              estancados de {stagnationList.length}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden flex">
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${stagnationList.length > 0 ? (stagnantCount / stagnationList.length) * 100 : 0}%` }}
            />
            <div 
              className="bg-emerald-500 h-full flex-1 transition-all duration-500" 
              style={{ width: `${stagnationList.length > 0 ? (healthyCount / stagnationList.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">
            {healthyCount} canales crecen por encima de {stagnationThreshold}%
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
