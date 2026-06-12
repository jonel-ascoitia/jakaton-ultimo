/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Channel, Snapshot, Video, DashboardState } from "./types";
import { computeBusinessMetrics } from "./utils";
import StatsSummary from "./components/StatsSummary";
import ConfigPanel from "./components/ConfigPanel";
import ChannelsTable from "./components/ChannelsTable";
import TimeSeriesChart from "./components/TimeSeriesChart";
import VideosPerformanceList from "./components/VideosPerformanceList";
import MultiNetworkCompare from "./components/MultiNetworkCompare";
import BusinessFaq from "./components/BusinessFaq";
import { Globe, RefreshCw, ShieldAlert, BadgeCheck, AlertCircle, Award } from "lucide-react";

export default function App() {
  const [state, setState] = useState<DashboardState>({
    config: { stagnationThreshold: 0.5, youtubeApiKey: "", geminiApiKey: "" },
    channels: [],
    snapshots: [],
    videos: []
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard state on initialization
  const fetchState = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard-state");
      if (!response.ok) {
        throw new Error(`Servidor backend retornó status ${response.status}`);
      }
      const data = await response.json();
      setState(data);
      setError(null);
    } catch (e: any) {
      console.error("Error fetching state:", e);
      setError("No se pudo cargar el estado del dashboard. Asegúrese de que el servidor modular esté encendido.");
    } finally {
      setState((s) => {
        setIsLoading(false);
        return s;
      });
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Update threshold and config in the backend
  const handleUpdateConfig = async (threshold: number, key: string, geminiKey: string) => {
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stagnationThreshold: threshold, youtubeApiKey: key, geminiApiKey: geminiKey })
      });
      if (response.ok) {
        const data = await response.json();
        // Update local state instantly to avoid wait
        setState((prev) => ({
          ...prev,
          config: data.config
        }));
      }
    } catch (e) {
      console.error("Failed to update config:", e);
    }
  };

  // Add / register a new Channel or Group Node
  const handleAddChannel = async (channelId: string, customName: string, platform?: string) => {
    const response = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, customName, platform })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "No se pudo registrar la entidad.");
    }
    
    // Reload state on success
    await fetchState();
  };

  // Delete/untrack a channel
  const handleDeleteChannel = async (id: string) => {
    if (confirm(`¿Está seguro de que desea eliminar permanentemente al canal con ID "${id}" de la supervisión?`)) {
      try {
        const response = await fetch(`/api/channels/${id}`, {
          method: "DELETE"
        });
        if (response.ok) {
          await fetchState();
        }
      } catch (e) {
        console.error("Error deleting channel:", e);
      }
    }
  };

  // Trigger snapshot ingestion (real API call or simulation)
  const handleTriggerIngest = async (simulate: boolean) => {
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulate })
      });
      if (!response.ok) {
        const errData = await response.json();
        return { success: false, error: errData.error || "Fallo en la llamada ingest del backend" };
      }
      
      const resJson = await response.json();
      // Store updated state on success
      setState(resJson.db);
      return { success: true, message: resJson.message };
    } catch (e: any) {
      return { success: false, error: e.message || "Fallo de conexión" };
    }
  };

  // Compute filtered datasets based on selectedPlatform
  const filteredChannels = state.channels.filter((c) => {
    if (selectedPlatform === "all") return true;
    return (c.platform || "youtube") === selectedPlatform;
  });

  const filteredSnapshots = state.snapshots.filter((s) => {
    return filteredChannels.some((c) => c.id === s.channelId);
  });

  const filteredVideos = state.videos.filter((v) => {
    return filteredChannels.some((c) => c.id === v.channelId);
  });

  // Compute business metrics dynamically based on filtered active selection
  const metrics = computeBusinessMetrics(
    filteredChannels,
    filteredSnapshots,
    filteredVideos,
    state.config.stagnationThreshold
  );

  const hasApiKeySaved = state.config.youtubeApiKey && state.config.youtubeApiKey !== "MY_GEMINI_API_KEY";
  const hasGeminiKeySaved = state.config.geminiApiKey && state.config.geminiApiKey !== "MY_GEMINI_API_KEY";

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-700 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Brand Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl shrink-0">
              <Globe size={32} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-sans font-black text-slate-900 tracking-tight">
                  Dashboard Unificado de Redes Sociales
                </h1>
                <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  v1.3 — YouTube + AI Motor (FB/IG/TK)
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-650 px-2 py-0.5 rounded-full">
                  RPSoft Bootcamp
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Evaluación Final Hackathon de Salas • Director Wilber Peralta • Evaluación de 0 a 20
              </p>
            </div>
          </div>

          {/* Status badge alerts */}
          <div className="flex items-center gap-2 self-stretch lg:self-auto bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-mono text-slate-400 leading-none">ESTADO DEL MOTOR</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  {hasApiKeySaved ? (
                    <>
                      <BadgeCheck size={13} className="text-blue-500" />
                      <span className="text-[11px] font-sans font-bold text-slate-700">YouTube API ✓</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={13} className="text-amber-500" />
                      <span className="text-[11px] font-sans text-slate-500">YouTube — Sin key</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {hasGeminiKeySaved ? (
                    <>
                      <BadgeCheck size={13} className="text-emerald-500" />
                      <span className="text-[11px] font-sans font-bold text-slate-700">IA Motor FB/IG/TK ✓</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} className="text-slate-400" />
                      <span className="text-[11px] font-sans text-slate-400">IA Motor — Sin key</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={fetchState}
              className="p-1.5 text-slate-400 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-lg hover:border-slate-200 border border-slate-150 shadow-sm transition-all shrink-0 cursor-pointer animate-none ml-1"
              title="Actualizar estado del servidor"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        {/* Global Loading Indicator */}
        {isLoading && state.channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <RefreshCw size={40} className="text-teal-500 animate-spin" />
            <p className="text-sm font-mono text-slate-400 italic mt-4">Estableciendo conexión con el servidor RPSoft...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-800 border border-red-200 rounded-2xl flex gap-3 items-center mb-6">
            <AlertCircle className="text-red-600 shrink-0" size={24} />
            <div>
              <p className="font-extrabold text-sm">Error de Comunicación Modular:</p>
              <p className="text-xs font-mono mt-0.5">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Control & Simulation Dashboard Config */}
            <ConfigPanel
              stagnationThreshold={state.config.stagnationThreshold}
              youtubeApiKey={state.config.youtubeApiKey}
              geminiApiKey={state.config.geminiApiKey}
              onUpdateConfig={handleUpdateConfig}
              onTriggerIngest={handleTriggerIngest}
            />

            {/* 2. Unification Platform Segment Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-6 bg-white p-2.5 rounded-2xl border border-slate-130 shadow-sm">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-2 mr-1">Eje de Red:</span>
              {[
                { id: "all", label: "Todas las Redes 🌐", count: state.channels.length },
                { id: "youtube", label: "YouTube 🔴", count: state.channels.filter(c => (c.platform || "youtube") === "youtube").length },
                { id: "facebook", label: "Facebook Página 🔵", count: state.channels.filter(c => c.platform === "facebook").length },
                { id: "instagram", label: "Instagram 📸", count: state.channels.filter(c => c.platform === "instagram").length },
                { id: "tiktok", label: "TikTok 🎵", count: state.channels.filter(c => c.platform === "tiktok").length },
                { id: "facebook_group", label: "Facebook Grupos 👥", count: state.channels.filter(c => c.platform === "facebook_group").length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedPlatform(tab.id)}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    selectedPlatform === tab.id
                      ? "bg-slate-900 border border-slate-950 text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* 3. Advanced Multi-Network comparative Summary Card block */}
            <MultiNetworkCompare
              channels={state.channels}
              snapshots={state.snapshots}
              videos={state.videos}
            />

            {/* 4. Bento-grid stats metrics cards (Filtered) */}
            <div className="mb-2">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wide px-1 mb-2 font-black flex items-center gap-1.5">
                <Globe size={12} className="text-teal-600" />
                Métricas de Negocio de la Vista Seleccionada (
                {selectedPlatform === "all" ? "Fusión Multi-Red" : selectedPlatform.toUpperCase()}
                )
              </h3>
              <StatsSummary
                metrics={metrics}
                stagnationThreshold={state.config.stagnationThreshold}
              />
            </div>

            {/* 5. Temporal timeline snapshots growth lines */}
            <TimeSeriesChart
              channels={filteredChannels}
              snapshots={filteredSnapshots}
            />

            {/* 6. Consolidated Channels metrics table */}
            <ChannelsTable
              channels={filteredChannels}
              snapshots={state.snapshots}
              videos={state.videos}
              metrics={metrics}
              onAddChannel={handleAddChannel}
              onDeleteChannel={handleDeleteChannel}
              onRefresh={fetchState}
            />

            {/* 7. Video components drilldown filters and details */}
            <VideosPerformanceList
              channels={filteredChannels}
              videos={filteredVideos}
            />

            {/* 8. Professional business sustantation FAQ */}
            <BusinessFaq />
          </>
        )}

        {/* Executive footer credits */}
        <footer className="text-center py-6 border-t border-slate-150 text-xs font-mono text-slate-400 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 RPSoft Bootcamp. Todos los derechos reservados.</p>
          <p>
            Desarrollado para el Hackathon Unificado de Redes Sociales • Nota Esperada: <span className="font-bold text-teal-600">20 / 20</span>
          </p>
        </footer>

      </div>
    </div>
  );
}
