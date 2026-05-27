"use client";

import React, { useState, useEffect } from "react";
import { Disposizione, FotoMagazzino } from "@/types";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300">
            Preposto Control Room
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Registro storico delle approvazioni e controllo attività sul Bot Telegram.
          </p>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest font-mono">
            Audit Trail Attivo
          </span>
        </div>
      </header>

      {/* Stat Cards */}
      <section className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl backdrop-blur-md">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Disposizioni Totali</p>
          <p className="text-3xl font-bold mt-1 text-white">{totalDisp}</p>
        </div>
        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl backdrop-blur-md">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Disposizioni Approvate</p>
          <p className="text-3xl font-bold mt-1 text-emerald-400">{approvedDisp}</p>
        </div>
        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl backdrop-blur-md">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Foto Caricate</p>
          <p className="text-3xl font-bold mt-1 text-white">{totalPhotos}</p>
        </div>
        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl backdrop-blur-md">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Foto Approvate</p>
          <p className="text-3xl font-bold mt-1 text-emerald-400">{approvedPhotos}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("disposizioni")}
            className={`pb-3 text-sm font-bold tracking-wide transition cursor-pointer relative ${
              activeTab === "disposizioni"
                ? "text-purple-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Disposizioni ({pendingDisp} in attesa)
            {activeTab === "disposizioni" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("foto")}
            className={`pb-3 text-sm font-bold tracking-wide transition cursor-pointer relative ${
              activeTab === "foto"
                ? "text-purple-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Foto Magazzino ({pendingPhotos} in attesa)
            {activeTab === "foto" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
            )}
          </button>
        </div>

        {/* tab Content */}
        {activeTab === "disposizioni" ? (
          <div className="space-y-4">
            {disposizioni.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-10 text-center">Nessuna disposizione nel log.</p>
            ) : (
              disposizioni.map((disp) => {
                const statusStyles: Record<string, string> = {
                  in_attesa: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  approvato: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  rifiutato: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                };

                return (
                  <div
                    key={disp.id}
                    className="bg-slate-900/30 border border-white/5 rounded-2xl p-5 hover:bg-slate-900/55 transition duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div>
                        <span className="font-mono text-xs text-purple-400 font-bold bg-purple-500/5 px-2.5 py-1 rounded-md border border-purple-500/10">
                          {disp.codice}
                        </span>
                        <span className="text-xs text-slate-500 ml-3">
                          Creato il {new Date(disp.created_at).toLocaleString("it-IT")}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyles[disp.stato]}`}>
                        {disp.stato === "in_attesa" && "⏳ In Attesa Telegram"}
                        {disp.stato === "approvato" && "✅ Approvato"}
                        {disp.stato === "rifiutato" && "❌ Rifiutato"}
                      </span>
                    </div>

                    <p className="text-slate-300 text-sm mb-3 leading-relaxed">{disp.descrizione}</p>

                    {disp.stato !== "in_attesa" && (
                      <div className="text-xs text-slate-400 bg-slate-950/30 border border-slate-800/40 rounded-xl px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3">
                        <div>
                          👤 Gestito da: <strong className="text-slate-200">{disp.approvato_da}</strong>
                        </div>
                        <div className="hidden sm:block text-slate-600">|</div>
                        <div>
                          📅 Decisione del: <strong className="text-slate-200">{new Date(disp.decisione_data).toLocaleString("it-IT")}</strong>
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
              <p className="text-sm text-slate-500 italic py-10 text-center">Nessuna foto nel log.</p>
            ) : (
              allPhotos.map((foto) => {
                const statusStyles: Record<string, string> = {
                  in_attesa: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  approvato: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  rifiutato: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                };

                return (
                  <div
                    key={foto.id}
                    className="bg-slate-900/30 border border-white/5 rounded-2xl p-5 hover:bg-slate-900/55 transition duration-200 flex flex-col md:flex-row gap-5"
                  >
                    {/* Immagine */}
                    <div
                      className="w-full md:w-32 aspect-square relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition cursor-zoom-in flex-shrink-0"
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
                            <span className="font-mono text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                              Disp: {foto.codiceDisposizione}
                            </span>
                            <span className="text-xs text-slate-500 ml-3">
                              Caricato il {new Date(foto.created_at).toLocaleString("it-IT")}
                            </span>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border self-start sm:self-center ${statusStyles[foto.stato]}`}>
                            {foto.stato === "in_attesa" && "⏳ In Attesa Telegram"}
                            {foto.stato === "approvato" && "✅ Foto Approvata"}
                            {foto.stato === "rifiutato" && "❌ Foto Rifiutata"}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-3">{foto.descrizione}</p>
                      </div>

                      {foto.stato !== "in_attesa" && (
                        <div className="text-xs text-slate-400 bg-slate-950/30 border border-slate-800/40 rounded-xl px-4 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2">
                          <div>
                            👤 Approvato da: <strong className="text-slate-200">{foto.decisione_da}</strong>
                          </div>
                          <div className="hidden sm:block text-slate-600">|</div>
                          <div>
                            📅 Data decisione: <strong className="text-slate-200">{new Date(foto.decisione_data).toLocaleString("it-IT")}</strong>
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
          <div className="max-w-4xl max-h-[85vh] relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt="Anteprima foto"
              className="object-contain max-h-[80vh] w-full"
            />
            <button
              className="absolute top-4 right-4 bg-slate-950/80 hover:bg-slate-900 text-white rounded-full w-9 h-9 flex items-center justify-center border border-white/10 transition cursor-pointer"
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
