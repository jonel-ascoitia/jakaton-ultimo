import React, { useState } from "react";
import { Channel, Snapshot, Video, BusinessMetrics } from "../types";
import { Trash2, AlertOctagon, TrendingUp, TrendingDown, HelpCircle, UserPlus, Sparkles, Database, Send, Calendar } from "lucide-react";
import { calculateChannelAverageEngagement } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface ChannelsTableProps {
  channels: Channel[];
  snapshots: Snapshot[];
  videos: Video[];
  metrics: BusinessMetrics;
  onAddChannel: (id: string, name: string, platform?: string) => Promise<void>;
  onDeleteChannel: (id: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export default function ChannelsTable({
  channels,
  snapshots,
  videos,
  metrics,
  onAddChannel,
  onDeleteChannel,
  onRefresh
}: ChannelsTableProps) {
  const [newChannelId, setNewChannelId] = useState<string>("");
  const [newChannelName, setNewChannelName] = useState<string>("");
  const [addPlatform, setAddPlatform] = useState<string>("youtube");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for manual metric snapshot uploading
  const [showManualForm, setShowManualForm] = useState<boolean>(false);
  const [manualChanId, setManualChanId] = useState<string>("");
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [manualSubs, setManualSubs] = useState<string>("");
  const [manualViews, setManualViews] = useState<string>("");
  const [manualVids, setManualVids] = useState<string>("");
  const [isManualLoading, setIsManualLoading] = useState<boolean>(false);

  const handleAddSubmit = async (e: React.FormEvent, directId?: string, directName?: string, directPlatform?: string) => {
    if (e) e.preventDefault();
    const idToUse = directId || newChannelId;
    const nameToUse = directName || newChannelName;
    const platformToUse = directPlatform || addPlatform;
    
    if (!idToUse.trim()) return;

    setIsAdding(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onAddChannel(idToUse.trim(), nameToUse.trim(), platformToUse);
      setSuccessMsg(`¡Entidad "${nameToUse || idToUse}" de tipo ${platformToUse} registrada con éxito!`);
      setNewChannelId("");
      setNewChannelName("");
    } catch (e: any) {
      setErrorMsg(e.message || "Error al registrar el canal/grupo.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleManualMetricsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualChanId || !manualDate || !manualSubs) {
      setErrorMsg("Los campos de ID de canal, fecha e integrantes/seguidores son obligatorios.");
      return;
    }

    setIsManualLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/manual-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: manualChanId,
          date: manualDate,
          subscribers: parseInt(manualSubs),
          totalViews: parseInt(manualViews) || 0,
          videoCount: parseInt(manualVids) || 0
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "No se pudo registrar la métrica.");
      }

      setSuccessMsg("¡Snapshot de carga manual registrado exitosamente!");
      setManualSubs("");
      setManualViews("");
      setManualVids("");

      if (onRefresh) {
        await onRefresh();
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Fallo de conexión al enviar el snapshot manual.");
    } finally {
      setIsManualLoading(false);
    }
  };

  const suggestions = [
    { label: "Hablando Huevadas YouTube", value: "@HablandoHuevadasOficial", alias: "Hablando Huevadas YT", platform: "youtube" },
    { label: "TikTok @rpsoft", value: "rpsoft_bootcamp", alias: "TikTok RPSoft", platform: "tiktok" },
    { label: "Wilber Peralta FB", value: "wilber_peralta", alias: "Wilber Peralta", platform: "facebook" },
    { label: "RPSoft Bootcamp IG", value: "rpsoft_bootcamp_reels", alias: "RPSoft Bootcamp", platform: "instagram" }
  ];

  const getPlatformDetails = (platform: string) => {
    switch (platform) {
      case "facebook":
        return {
          iconColor: "text-blue-500",
          badge: "bg-blue-100 text-blue-800",
          label: "Facebook Página"
        };
      case "instagram":
        return {
          iconColor: "text-pink-500",
          badge: "bg-pink-100 text-pink-800",
          label: "Instagram Feed"
        };
      case "tiktok":
        return {
          iconColor: "text-slate-900",
          badge: "bg-slate-100 text-slate-800 border border-slate-200",
          label: "TikTok 🎵"
        };
      case "facebook_group":
        return {
          iconColor: "text-teal-500",
          badge: "bg-teal-100 text-teal-800",
          label: "FB Grupo (Carga Manual)"
        };
      case "youtube":
      default:
        return {
          iconColor: "text-red-600",
          badge: "bg-red-100 text-red-800",
          label: "YouTube"
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
      {/* Header and forms */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <h2 className="text-base font-sans font-black text-slate-800 flex items-center gap-2">
              <Database size={20} className="text-teal-600" />
              Consolidado General de Redes Monitoreadas
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Supervisión de canales, páginas y comunidades de FB/IG/YT con indicadores calculados.
            </p>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className={`text-xs px-3.5 py-1.5 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
                  showManualForm
                    ? "bg-slate-850 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Calendar size={13} />
                {showManualForm ? "Ocultar Carga Manual" : "Cargar Métricas de Facebook Groups / Snapshots"}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0 w-full lg:w-auto">
            {/* Standard addition form */}
            <form onSubmit={(e) => handleAddSubmit(e)} className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {/* Platform Selector dropdown */}
              <select
                value={addPlatform}
                onChange={(e) => setAddPlatform(e.target.value)}
                disabled={isAdding}
                className="bg-white text-xs border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 shadow-sm transition-all text-slate-705 w-full sm:w-auto"
              >
                <option value="youtube">YouTube 🔴</option>
                <option value="facebook">Facebook Página 🔵</option>
                <option value="instagram">Instagram 📸</option>
                <option value="tiktok">TikTok 🎵</option>
                <option value="facebook_group">Facebook Grupos 👥</option>
              </select>

              <div className="relative w-full sm:w-48">
                <input
                  type="text"
                  placeholder="ID / Url / Handle"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  disabled={isAdding}
                  className="bg-white text-xs border border-slate-200 pl-3 pr-8 py-2 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 font-mono w-full shadow-sm transition-all"
                  required
                />
                <span className="absolute right-2.5 top-2.5 text-slate-350 cursor-help" title="Identificador único del canal, página o grupo">
                  <HelpCircle size={14} />
                </span>
              </div>

              <input
                type="text"
                placeholder="Alias / Nombre"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                disabled={isAdding}
                className="bg-white text-xs border border-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 w-full sm:w-32 shadow-sm transition-all"
              />

              <button
                type="submit"
                disabled={isAdding}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 border border-teal-700 hover:bg-teal-500 active:bg-teal-700 text-white rounded-xl text-xs font-sans font-bold transition-all shadow-sm w-full sm:w-auto justify-center disabled:opacity-50 cursor-pointer"
              >
                <UserPlus size={14} />
                {isAdding ? "Registrando..." : "Agregar Origen"}
              </button>
            </form>

            {/* suggestions tags */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1 justify-end">
              <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1 mr-1">
                <Sparkles size={11} className="text-amber-500" />
                Nueva plantilla rápida:
              </span>
              {suggestions.map((sug) => (
                <button
                  key={sug.value}
                  type="button"
                  disabled={isAdding}
                  onClick={() => {
                    setNewChannelId(sug.value);
                    setNewChannelName(sug.alias);
                    setAddPlatform(sug.platform);
                  }}
                  className="text-[9px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-650 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {/* Render inline manual metrics loading block */}
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-900 border-b border-slate-800"
          >
            <div className="p-6 text-white">
              <h3 className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Database size={14} />
                Formulario de Carga Manual de Snapshots (Facebook Groups y Otros)
              </h3>
              <form onSubmit={handleManualMetricsSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                {/* Select target channel */}
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono text-slate-400 font-semibold mb-1 uppercase tracking-wider">Seleccionar Origen</label>
                  <select
                    value={manualChanId}
                    onChange={(e) => setManualChanId(e.target.value)}
                    required
                    className="w-full bg-slate-950 text-xs border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customName} ({getPlatformDetails(c.platform || "youtube").label})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Snap Date */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 font-semibold mb-1 uppercase tracking-wider">Fecha Snapshot</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 text-xs border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                {/* Subscribers count / Members */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 font-semibold mb-1 uppercase tracking-wider">Integrantes / Suscriptores</label>
                  <input
                    type="number"
                    placeholder="Ej. 1380"
                    value={manualSubs}
                    onChange={(e) => setManualSubs(e.target.value)}
                    required
                    className="w-full bg-slate-950 text-xs border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                {/* Total views (optional) */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 font-semibold mb-1 uppercase tracking-wider">Vistas Totales (Opcional)</label>
                  <input
                    type="number"
                    placeholder="Dejar en 0 si es un Grupo"
                    value={manualViews}
                    onChange={(e) => setManualViews(e.target.value)}
                    className="w-full bg-slate-950 text-xs border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isManualLoading}
                    className="w-full flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-sans font-bold transition-all justify-center disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={13} />
                    {isManualLoading ? "Guardando..." : "Grabar Metricas"}
                  </button>
                </div>
              </form>
              <p className="text-[10px] text-slate-500 font-mono mt-3">
                * Nota: Para Facebook Groups, las APIs no entregan métricas públicas diarias automáticamente. La carga manual en esta sección actualiza el histórico y calcula el crecimiento inmediatamente.
              </p>
            </div>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-6 mt-4 p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs flex gap-2 items-center font-mono shadow-sm"
          >
            <AlertOctagon size={15} className="shrink-0 text-rose-500" />
            <span><b>Atención:</b> {errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-6 mt-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs flex gap-2 items-center font-sans shadow-sm"
          >
            <Sparkles size={15} className="shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table presentation */}
      <div className="overflow-x-auto">
        <table id="channels-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/20 font-mono text-[10px] uppercase text-slate-450 tracking-wider">
              <th className="py-4 px-6 font-semibold">Canal / Platatorma</th>
              <th className="py-4 px-4 font-semibold text-right">Audiencia Actual</th>
              <th className="py-4 px-4 font-semibold text-right">Vistas Totales</th>
              <th className="py-4 px-4 font-semibold text-right">Crecimiento Neto</th>
              <th className="py-4 px-4 font-semibold text-right">Tasa Crecimiento</th>
              <th className="py-4 px-4 font-semibold text-center">Tendencia</th>
              <th className="py-4 px-4 font-semibold text-right">Engagement Prom.</th>
              <th className="py-4 px-4 font-semibold text-center">Estado Alerta</th>
              <th className="py-4 px-6 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {channels.map((channel) => {
              const platform = channel.platform || "youtube";
              const isGroup = platform === "facebook_group";
              const pDetails = getPlatformDetails(platform);

              // Extract calculated stats of channel
              const chanSnaps = snapshots
                .filter((s) => s.channelId === channel.id)
                .sort((a, b) => a.date.localeCompare(b.date));

              const lastSnap = chanSnaps.length > 0 ? chanSnaps[chanSnaps.length - 1] : null;
              const firstSnap = chanSnaps.length > 0 ? chanSnaps[0] : null;

              const subsFin = lastSnap ? lastSnap.subscribers : 0;
              const viewsFin = lastSnap ? lastSnap.totalViews : 0;
              
              const netGrowth = lastSnap && firstSnap ? lastSnap.subscribers - firstSnap.subscribers : 0;
              const startSubs = firstSnap ? firstSnap.subscribers : 0;
              const growthRate = startSubs > 0 ? (netGrowth / startSubs) * 100 : 0;

              const trend = metrics.trends.find((t) => t.channel.id === channel.id);
              const stagnation = metrics.stagnationList.find((s) => s.channel.id === channel.id);
              const avgEngagement = calculateChannelAverageEngagement(channel.id, videos);

              const avatarUrl = channel.snippet?.thumbnails?.default?.url || 
                "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100&h=100&fit=crop";

              return (
                <tr key={channel.id} className="hover:bg-slate-50/70 transition-colors font-sans text-sm text-slate-600">
                  {/* Channel block */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl}
                        alt={channel.title}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-800 font-sans block leading-tight">
                            {channel.customName}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${pDetails.badge}`}>
                            {pDetails.label}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono font-medium block mt-0.5 max-w-[140px] truncate" title={channel.id}>
                          {channel.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Followers count */}
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-800">
                    {subsFin.toLocaleString()}
                    <span className="text-[10px] font-sans font-normal text-slate-400 block mt-0.5">
                      {isGroup ? "miembros" : "seguidores"}
                    </span>
                  </td>

                  {/* Views count */}
                  <td className="py-4 px-4 text-right font-mono text-slate-500">
                    {isGroup ? (
                      <span className="text-slate-300 italic text-xs block">No aplica</span>
                    ) : (
                      viewsFin.toLocaleString()
                    )}
                  </td>

                  {/* Net Growth */}
                  <td className={`py-4 px-4 text-right font-mono font-bold ${netGrowth > 0 ? "text-emerald-600" : netGrowth < 0 ? "text-rose-500" : "text-slate-400"}`}>
                    {netGrowth > 0 ? `+${netGrowth.toLocaleString()}` : netGrowth.toLocaleString()}
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-sans font-normal">neto</span>
                  </td>

                  {/* Growth Rate */}
                  <td className={`py-4 px-4 text-right font-mono font-black ${growthRate > 0 ? "text-emerald-600" : growthRate < 0 ? "text-rose-500" : "text-slate-400"}`}>
                    {growthRate > 0 ? `+${growthRate.toFixed(2)}%` : `${growthRate.toFixed(2)}%`}
                  </td>

                  {/* Trend indicator */}
                  <td className="py-4 px-4 text-center">
                    {trend ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        trend.trendType === "Creciente" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : 
                        trend.trendType === "Decreciente" ? "bg-rose-50 text-rose-700 border border-rose-100" : 
                        "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {trend.trendType === "Creciente" && <TrendingUp size={10} />}
                        {trend.trendType === "Decreciente" && <TrendingDown size={10} />}
                        {trend.trendType}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Average engagement */}
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-800">
                    {isGroup ? (
                      <span className="text-slate-300 italic text-xs block">No aplica</span>
                    ) : (
                      `${avgEngagement.toFixed(2)}%`
                    )}
                  </td>

                  {/* Stagnant status indicator */}
                  <td className="py-4 px-4 text-center">
                    {stagnation ? (
                      stagnation.isStagnant ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg animate-pulse" title={`Tasa de crecimiento (${growthRate.toFixed(3)}%) menor o igual al umbral (${metrics.stagnationList[0]?.threshold}%)`}>
                          ⚠️ Estancado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                          ✅ Saludable
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-slate-300 font-mono">-</span>
                    )}
                  </td>

                  {/* Delete action */}
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => onDeleteChannel(channel.id)}
                      disabled={channels.length <= 1}
                      className="p-1.5 text-slate-450 hover:text-rose-600 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                      title={channels.length <= 1 ? "Debe conservar al menos un canal para no romper el dashboard" : "Eliminar de la supervisión"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
