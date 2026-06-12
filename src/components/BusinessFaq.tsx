import React from "react";
import { Youtube, HelpCircle, Shield, Award, Calendar, Lightbulb } from "lucide-react";

export default function BusinessFaq() {
  return (
    <div id="business-faq" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-12">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
        <HelpCircle className="text-slate-700" size={20} />
        <div>
          <h2 className="text-base font-sans font-black text-slate-800">
            Sustentación de Negocio y Preguntas Frecuentes del Director
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Respuestas de negocio obligatorias formuladas por Wilber Peralta para la evaluación oficial (0 a 20).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        {/* Q1: Canal que crece más rápido */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <h4 className="font-extrabold text-slate-800 flex items-center gap-2 mb-2 font-sans">
            <Award size={15} className="text-teal-600" />
            1. ¿Por qué usamos Tasa (%) en vez de Crecimiento Absoluto?
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            El crecimiento absoluto sesga el análisis a favor de marcas de gran escala, ignorando el rendimiento relativo de nichos nuevos. 
            La <b>tasa porcentual (%)</b> relativiza el crecimiento contra los suscriptores de partida, revelando qué canal es más eficiente 
            en captar nuevas audiencias de forma acelerada.
          </p>
        </div>

        {/* Q2: Video más exitoso */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <h4 className="font-extrabold text-slate-800 flex items-center gap-2 mb-2 font-sans">
            <Youtube size={15} className="text-red-500" />
            2. Criterio de Desempate del Video Ganador
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            El video "más exitoso del periodo" se define ordenando primero por <b>volumen de interacciones brutas</b> (likes + comentarios). 
            En caso de igualdad estricta de interacciones, la regla de desempate selecciona el contenido con la **mayor tasa de engagement** 
            relativa (dividido por vistas), premiando la eficiencia del gancho sobre canales virales vacíos.
          </p>
        </div>

        {/* Q3: Solución ante datos faltantes */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <h4 className="font-extrabold text-slate-800 flex items-center gap-2 mb-2 font-sans">
            <Calendar size={15} className="text-sky-600" />
            3. ¿Qué hacemos si falta un snapshot diario?
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            En lugar de saltar el día o mostrar caídas drásticas a cero en la serie temporal, implementamos <b>interpolación lineal</b> entre el snapshot previo y el siguiente disponible. 
            Esto mantiene las curvas de tendencia suavizadas en los gráficos, sin alterar los balances históricos globales.
          </p>
        </div>

        {/* Q4: Cuota y desuso de search.list */}
        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <h4 className="font-extrabold text-slate-800 flex items-center gap-2 mb-2 font-sans">
            <Shield size={15} className="text-purple-600" />
            4. Optimización de Cuota API de YouTube (10,000 unidades)
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Se prohíbe de manera absoluta la llamada a <code>search.list</code> (costo: 100 unidades por invocación). 
            En su reemplazo, obtenemos el ID del playlist <b>uploads</b> del canal mediante una llamada única a <code>channels.list</code>, 
            y luego iteramos mediante <code>playlistItems.list</code> (1 unidad por cada batch de 50 videos). Esto reduce el impacto a mínimos.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-teal-50 text-teal-800 rounded-xl border border-teal-100 flex gap-3 items-start">
        <Lightbulb size={20} className="text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs font-sans">
          <span className="font-bold block mb-1 text-teal-900">Demostración Práctica ante el Jurado:</span>
          Puede simular el paso del tiempo presionando el botón "<b>Avanzar 1 Día (Simulación)</b>" en el panel de control. El cron del servidor simula la llegada autónoma de un nuevo snapshot, permitiendo ver cómo la serie de tiempo evoluciona, cómo cambia el canal que crece más rápido y cómo se disparan alertas de estancamiento de forma inmediata sobre marcas inactivas.
        </div>
      </div>
    </div>
  );
}
