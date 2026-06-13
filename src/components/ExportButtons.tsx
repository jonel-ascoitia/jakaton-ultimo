import React from "react";
import { Channel, Snapshot, Video } from "../types";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

interface ExportButtonsProps {
  channels: Channel[];
  snapshots: Snapshot[];
  videos: Video[];
}

export default function ExportButtons({ channels, snapshots, videos }: ExportButtonsProps) {

  const exportExcel = async () => {
    const { utils, writeFile } = await import("xlsx");

    const wb = utils.book_new();

    // Sheet 1: Channels
    const channelData = channels.map((c) => {
      const latestSnap = snapshots
        .filter((s) => s.channelId === c.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return {
        "Canal": c.customName || c.title,
        "Plataforma": c.platform || "youtube",
        "Suscriptores": latestSnap?.subscribers ?? 0,
        "Vistas Totales": latestSnap?.totalViews ?? 0,
        "Videos": latestSnap?.videoCount ?? 0,
        "Última Actualización": latestSnap?.date ?? "—"
      };
    });
    utils.book_append_sheet(wb, utils.json_to_sheet(channelData), "Canales");

    // Sheet 2: Videos
    const videoData = videos.slice(0, 2000).map((v) => {
      const ch = channels.find((c) => c.id === v.channelId);
      return {
        "Canal": ch?.customName || ch?.title || v.channelId,
        "Título": v.title,
        "Vistas": v.views,
        "Likes": v.likes,
        "Comentarios": v.comments,
        "Duración (seg)": v.durationSec,
        "Publicado": v.publishedAt ? new Date(v.publishedAt).toLocaleDateString("es-ES") : "—",
        "Tipo": v.durationSec <= 60 ? "Short" : "Video"
      };
    });
    utils.book_append_sheet(wb, utils.json_to_sheet(videoData), "Videos");

    // Sheet 3: Historical Snapshots
    const snapData = snapshots.map((s) => {
      const ch = channels.find((c) => c.id === s.channelId);
      return {
        "Canal": ch?.customName || ch?.title || s.channelId,
        "Fecha": s.date,
        "Suscriptores": s.subscribers,
        "Vistas Totales": s.totalViews,
        "Videos": s.videoCount
      };
    });
    utils.book_append_sheet(wb, utils.json_to_sheet(snapData), "Historial");

    writeFile(wb, `Dashboard_Redes_${new Date().toLocaleDateString("es-ES").replace(/\//g, "-")}.xlsx`);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    const today = new Date().toLocaleDateString("es-ES");

    // Header
    doc.setFillColor(109, 40, 217);
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Dashboard Unificado de Redes Sociales", 14, 13);
    doc.setFontSize(9);
    doc.text(`Generado el ${today}`, 240, 13);

    // Summary
    const totalSubs = snapshots.reduce((acc, s) => {
      const ch = channels.find((c) => c.id === s.channelId);
      if (!ch) return acc;
      const latest = snapshots
        .filter((x) => x.channelId === s.channelId)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return latest?.date === s.date ? acc + s.subscribers : acc;
    }, 0);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Canales: ${channels.length}  |  Total Videos: ${videos.length}  |  Suscriptores Totales: ${totalSubs.toLocaleString("es-ES")}`, 14, 28);

    // Channels table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Resumen de Canales", 14, 36);

    autoTable(doc, {
      startY: 40,
      head: [["Canal", "Plataforma", "Suscriptores", "Vistas Totales", "Videos"]],
      body: channels.map((c) => {
        const latestSnap = snapshots
          .filter((s) => s.channelId === c.id)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        return [
          c.customName || c.title,
          c.platform || "youtube",
          (latestSnap?.subscribers ?? 0).toLocaleString("es-ES"),
          (latestSnap?.totalViews ?? 0).toLocaleString("es-ES"),
          latestSnap?.videoCount ?? 0
        ];
      }),
      headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    // Top Videos
    const topVideos = [...videos]
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    const afterTable = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Top 20 Videos por Vistas", 14, afterTable);

    autoTable(doc, {
      startY: afterTable + 4,
      head: [["Canal", "Título", "Vistas", "Likes", "Comentarios", "Publicado"]],
      body: topVideos.map((v) => {
        const ch = channels.find((c) => c.id === v.channelId);
        return [
          ch?.customName || ch?.title || v.channelId,
          v.title.length > 50 ? v.title.substring(0, 50) + "..." : v.title,
          v.views.toLocaleString("es-ES"),
          v.likes.toLocaleString("es-ES"),
          v.comments.toLocaleString("es-ES"),
          v.publishedAt ? new Date(v.publishedAt).toLocaleDateString("es-ES") : "—"
        ];
      }),
      headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    doc.save(`Dashboard_Redes_${today.replace(/\//g, "-")}.pdf`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportExcel}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-sans font-bold transition-colors shadow-sm"
        title="Exportar a Excel (.xlsx)"
      >
        <FileSpreadsheet size={14} />
        Excel
      </button>
      <button
        onClick={exportPDF}
        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-sans font-bold transition-colors shadow-sm"
        title="Exportar a PDF"
      >
        <FileText size={14} />
        PDF
      </button>
    </div>
  );
}
