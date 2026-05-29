"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function PrepostoDashboard() {
  const [disposizioni, setDisposizioni] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"disposizioni" | "foto">("disposizioni");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllData = useCallback(async () => {
    try {
      const res = await fetch("/api/disposizioni");
      if (!res.ok) throw new Error("Errore nel recupero dati");
      const data = await res.json();
      setDisposizioni(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllData();
    const interval = setInterval(fetchAllData, 12000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

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

  // Filtra per ricerca
  const filteredDisposizioni = disposizioni.filter((d) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return d.codice.toLowerCase().includes(term) || d.descrizione.toLowerCase().includes(term);
  });

  const filteredPhotos = allPhotos.filter((f) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (f.codiceDisposizione && f.codiceDisposizione.toLowerCase().includes(term)) ||
      (f.descrizione && f.descrizione.toLowerCase().includes(term))
    );
  });

  // Statistiche rapide
  const totalDisp = disposizioni.length;
  const approvedDisp = disposizioni.filter((d) => d.stato === "approvato").length;
  const pendingDisp = disposizioni.filter((d) => d.stato === "in_attesa").length;

  const totalPhotos = allPhotos.length;
  const approvedPhotos = allPhotos.filter((f) => f.stato === "approvato").length;
  const pendingPhotos = allPhotos.filter((f) => f.stato === "in_attesa").length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden p-6 md:p-12 pb-16">
      {/* Soft industrial subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-350 to-transparent pointer-events-none" />

      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold">
              ← CONTROL HIERARCHY
            </Link>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-2">
            PREPOSTO <span className="text-slate-300">{"//"}</span> CONTROL ROOM
          </h1>
          <p className="text-slate-500 mt-1 text-xs font-sans">
            Registro storico delle approvazioni e controllo attività sul Bot Telegram.
          </p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 flex items-center gap-3 rounded-full shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 animate-pulse rounded-full" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Audit Trail Attivo
          </span>
        </div>
      </header>

      {/* Stat Cards */}
      <section className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm shadow-slate-100/40">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Disposizioni Totali</p>
          <p className="text-3xl font-black mt-1 text-slate-900">{totalDisp}</p>
        </div>
        <div className="bg-white border border-emerald-200 p-5 rounded-2xl shadow-sm shadow-slate-100/40">
          <p className="text-[10px] text-emerald-700/70 font-bold uppercase tracking-widest">Disposizioni Approvate</p>
          <p className="text-3xl font-black mt-1 text-emerald-600">{approvedDisp}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm shadow-slate-100/40">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Foto Caricate</p>
          <p className="text-3xl font-black mt-1 text-slate-900">{totalPhotos}</p>
        </div>
        <div className="bg-white border border-emerald-200 p-5 rounded-2xl shadow-sm shadow-slate-100/40">
          <p className="text-[10px] text-emerald-700/70 font-bold uppercase tracking-widest">Foto Approvate</p>
          <p className="text-3xl font-black mt-1 text-emerald-600">{approvedPhotos}</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Navigation Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 mb-6 relative z-10 pb-1">
          <div className="flex gap-6">
            <button
              onClick={() => {
                setActiveTab("disposizioni");
                setSearchTerm("");
              }}
              className={`pb-3 text-xs font-extrabold tracking-widest transition cursor-pointer relative uppercase ${
                activeTab === "disposizioni"
                  ? "text-slate-800"
                  : "text-slate-400 hover:text-slate-650"
              }`}
            >
              Disposizioni ({pendingDisp} in attesa)
              {activeTab === "disposizioni" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-800 rounded-full" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("foto");
                setSearchTerm("");
              }}
              className={`pb-3 text-xs font-extrabold tracking-widest transition cursor-pointer relative uppercase ${
                activeTab === "foto"
                  ? "text-slate-800"
                  : "text-slate-400 hover:text-slate-650"
              }`}
            >
              Foto Magazzino ({pendingPhotos} in attesa)
              {activeTab === "foto" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-800 rounded-full" />
              )}
            </button>
          </div>

          <div className="relative w-full sm:w-64 pb-2 sm:pb-0">
            <input
              type="text"
              placeholder={activeTab === "disposizioni" ? "Cerca codice o istruzione..." : "Cerca codice o didascalia..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all shadow-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        {/* tab Content */}
        {activeTab === "disposizioni" ? (
          <div className="space-y-4">
            {filteredDisposizioni.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center font-sans bg-white border border-slate-200 rounded-2xl shadow-sm">Nessuna disposizione trovata.</p>
            ) : (
              filteredDisposizioni.map((disp) => {
                const statusStyles: Record<string, string> = {
                  in_attesa: "bg-amber-50 border-amber-250 text-amber-700 rounded-full",
                  approvato: "bg-emerald-50 border-emerald-250 text-emerald-700 rounded-full",
                  rifiutato: "bg-rose-50 border-rose-250 text-rose-700 rounded-full",
                };

                return (
                  <div
                    key={disp.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-350 shadow-sm shadow-slate-100/40 transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                      <div>
                        <span className="font-mono text-xs text-slate-700 font-bold bg-slate-100 px-2.5 py-1 border border-slate-200 rounded-lg">
                          {disp.codice}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-3">
                          Creato il {new Date(disp.created_at).toLocaleString("it-IT")}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 border tracking-wider ${statusStyles[disp.stato]}`}>
                        {disp.stato === "in_attesa" && "⏳ In Attesa Telegram"}
                        {disp.stato === "approvato" && "✅ Approvato"}
                        {disp.stato === "rifiutato" && "❌ Rifiutato"}
                      </span>
                    </div>

                    <p className="text-slate-700 text-sm mb-3 leading-relaxed font-sans">{disp.descrizione}</p>

                    {disp.stato !== "in_attesa" && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3">
                        <div>
                          👤 Gestito da: <strong className="text-slate-700">{disp.approvato_da}</strong>
                        </div>
                        <div className="hidden sm:block text-slate-200">|</div>
                        <div>
                          📅 Decisione del: <strong className="text-slate-700">{new Date(disp.decisione_data).toLocaleString("it-IT")}</strong>
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
            {filteredPhotos.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center font-sans bg-white border border-slate-200 rounded-2xl shadow-sm">Nessuna foto trovata.</p>
            ) : (
              filteredPhotos.map((foto) => {
                const statusStyles: Record<string, string> = {
                  in_attesa: "bg-amber-50 border-amber-250 text-amber-700 rounded-full",
                  approvato: "bg-emerald-50 border-emerald-250 text-emerald-700 rounded-full",
                  rifiutato: "bg-rose-50 border-rose-250 text-rose-700 rounded-full",
                };

                return (
                  <div
                    key={foto.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-350 shadow-sm shadow-slate-100/40 transition-all duration-300 flex flex-col md:flex-row gap-5"
                  >
                    {/* Immagine */}
                    <div
                      className="w-full md:w-32 aspect-square relative rounded-xl overflow-hidden bg-slate-50 border border-slate-200 hover:border-slate-450 transition cursor-zoom-in flex-shrink-0"
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
                            <span className="font-mono text-[10px] uppercase font-bold text-slate-650 bg-slate-100 px-2.5 py-0.5 border border-slate-200 rounded-lg">
                              Disp: {foto.codiceDisposizione}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-3">
                              Caricato il {new Date(foto.created_at).toLocaleString("it-IT")}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 border tracking-wider self-start sm:self-center ${statusStyles[foto.stato]}`}>
                            {foto.stato === "in_attesa" && "⏳ In Attesa Telegram"}
                            {foto.stato === "approvato" && "✅ Foto Approvata"}
                            {foto.stato === "rifiutato" && "❌ Foto Rifiutata"}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed mb-3 font-sans">{foto.descrizione}</p>
                      </div>

                      {foto.stato !== "in_attesa" && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2">
                          <div>
                            👤 Approvato da: <strong className="text-slate-700">{foto.decisione_da}</strong>
                          </div>
                          <div className="hidden sm:block text-slate-200">|</div>
                          <div>
                            📅 Data decisione: <strong className="text-slate-700">{new Date(foto.decisione_data).toLocaleString("it-IT")}</strong>
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
          <div
            className="max-w-4xl max-h-[85vh] relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt="Anteprima foto"
              className="object-contain max-h-[80vh] w-full"
            />
            <button
              className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer text-sm"
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
