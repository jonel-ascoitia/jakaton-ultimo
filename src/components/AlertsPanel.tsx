import React, { useState } from "react";
import { Bell, BellRing, CheckCircle, AlertTriangle, Loader2, Mail } from "lucide-react";

export default function AlertsPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ sent: boolean; message: string; alertCount?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendAlerts = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/send-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (data.success) {
        setResult({ sent: data.sent, message: data.message, alertCount: data.alertCount });
      } else {
        setError(data.error || "Error desconocido");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-sans font-black text-slate-800 flex items-center gap-2">
            <BellRing size={18} className="text-orange-500" />
            Alertas Inteligentes por Email
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Analiza todos tus canales y envía un reporte al correo si detecta crecimientos virales, caídas o videos tendencia.
          </p>
        </div>
        <button
          onClick={sendAlerts}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-sans font-bold hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all shadow-md shrink-0"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
          {isLoading ? "Analizando canales..." : "Verificar y Enviar Alertas"}
        </button>
      </div>

      {/* What triggers alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <span className="text-lg">🚀</span>
          <div>
            <p className="text-[11px] font-sans font-black text-emerald-700">Crecimiento Viral</p>
            <p className="text-[10px] font-mono text-emerald-600 mt-0.5">Canal creció +5% desde el último snapshot</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
          <span className="text-lg">📉</span>
          <div>
            <p className="text-[11px] font-sans font-black text-red-700">Caída de Suscriptores</p>
            <p className="text-[10px] font-mono text-red-600 mt-0.5">Canal perdió más de 100 subs</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-[11px] font-sans font-black text-amber-700">Video Viral</p>
            <p className="text-[10px] font-mono text-amber-600 mt-0.5">+10K vistas en menos de 48 horas</p>
          </div>
        </div>
      </div>

      {/* Result */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-mono">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {result && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${result.sent ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
          {result.sent ? (
            <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <Mail size={18} className="text-slate-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-xs font-sans font-black ${result.sent ? "text-emerald-700" : "text-slate-600"}`}>
              {result.sent ? `✅ ¡Email enviado! (${result.alertCount} alerta${result.alertCount !== 1 ? "s" : ""})` : "✅ Sistema OK — Sin alertas críticas"}
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-1">{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
