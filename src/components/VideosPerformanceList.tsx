import React, { useState, useMemo } from "react";
import { Channel, Video } from "../types";
import { Search, Film, Tv, ThumbsUp, MessageSquare, Eye, Award, TrendingUp } from "lucide-react";
import { calculateInteractions, calculateVideoEngagement, calculateVideoWeeklyViewsGained } from "../utils";

interface VideosPerformanceListProps {
  channels: Channel[];
  videos: Video[];
}

export default function VideosPerformanceList({ channels, videos }: VideosPerformanceListProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formatFilter, setFormatFilter] = useState<string>("all"); // all, short, long
  const [channelFilter, setChannelFilter] = useState<string>("all"); // all, channelId
  const [sortBy, setSortBy] = useState<string>("date"); // date, views, interactions, engagement, velocity
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, formatFilter, channelFilter, sortBy]);

  // Format Helper: Seconds to simple text (MM:SS or HH:MM:SS)
  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec} s`;
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")} m`;
  };

  // Normalizador fonético y de acentos para búsquedas comerciales ultra-tolerantes
  const normalizeText = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/b/g, "v")             // Unificar b y v para tolerancia fonética
      .replace(/[^a-z0-9]/g, " ")     // Eliminar símbolos especiales
      .replace(/\s+/g, " ")           // Colapsar espacios duplicados
      .trim();
  };

  // Perform search and filtering via useMemo for optimal client performance
  const processedVideos = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);
    const queryParts = normalizedQuery.split(/\s+/).filter(Boolean);

    const stopWords = [
      "de", "la", "el", "en", "y", "a", "los", "un", "una", "con", "por", "para", "del", 
      "las", "les", "o", "u", "e", "este", "esta", "estos", "estas"
    ];
    
    const importantQueryParts = queryParts.filter((w) => !stopWords.includes(w));
    
    return videos
      .filter((v) => {
        const channel = channels.find((c) => c.id === v.channelId);
        const channelName = channel ? (channel.customName || channel.title || "") : "";
        
        const normTitle = normalizeText(v.title);
        const normChannel = normalizeText(channelName);
        const combinedText = `${normTitle} ${normChannel}`;

        let matchesSearch = true;
        
        if (queryParts.length > 0) {
          // Exact phrase match: highest priority
          if (combinedText.includes(normalizedQuery)) {
            matchesSearch = true;
          } else {
            // All words must appear (strict AND search)
            matchesSearch = queryParts.every((word) => combinedText.includes(word));
          }
        }

        const isShort = v.durationSec <= 60;
        const matchesFormat = 
          formatFilter === "all" ||
          (formatFilter === "short" && isShort) ||
          (formatFilter === "long" && !isShort);
        
        const matchesChannel = channelFilter === "all" || v.channelId === channelFilter;
        
        return matchesSearch && matchesFormat && matchesChannel;
      })
      .sort((a, b) => {
        if (sortBy === "velocity") {
          const bGained = calculateVideoWeeklyViewsGained(b);
          const aGained = calculateVideoWeeklyViewsGained(a);
          return bGained - aGained;
        }
        if (sortBy === "date") {
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        }
        if (sortBy === "views") {
          return b.views - a.views;
        }
        if (sortBy === "interactions") {
          const bInter = calculateInteractions(b);
          const aInter = calculateInteractions(a);
          if (bInter !== aInter) return bInter - aInter;

          const bEng = calculateVideoEngagement(b) || 0;
          const aEng = calculateVideoEngagement(a) || 0;
          return bEng - aEng;
        }
        if (sortBy === "engagement") {
          const bEng = calculateVideoEngagement(b) || 0;
          const aEng = calculateVideoEngagement(a) || 0;
          return bEng - aEng;
        }
        return 0;
      });
  }, [videos, channels, searchQuery, formatFilter, channelFilter, sortBy]);

  const latestDateStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(processedVideos.length / itemsPerPage));
  const currentVideos = processedVideos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-base font-sans font-black text-slate-800 flex items-center gap-2">
            <Film size={18} className="text-purple-500" />
            Control de Contenido y Rendimiento de Posts / Videos
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Métricas de enganche y desempates oficiales. Ordene por <b>Velocidad</b> para ver el delta ganado de vistas los últimos 7 días.
          </p>
        </div>

        {/* Counter and Reset triggers */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {(searchQuery !== "" || formatFilter !== "all" || channelFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFormatFilter("all");
                setChannelFilter("all");
              }}
              className="text-[10px] font-sans font-extrabold bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
            >
              ✕ Limpiar Filtros
            </button>
          )}
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-xl">
            Página {currentPage} de {totalPages} ({processedVideos.length} resultados)
          </span>
        </div>
      </div>

      {/* Filter controls bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Buscar por título de post o marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-slate-700 placeholder:text-slate-400 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:bg-white focus:border-slate-300 transition-all font-sans"
          />
        </div>

        {/* Format Select */}
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="bg-slate-50 text-slate-600 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-slate-300 transition-all font-sans cursor-pointer"
        >
          <option value="all">🎬 Todos los formatos</option>
          <option value="short">⚡ Reels / Cortos (≤ 60s)</option>
          <option value="long">📺 Videos Largos (&gt; 60s)</option>
        </select>

        {/* Channel Select */}
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="bg-slate-50 text-slate-600 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-slate-300 transition-all font-sans cursor-pointer"
        >
          <option value="all">👤 Todas las marcas</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.customName}
            </option>
          ))}
        </select>

        {/* Sort Select */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-50 text-slate-600 border border-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:bg-white focus:border-slate-300 transition-all font-mono font-bold cursor-pointer"
        >
          <option value="velocity">⚡ Top de la semana (Delta 7d)</option>
          <option value="interactions">🔥 Orden: Interacciones</option>
          <option value="engagement">📈 Orden: Engagement</option>
          <option value="views">👁️ Orden: Vistas Totales</option>
          <option value="date">📅 Orden: Fecha de Pub.</option>
        </select>
      </div>

      {/* Grid presentation */}
      {processedVideos.length > 0 ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentVideos.map((video) => {
            const channel = channels.find((c) => c.id === video.channelId);
            const isShort = video.durationSec <= 60;
            const engagement = calculateVideoEngagement(video);
            const totalInteractions = calculateInteractions(video);
            const weeklyViewsGained = calculateVideoWeeklyViewsGained(video, latestDateStr);

            return (
              <div
                key={video.id}
                className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Header block with badges */}
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isShort ? "bg-orange-50 text-orange-700" : "bg-purple-50 text-purple-700"
                    }`}>
                      {isShort ? <Tv size={9} /> : <Film size={9} />}
                      {isShort ? "REEL / CORTO" : "POST LARGO"} • {formatDuration(video.durationSec)}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(video.publishedAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short"
                      })}
                    </span>
                  </div>

                  <h4 className="text-sm font-sans font-extrabold text-slate-800 line-clamp-2 leading-snug mb-1" title={video.title}>
                    {video.title}
                  </h4>

                  <span className="text-[10px] text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full font-sans font-semibold">
                    {channel?.customName || "Marca"}
                  </span>
                  
                  {/* Delta Weekly Growth badge */}
                  <div className="mt-2 text-[10px] font-mono flex items-center gap-1 text-purple-600 font-bold">
                    <TrendingUp size={11} />
                    <span>+{weeklyViewsGained.toLocaleString()} vistas ganadas esta semana</span>
                  </div>
                </div>

                {/* Statistics panel */}
                <div className="mt-5 pt-4 border-t border-slate-50">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono text-slate-400 mb-4">
                    <div>
                      <p className="text-[10px] text-slate-450">Views Tot.</p>
                      <p className="font-bold text-slate-700 mt-0.5">{video.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-450">Likes</p>
                      <p className="font-bold text-slate-700 mt-0.5">{video.likes.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-450">Coment.</p>
                      <p className="font-bold text-slate-700 mt-0.5">{video.comments.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Computed scores */}
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 font-medium">INTERACCIONES</p>
                      <p className="text-sm font-sans font-black text-slate-800">
                        {totalInteractions.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-mono text-slate-400 font-medium">ENGAGEMENT</p>
                      <p className="text-sm font-sans font-black text-purple-600">
                        {engagement !== null ? `${engagement.toFixed(2)}%` : <span className="text-rose-500 font-bold italic">Sin datos</span>}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-sans font-bold hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              ← Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Simple logic to show a window of pages around current
                let pageNum = currentPage;
                if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                
                if (pageNum < 1 || pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-mono font-bold transition-colors ${
                      currentPage === pageNum 
                        ? "bg-purple-600 text-white" 
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-sans font-bold hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}
        </>
      ) : (
        <div className="text-center py-12 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
          <p className="text-sm text-slate-400 italic font-mono">No hay videos/posts que coincidan con la búsqueda o criterios seleccionados.</p>
        </div>
      )}
    </div>
  );
}
