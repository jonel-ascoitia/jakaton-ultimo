import React, { useMemo } from "react";
import { Channel, Snapshot } from "../types";
import { Trophy, TrendingUp, TrendingDown, Minus, Medal } from "lucide-react";

interface MonthlyRankingProps {
  channels: Channel[];
  snapshots: Snapshot[];
}

interface RankedChannel {
  channel: Channel;
  currentSubs: number;
  prevSubs: number;
  growth: number;
  growthPct: number;
  rank: number;
}

export default function MonthlyRanking({ channels, snapshots }: MonthlyRankingProps) {
  const ranked = useMemo((): RankedChannel[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevDate = new Date(now);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.getMonth();
    const prevYear = prevDate.getFullYear();

    return channels
      .map((channel) => {
        const channelSnaps = snapshots
          .filter((s) => s.channelId === channel.id)
          .sort((a, b) => a.date.localeCompare(b.date));

        const currentSnap = channelSnaps
          .filter((s) => {
            const d = new Date(s.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          })
          .at(-1);

        const prevSnap = channelSnaps
          .filter((s) => {
            const d = new Date(s.date);
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
          })
          .at(-1) ?? channelSnaps[0];

        const currentSubs = currentSnap?.subscribers ?? channelSnaps.at(-1)?.subscribers ?? 0;
        const prevSubs = prevSnap?.subscribers ?? currentSubs;
        const growth = currentSubs - prevSubs;
        const growthPct = prevSubs > 0 ? (growth / prevSubs) * 100 : 0;

        return { channel, currentSubs, prevSubs, growth, growthPct, rank: 0 };
      })
      .sort((a, b) => b.growth - a.growth)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [channels, snapshots]);

  const medalColors = [
    { bg: "from-amber-50 to-yellow-50", border: "border-amber-200", text: "text-amber-600", icon: "🥇" },
    { bg: "from-slate-50 to-gray-50", border: "border-slate-200", text: "text-slate-500", icon: "🥈" },
    { bg: "from-orange-50 to-amber-50", border: "border-orange-200", text: "text-orange-600", icon: "🥉" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
      <div className="flex items-center gap-2 mb-6 pb-6 border-b border-slate-100">
        <Trophy size={18} className="text-amber-500" />
        <div>
          <h2 className="text-base font-sans font-black text-slate-800">
            Ranking Mensual de Canales
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Clasificación por crecimiento de suscriptores del mes actual vs. el mes anterior.
          </p>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-100 rounded-2xl">
          <p className="text-sm text-slate-400 italic font-mono">No hay canales registrados aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((item) => {
            const medal = item.rank <= 3 ? medalColors[item.rank - 1] : null;
            return (
              <div
                key={item.channel.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${
                  medal
                    ? `bg-gradient-to-r ${medal.bg} ${medal.border}`
                    : "border-slate-100 bg-slate-50/30"
                }`}
              >
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {medal ? (
                    <span className="text-2xl">{medal.icon}</span>
                  ) : (
                    <span className="text-sm font-mono font-black text-slate-400">#{item.rank}</span>
                  )}
                </div>

                {/* Avatar / Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={item.channel.snippet?.thumbnails?.default?.url || "https://via.placeholder.com/40"}
                    alt={item.channel.title}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.channel.title); }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-sans font-black text-slate-800 truncate">
                      {item.channel.customName || item.channel.title}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {item.currentSubs.toLocaleString()} subs actuales
                    </p>
                  </div>
                </div>

                {/* Growth */}
                <div className="text-right shrink-0">
                  <div className={`flex items-center justify-end gap-1 font-black text-sm ${
                    item.growth > 0 ? "text-emerald-600" :
                    item.growth < 0 ? "text-red-500" :
                    "text-slate-400"
                  }`}>
                    {item.growth > 0 ? <TrendingUp size={13} /> : item.growth < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                    {item.growth > 0 ? "+" : ""}{item.growth.toLocaleString()}
                  </div>
                  <p className={`text-[10px] font-mono mt-0.5 ${
                    item.growthPct > 0 ? "text-emerald-500" : item.growthPct < 0 ? "text-red-400" : "text-slate-400"
                  }`}>
                    {item.growthPct > 0 ? "+" : ""}{item.growthPct.toFixed(1)}% este mes
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
