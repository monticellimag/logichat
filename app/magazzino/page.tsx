"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FotoMagazzino } from "@/types";

export default function MagazzinoPage() {
  const [disposizioni, setDisposizioni] = useState<any[]>([]);
  const [foto, setFoto] = useState<FotoMagazzino[]>([]);
  const [fotoTab, setFotoTab] = useState<"tutte" | "approvate" | "in_attesa">("tutte");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // ── Fetch ──
  const fetchDisposizioni = useCallback(async () => {
    try {
      const res = await fetch("/api/disposizioni");
      const data = await res.json();
      // Mostriamo solo le disposizioni approvate (attive per i magazzinieri)
      const approvate = data.filter((d: any) => d.stato === "approvato");
      setDisposizioni(approvate);
    } catch {/* ignora */}
  }, []);

  const fetchFoto = useCallback(async () => {
    try {
      const res = await fetch("/api/foto/list");
      if (res.ok) setFoto(await res.json());
    } catch {/* ignora */}
  }, []);

  useEffect(() => {
    fetchDisposizioni();
    fetchFoto();
    const id = setInterval(() => {
      fetchDisposizioni();
      fetchFoto();
    }, 10000);
    return () => clearInterval(id);
  }, [fetchDisposizioni, fetchFoto]);

  // ── Derivati ──
  const fotoFiltrate = foto.filter((f) => {
    if (fotoTab === "approvate") return f.stato === "approvato";
    if (fotoTab === "in_attesa") return f.stato === "in_attesa";
    return true;
  });

  const statoBadge: Record<string, string> = {
    in_attesa: "bg-amber-50 border-amber-250 text-amber-700",
    approvato:  "bg-emerald-50 border-emerald-250 text-emerald-700",
    rifiutato:  "bg-rose-50 border-rose-250 text-rose-700",
  };
  const statoBar: Record<string, string> = {
    in_attesa: "bg-amber-500",
    approvato:  "bg-emerald-500",
    rifiutato:  "bg-rose-500",
  };
  const statoLabel: Record<string, string> = {
    in_attesa: "⏳ In Attesa",
    approvato:  "✅ Approvata",
    rifiutato:  "❌ Rifiutata",
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden pb-12">
      {/* Soft industrial subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-350 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition text-[10px] font-bold uppercase tracking-widest">
              ← Control Hierarchy
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-2">
              Magazzino <span className="text-slate-300">//</span> Operazioni
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-sans">
              Consulta le istruzioni attive e monitora le foto caricate tramite il Bot Telegram.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Live</span>
          </div>
        </header>

        {/* ── MAIN TWO-COLUMN BENTO LAYOUT ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── COLONNA DISPOSIZIONI ATTIVE (2/5) ───────────────────────────── */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center min-h-[40px]">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1.5 h-4 bg-slate-500 rounded-full inline-block" />
                Disposizioni Attive ({disposizioni.length})
              </h2>
            </div>

            {disposizioni.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm text-center text-slate-450 font-sans leading-relaxed">
                <span className="text-2xl block mb-1">📋</span>
                Nessuna disposizione attiva al momento.
                <p className="text-[10px] text-slate-400 mt-1">Le nuove istruzioni appariranno qui una volta approvate dal Preposto.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {disposizioni.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm shadow-slate-100/40 space-y-3 hover:border-slate-300 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-700 font-bold bg-slate-100 px-2.5 py-0.5 border border-slate-200 rounded-lg">
                        {d.codice}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(d.decisione_data).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-slate-700 text-sm font-sans leading-relaxed">
                      {d.descrizione}
                    </p>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 font-sans leading-relaxed">
                      💡 <strong>Per magazzinieri:</strong> Invia la foto al Bot Telegram scrivendo <code>{d.codice}</code> come commento del post.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── COLONNA FOTO GALLERY (3/5) ──────────────────────────────────── */}
          <section className="lg:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[40px]">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1.5 h-4 bg-slate-400 rounded-full inline-block" />
                Foto Ricevute ({fotoFiltrate.length})
              </h2>

              {/* Tab filtro */}
              <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm text-[10px] font-bold overflow-hidden shrink-0 self-start sm:self-auto">
                {(["tutte", "approvate", "in_attesa"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFotoTab(tab)}
                    className={`px-3 py-1.5 rounded-lg uppercase tracking-widest transition cursor-pointer ${
                      fotoTab === tab
                        ? "bg-slate-800 text-white shadow-sm"
                        : "bg-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab === "tutte" ? "Tutte" : tab === "approvate" ? "✅ Approvate" : "⏳ In Attesa"}
                  </button>
                ))}
              </div>
            </div>

            {fotoFiltrate.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 rounded-2xl shadow-sm text-center text-slate-450 font-sans">
                <span className="text-3xl block mb-2">📷</span>
                {fotoTab === "in_attesa"
                  ? "Nessuna foto in attesa."
                  : fotoTab === "approvate"
                  ? "Nessuna foto ancora approvata."
                  : "Nessuna foto ricevuta. Invia una foto con il codice della disposizione al Bot Telegram."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {fotoFiltrate.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedPhoto(`/api/foto?file_id=${f.telegram_file_id}`)}
                    className="group cursor-pointer bg-white border border-slate-200 hover:border-slate-350 rounded-2xl shadow-sm shadow-slate-100/40 transition-all overflow-hidden"
                  >
                    {/* Status bar */}
                    <div className={`h-[3px] ${statoBar[f.stato] ?? "bg-slate-300"}`} />

                    {/* Immagine */}
                    <div className="aspect-square overflow-hidden bg-slate-50 relative border-b border-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/foto?file_id=${f.telegram_file_id}`}
                        alt={f.descrizione}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2.5 space-y-1.5">
                      <p className="text-[10px] text-slate-800 truncate font-sans font-medium">
                        {f.descrizione || "Senza descrizione"}
                      </p>
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${statoBadge[f.stato] ?? ""}`}>
                          {statoLabel[f.stato] ?? f.stato}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono shrink-0">
                          {new Date(f.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                        </span>
                      </div>
                      {(f as any).disposizioni ? (
                        <p className="text-[9px] text-slate-500 font-mono truncate">
                          🔗 {(f as any).disposizioni.codice}
                        </p>
                      ) : (
                        <p className="text-[9px] text-slate-450 font-mono">Generica</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </div>

      {/* ── Modal anteprima ─────────────────────────────────────────────────── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-3xl max-h-[85vh] relative border border-slate-700 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt="Anteprima"
              className="object-contain max-h-[80vh] w-full"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
