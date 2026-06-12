import React, { useState } from "react";
import { Sliders, Key, RefreshCw, Calendar, CheckCircle2, AlertCircle } from "lucide-react";

interface ConfigPanelProps {
  stagnationThreshold: number;
  youtubeApiKey: string;
  geminiApiKey: string;
  onUpdateConfig: (threshold: number, ytKey: string, geminiKey: string) => void;
  onTriggerIngest: (simulate: boolean) => Promise<any>;
}

export default function ConfigPanel({
  stagnationThreshold,
  youtubeApiKey,
  geminiApiKey,
  onUpdateConfig,
  onTriggerIngest
}: ConfigPanelProps) {
  const [localThreshold, setLocalThreshold] = useState<number>(stagnationThreshold);
  const [localKey, setLocalKey] = useState<string>(youtubeApiKey);
  const [localGeminiKey, setLocalGeminiKey] = useState<string>(geminiApiKey);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info" | null; text: string | null }>({
    type: null,
    text: null
  });

  const handleSaveConfig = () => {
    onUpdateConfig(localThreshold, localKey, localGeminiKey);
    setStatusMsg({
      type: "success",
      text: "Configuración guardada con éxito. Las API keys están activas."
    });
    setTimeout(() => {
      setStatusMsg({ type: null, text: null });
    }, 4000);
  };

  const handleIngest = async (simulate: boolean) => {
    setIsLoading(true);
    setStatusMsg({
      type: "info",
      text: simulate ? "Simulando avance de 24 horas y cron job de snapshots..." : "Conectando con la YouTube Data API para recolectar métricas del día..."
    });

    try {
      const response = await onTriggerIngest(simulate);
      if (response && response.success) {
        setStatusMsg({
          type: "success",
          text: response.message || "¡Sincronización finalizada exitosamente!"
        });
      } else {
        setStatusMsg({
          type: "error",
          text: response?.error || "Error indeterminado al procesar la solicitud."
        });
      }
    } catch (e: any) {
      setStatusMsg({
        type: "error",
        text: `Error de red: ${e.message || "No se pudo conectar al servidor backend."}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if API keys are configured
  const hasCustomKey = localKey.trim().length > 0 && localKey !== "MY_GEMINI_API_KEY";
  const hasGeminiKey = localGeminiKey.trim().length > 0 && localGeminiKey !== "MY_GEMINI_API_KEY";

  return (
    <div id="config-panel" className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl mb-8 border border-slate-800">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-sans font-black flex items-center gap-2">
            <Sliders size={20} className="text-teal-400" />
            Panel de Control y Simulación
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure las condiciones del negocio y gatille la ingesta automática diaria.
          </p>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap gap-3">
          {/* Simulated day addition */}
          <button
            onClick={() => handleIngest(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-50"
            title="Avanza 1 día simulado para llenar la serie temporal sin esperar mañana"
          >
            <Calendar size={15} />
            Avanzar 1 Día (Simulación)
          </button>

          {/* Real API sync */}
          <button
            onClick={() => handleIngest(false)}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-50 ${
              hasCustomKey 
                ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            Sincronizar API Ahora
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* Left column: Stagnation threshold slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
              Umbral de Estancamiento Semanal
            </label>
            <span className="text-sm font-sans font-black text-teal-400">
              {localThreshold.toFixed(2)}%
            </span>
          </div>
          <input
            type="range"
            min="0.05"
            max="5"
            step="0.05"
            value={localThreshold}
            onChange={(e) => setLocalThreshold(parseFloat(e.target.value))}
            className="w-full accent-teal-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>0.05% (Muy permisivo)</span>
            <span>2.5%</span>
            <span>5.0% (Exigente)</span>
          </div>
          <p className="text-xs text-slate-400 mt-3 font-sans leading-relaxed">
            Los canales con una tasa de crecimiento de suscriptores igual o menor a este umbral serán marcados como <span className="text-rose-400 font-bold">Estancados</span> (Señales de Alerta). Cambiar este umbral recalcula las alertas del dashboard instantáneamente.
          </p>
        </div>

        {/* Right column: YouTube API Key */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
              YouTube Data API v3 Key
            </label>
            {hasCustomKey && (
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800">
                ✓ ACTIVO — YouTube en Vivo
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Key size={15} />
            </span>
            <input
              type="password"
              placeholder="API Key de YouTube para llamadas reales..."
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-600 rounded-xl pl-9 pr-4 py-2 text-xs border border-slate-800 focus:outline-none focus:border-blue-700 font-mono"
            />
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-2 flex gap-1 items-start">
            <span>▶️</span>
            <span>
              Requerida para sincronizar canales de <b>YouTube</b> con datos reales. Créala en <b>console.cloud.google.com</b> con YouTube Data API v3 habilitada.
            </span>
          </p>
        </div>
      </div>

      {/* Gemini API Key — Full width row */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
            Gemini API Key — Motor IA para Facebook / Instagram / TikTok
          </label>
          {hasGeminiKey && (
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800">
              ✓ ACTIVO — Datos reales con IA
            </span>
          )}
        </div>
        <div className="flex gap-3 items-start">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Key size={15} />
            </span>
            <input
              type="password"
              placeholder="AIza... — Gemini API Key de aistudio.google.com/apikey"
              value={localGeminiKey}
              onChange={(e) => setLocalGeminiKey(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-600 rounded-xl pl-9 pr-4 py-2 text-xs border border-slate-800 focus:outline-none focus:border-emerald-700 font-mono"
            />
          </div>
          <button
            onClick={handleSaveConfig}
            className="px-5 py-2 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 rounded-xl text-xs font-sans font-bold transition-all border border-emerald-500/30 shrink-0"
          >
            Guardar Config
          </button>
        </div>
        <p className="text-[10px] text-slate-500 font-mono mt-2 flex gap-1 items-start">
          <span>🤖</span>
          <span>
            Esta clave activa el motor <b>Gemini + Google Search</b> que extrae datos <b>reales y actualizados</b> de perfiles públicos de Facebook, Instagram y TikTok usando inteligencia artificial con búsqueda web en vivo.
            Obtén tu API key <b>gratis</b> en <b>aistudio.google.com/apikey</b> (no requiere tarjeta de crédito).
          </span>
        </p>
      </div>



      {/* Action execution status */}
      {statusMsg.text && (
        <div className={`mt-6 p-3 rounded-xl flex items-start gap-2.5 transition-all outline-none border ${
          statusMsg.type === "success" ? "bg-teal-950/40 text-teal-200 border-teal-900" :
          statusMsg.type === "error" ? "bg-rose-950/40 text-rose-200 border-rose-900" :
          "bg-slate-950/45 text-slate-300 border-slate-800"
        }`}>
          {statusMsg.type === "success" && <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />}
          {statusMsg.type === "error" && <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />}
          {statusMsg.type === "info" && <RefreshCw size={16} className="text-slate-400 animate-spin shrink-0 mt-0.5" />}
          
          <div className="text-xs leading-relaxed">
            <span className="font-bold">
              {statusMsg.type === "success" ? "Sincronizador: " : 
               statusMsg.type === "error" ? "Sincronizador (Fallo detectado): " : 
               "Procesando: "}
            </span>
            {statusMsg.text}
          </div>
        </div>
      )}
    </div>
  );
}
