"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FotoMagazzino } from "@/types";

export default function PrepostoDashboard() {
  const [disposizioni, setDisposizioni] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"disposizioni" | "foto">("disposizioni");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      const res = await fetch("/api/disposizioni");
      if (!res.ok) throw new Error("Errore nel recupero dati");
      const data = await res.json();
      setDisposizioni(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Elabora tutte le foto caricate nel sistema estraendole dalle disposizioni
  const allPhotos: any[] = [];
  disposizioni.forEach((disp) => {
    if (disp.foto_magazzino) {
      disp.foto_magazzino.forEach((f: any) => {
        allPhotos.push({
          ...f,
          codiceDisposizione: disp.codice,
        });
      });
    }
  });

  // Ordina per data decrescente
  allPhotos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Statistiche rapide
  const totalDisp = disposizioni.length;
  const approvedDisp = disposizioni.filter((d) => d.stato === "approvato").length;
  const pendingDisp = disposizioni.filter((d) => d.stato === "in_attesa").length;

  const totalPhotos = allPhotos.length;
  const approvedPhotos = allPhotos.filter((f) => f.stato === "approvato").length;
  const pendingPhotos = allPhotos.filter((f) => f.stato === "in_attesa").length;

  return (
    <main className="min-h-screen bg-[#000000] text-zinc-100 font-mono relative overflow-hidden p-6 md:p-12">
      {/* BACKGROUND DECORATIVE GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lime-500/20 to-transparent pointer-events-none" />

      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-500 hover:text-lime-400 transition-colors text-xs font-bold">
              ← CONTROL HIERARCHY
            </Link>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white mt-2">
            PREPOSTO // CONTROL ROOM
          </h1>
          <p className="text-zinc-400 mt-1 text-xs font-sans">
            Registro storico delle approvazioni e controllo attività sul Bot Telegram.
          </p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 px-4 py-2.5 flex items-center gap-3">
          <div className="w-2 h-2 bg-lime-400 animate-pulse rounded-none" />
          <span className="text-[10px] font-bold text-lime-400 uppercase tracking-widest">
            Audit Trail Attivo
          </span>
        </div>
      </header>

      {/* Stat Cards */}
      <section className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
        <div className="bg-[#09090b] border border-zinc-800 p-4 rounded-none">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Disposizioni Totali</p>
          <p className="text-3xl font-bold mt-1 text-white">{totalDisp}</p>
        </div>
        <div className="bg-[#09090b] border border-zinc-800 p-4 rounded-none">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Disposizioni Approvate</p>
          <p className="text-3xl font-bold mt-1 text-lime-400">{approvedDisp}</p>
        </div>
        <div className="bg-[#09090b] border border-zinc-800 p-4 rounded-none">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Foto Caricate</p>
          <p className="text-3xl font-bold mt-1 text-white">{totalPhotos}</p>
        </div>
        <div className="bg-[#09090b] border border-zinc-800 p-4 rounded-none">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Foto Approvate</p>
          <p className="text-3xl font-bold mt-1 text-lime-400">{approvedPhotos}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("disposizioni")}
            className={`pb-3 text-xs font-extrabold tracking-widest transition cursor-pointer relative uppercase ${
              activeTab === "disposizioni"
                ? "text-lime-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Disposizioni ({pendingDisp} in attesa)
            {activeTab === "disposizioni" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-lime-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("foto")}
            className={`pb-3 text-xs font-extrabold tracking-widest transition cursor-pointer relative uppercase ${
              activeTab === "foto"
                ? "text-lime-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Foto Magazzino ({pendingPhotos} in attesa)
            {activeTab === "foto" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-lime-400" />
            )}
          </button>
        </div>

        {/* tab Content */}
        {activeTab === "disposizioni" ? (
          <div className="space-y-4">
            {disposizioni.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-10 text-center font-sans">Nessuna disposizione nel log.</p>
            ) : (
              disposizioni.map((disp) => {
                const statusStyles: Record<string, string> = {
                  in_attesa: "bg-amber-500/5 border-amber-500/20 text-amber-400",
                  approvato: "bg-lime-500/5 border-lime-500/20 text-lime-400",
                  rifiutato: "bg-rose-500/5 border-rose-500/20 text-rose-400",
                };

                return (
                  <div
                    key={disp.id}
                    className="bg-[#09090b] border border-zinc-800 rounded-none p-5 hover:border-lime-500/40 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div>
                        <span className="font-mono text-xs text-lime-400 font-bold bg-lime-500/5 px-2.5 py-1 border border-lime-500/10 rounded-none">
                          {disp.codice}
                        </span>
                        <span className="text-[10px] text-zinc-500 ml-3">
                          Creato il {new Date(disp.created_at).toLocaleString("it-IT")}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 border rounded-none tracking-wider ${statusStyles[disp.stato]}`}>
                        {disp.stato === "in_attesa" && "⏳ In Attesa Telegram"}
                        {disp.stato === "approvato" && "✅ Approvato"}
                        {disp.stato === "rifiutato" && "❌ Rifiutato"}
                      </span>
                    </div>

                    <p className="text-zinc-300 text-sm mb-3 leading-relaxed font-sans">{disp.descrizione}</p>

                    {disp.stato !== "in_attesa" && (
                      <div className="text-[11px] text-zinc-400 bg-black border border-zinc-800/80 rounded-none px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3">
                        <div>
                          👤 Gestito da: <strong className="text-zinc-200">{disp.approvato_da}</strong>
                        </div>
                        <div className="hidden sm:block text-zinc-800">|</div>
                        <div>
                          📅 Decisione del: <strong className="text-zinc-200">{new Date(disp.decisione_data).toLocaleString("it-IT")}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {allPhotos.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-10 text-center font-sans">Nessuna foto nel log.</p>
            ) : (
              allPhotos.map((foto) => {
                const statusStyles: Record<string, string> = {
                  in_attesa: "bg-amber-500/5 border-amber-500/20 text-amber-400",
                  approvato: "bg-lime-500/5 border-lime-500/20 text-lime-400",
                  rifiutato: "bg-rose-500/5 border-rose-500/20 text-rose-400",
                };

                return (
                  <div
                    key={foto.id}
                    className="bg-[#09090b] border border-zinc-800 rounded-none p-5 hover:border-lime-500/40 transition-all duration-300 flex flex-col md:flex-row gap-5"
                  >
                    {/* Immagine */}
                    <div
                      className="w-full md:w-32 aspect-square relative rounded-none overflow-hidden bg-black border border-zinc-800 hover:border-lime-500/50 transition cursor-zoom-in flex-shrink-0"
                      onClick={() => setSelectedPhoto(`/api/foto?file_id=${foto.telegram_file_id}`)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/foto?file_id=${foto.telegram_file_id}`}
                        alt={foto.descrizione}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Dettagli */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                          <div>
                            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 bg-zinc-850 px-2 py-0.5 border border-zinc-700 rounded-none">
                              Disp: {foto.codiceDisposizione}
                            </span>
                            <span className="text-[10px] text-zinc-500 ml-3">
                              Caricato il {new Date(foto.created_at).toLocaleString("it-IT")}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 border rounded-none tracking-wider self-start sm:self-center ${statusStyles[foto.stato]}`}>
                            {foto.stato === "in_attesa" && "⏳ In Attesa Telegram"}
                            {foto.stato === "approvato" && "✅ Foto Approvata"}
                            {foto.stato === "rifiutato" && "❌ Foto Rifiutata"}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed mb-3 font-sans">{foto.descrizione}</p>
                      </div>

                      {foto.stato !== "in_attesa" && (
                        <div className="text-[11px] text-zinc-400 bg-black border border-zinc-800/80 rounded-none px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2">
                          <div>
                            👤 Approvato da: <strong className="text-zinc-200">{foto.decisione_da}</strong>
                          </div>
                          <div className="hidden sm:block text-zinc-850">|</div>
                          <div>
                            📅 Data decisione: <strong className="text-zinc-200">{new Date(foto.decisione_data).toLocaleString("it-IT")}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal di anteprima foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-[85vh] relative rounded-none overflow-hidden border border-zinc-800 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt="Anteprima foto"
              className="object-contain max-h-[80vh] w-full"
            />
            <button
              className="absolute top-4 right-4 bg-black/80 hover:bg-zinc-900 text-white rounded-none w-9 h-9 flex items-center justify-center border border-zinc-800 transition cursor-pointer"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
