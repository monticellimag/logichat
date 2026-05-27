"use client";

import React, { useState, useEffect } from "react";
import { Disposizione, FotoMagazzino } from "@/types";

export default function Log1Dashboard() {
  const [disposizioni, setDisposizioni] = useState<any[]>([]);
  const [codice, setCodice] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Carica i dati delle disposizioni e foto associate
  const fetchDisposizioni = async () => {
    try {
      const res = await fetch("/api/disposizioni");
      if (!res.ok) throw new Error("Errore durante il recupero dei dati");
      const data = await res.json();
      setDisposizioni(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Poll ogni 10 secondi per aggiornamenti in tempo reale
  useEffect(() => {
    fetchDisposizioni();
    const interval = setInterval(fetchDisposizioni, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");
    setSuccessMsg("");

    if (!codice.trim() || !descrizione.trim()) {
      setSubmitError("Codice e descrizione sono richiesti");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/disposizioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codice: codice.trim(), descrizione: descrizione.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossibile inviare la disposizione");
      }

      setSuccessMsg(`Disposizione ${codice} inviata ed in attesa di approvazione!`);
      setCodice("");
      setDescrizione("");
      fetchDisposizioni();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 p-6 md:p-12">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-200">
            LOG1 Dashboard
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Inserisci disposizioni e monitora le foto approvate dei magazzinieri.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400/90 font-mono tracking-widest uppercase">
            Live Polling Attivo
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Sezione (1/3) */}
        <section className="lg:col-span-1">
          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
            {/* Subtle glow effect */}
            <div className="absolute -inset-px bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
            
            <h2 className="text-xl font-bold mb-4 relative z-10 text-white flex items-center gap-2">
              <span>📤</span> Nuova Disposizione
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Codice Disposizione
                </label>
                <input
                  type="text"
                  value={codice}
                  onChange={(e) => setCodice(e.target.value)}
                  placeholder="E.g., LOG1-2026-001"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Dettaglio Istruzione
                </label>
                <textarea
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  placeholder="Scrivi qui cosa deve fare il magazzino..."
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition resize-none"
                  disabled={loading}
                />
              </div>

              {submitError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                  <span>⚠️</span> {submitError}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                  <span>✓</span> {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl py-3 px-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Invia al Preposto</span>
                    <span>➔</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Tabella / Lista Sezione (2/3) */}
        <section className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📋</span> Storico Disposizioni & Foto Approva
          </h2>

          {disposizioni.length === 0 ? (
            <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500">
              <span className="text-4xl block mb-2">📦</span>
              Nessuna disposizione inserita finora.
            </div>
          ) : (
            <div className="space-y-4">
              {disposizioni.map((disp) => {
                const badgeColors: Record<string, string> = {
                  in_attesa: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  approvato: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  rifiutato: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                };

                const badgeLabels: Record<string, string> = {
                  in_attesa: "⏳ In Attesa Preposto",
                  approvato: "✅ Approvata",
                  rifiutato: "❌ Rifiutata",
                };

                // Filtra solo le foto approvate da mostrare
                const approvedPhotos = (disp.foto_magazzino || []).filter(
                  (f: FotoMagazzino) => f.stato === "approvato"
                );

                return (
                  <div
                    key={disp.id}
                    className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-slate-900/60 transition duration-300 relative overflow-hidden group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div>
                        <span className="font-mono text-xs text-blue-400 font-bold bg-blue-500/5 px-2.5 py-1 rounded-md border border-blue-500/10">
                          {disp.codice}
                        </span>
                        <span className="text-xs text-slate-500 ml-3">
                          {new Date(disp.created_at).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                          badgeColors[disp.stato]
                        }`}
                      >
                        {badgeLabels[disp.stato]}
                      </span>
                    </div>

                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      {disp.descrizione}
                    </p>

                    {/* Dettagli della decisione */}
                    {disp.stato !== "in_attesa" && (
                      <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl px-4 py-2.5 text-xs text-slate-400 mb-4 flex items-center gap-2">
                        <span>👤</span> Deciso da:{" "}
                        <strong className="text-slate-300">{disp.approvato_da}</strong> il{" "}
                        {new Date(disp.decisione_data).toLocaleDateString("it-IT")}
                      </div>
                    )}

                    {/* Foto associate approvate */}
                    {disp.stato === "approvato" && (
                      <div className="border-t border-slate-800/80 pt-4 mt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <span>📷</span> Foto Magazzino Approvare ({approvedPhotos.length})
                        </h4>

                        {approvedPhotos.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">
                            In attesa che il magazziniere carichi le foto...
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {approvedPhotos.map((foto: FotoMagazzino) => (
                              <div
                                key={foto.id}
                                className="group/photo relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition cursor-pointer"
                                onClick={() =>
                                  setSelectedPhoto(`/api/foto?file_id=${foto.telegram_file_id}`)
                                }
                              >
                                <div className="aspect-square relative w-full overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`/api/foto?file_id=${foto.telegram_file_id}`}
                                    alt={foto.descrizione}
                                    className="object-cover w-full h-full group-hover/photo:scale-105 transition duration-300"
                                  />
                                </div>
                                <div className="p-2 bg-slate-950/95 border-t border-slate-900">
                                  <p className="text-[10px] text-slate-400 truncate font-medium">
                                    {foto.descrizione}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
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
