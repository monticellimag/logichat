"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function Log1Dashboard() {
  const [disposizioni, setDisposizioni] = useState<any[]>([]);
  const [codice, setCodice] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchDisposizioni = useCallback(async () => {
    try {
      const res = await fetch("/api/disposizioni");
      if (!res.ok) throw new Error();
      setDisposizioni(await res.json());
    } catch {
      console.error("Errore recupero disposizioni");
    }
  }, []);

  useEffect(() => {
    fetchDisposizioni();
    const id = setInterval(fetchDisposizioni, 10000);
    return () => clearInterval(id);
  }, [fetchDisposizioni]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");
    setSuccessMsg("");

    if (!codice.trim() || !descrizione.trim()) {
      setSubmitError("Codice e descrizione sono richiesti.");
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
      if (!res.ok) throw new Error(data.error || "Errore invio");

      setSuccessMsg(`Disposizione "${codice.trim()}" inviata al Preposto.`);
      setCodice("");
      setDescrizione("");
      fetchDisposizioni();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusStyle: Record<string, { bar: string; badge: string; label: string }> = {
    in_attesa: {
      bar: "bg-amber-500",
      badge: "bg-amber-500/10 border-amber-500/30 text-amber-400",
      label: "⏳ In Attesa",
    },
    approvato: {
      bar: "bg-lime-500",
      badge: "bg-lime-500/10 border-lime-500/30 text-lime-400",
      label: "✅ Approvata",
    },
    rifiutato: {
      bar: "bg-rose-500",
      badge: "bg-rose-500/10 border-rose-500/30 text-rose-400",
      label: "❌ Rifiutata",
    },
  };

  const counts = {
    in_attesa: disposizioni.filter((d) => d.stato === "in_attesa").length,
    approvato: disposizioni.filter((d) => d.stato === "approvato").length,
    rifiutato: disposizioni.filter((d) => d.stato === "rifiutato").length,
  };

  return (
    <main className="min-h-screen bg-[#000000] text-zinc-100 font-mono relative overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-lime-500/20 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <Link href="/" className="text-zinc-600 hover:text-lime-400 transition text-[10px] font-bold uppercase tracking-widest">
              ← Control Hierarchy
            </Link>
            <h1 className="text-3xl font-black tracking-tighter text-white mt-2">
              LOG1 <span className="text-zinc-600">//</span> Disposizioni
            </h1>
            <p className="text-zinc-500 text-xs mt-1">
              Crea e monitora le disposizioni operative inviate ai magazzinieri.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-none bg-lime-400 animate-pulse" />
            <span className="text-[10px] text-lime-400 font-bold uppercase tracking-widest">Live</span>
          </div>
        </header>

        {/* ── KPI strip ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: "In Attesa", value: counts.in_attesa, color: "text-amber-400", border: "border-amber-500/20" },
            { label: "Approvate", value: counts.approvato, color: "text-lime-400", border: "border-lime-500/20" },
            { label: "Rifiutate", value: counts.rifiutato, color: "text-rose-400", border: "border-rose-500/20" },
          ].map((k) => (
            <div key={k.label} className={`bg-[#09090b] border ${k.border} p-4 text-center`}>
              <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── FORM (2/5) ───────────────────────────────────────────────── */}
          <section className="lg:col-span-2">
            <div className="bg-[#09090b] border border-zinc-800 p-6 sticky top-6">
              <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1.5 h-4 bg-lime-500 inline-block" />
                Nuova Disposizione
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                    Codice
                  </label>
                  <input
                    type="text"
                    value={codice}
                    onChange={(e) => setCodice(e.target.value)}
                    placeholder="Es. LOG1-2026-001"
                    disabled={loading}
                    className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-lime-500/60 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                    Istruzione
                  </label>
                  <textarea
                    value={descrizione}
                    onChange={(e) => setDescrizione(e.target.value)}
                    placeholder="Scrivi l'istruzione operativa..."
                    rows={5}
                    disabled={loading}
                    className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-lime-500/60 transition resize-none font-sans"
                  />
                </div>

                {submitError && (
                  <div className="bg-rose-950/20 border border-rose-500/20 text-rose-400 px-3 py-2.5 text-xs flex gap-2">
                    <span>⚠️</span>{submitError}
                  </div>
                )}
                {successMsg && (
                  <div className="bg-lime-950/20 border border-lime-500/20 text-lime-400 px-3 py-2.5 text-xs flex gap-2">
                    <span>✓</span>{successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-lime-500 hover:bg-lime-400 active:bg-lime-600 text-black font-extrabold py-3 text-xs uppercase tracking-widest transition disabled:opacity-40 cursor-pointer"
                >
                  {loading
                    ? <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    : "Invia al Preposto ➔"}
                </button>
              </form>
            </div>
          </section>

          {/* ── STORICO (3/5) ────────────────────────────────────────────── */}
          <section className="lg:col-span-3 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <span className="w-1.5 h-4 bg-zinc-600 inline-block" />
              Storico ({disposizioni.length})
            </h2>

            {disposizioni.length === 0 ? (
              <div className="bg-[#09090b] border border-zinc-800 p-12 text-center text-zinc-600">
                <span className="text-3xl block mb-2">📋</span>
                Nessuna disposizione ancora creata.
              </div>
            ) : (
              disposizioni.map((d) => {
                const s = statusStyle[d.stato] ?? statusStyle.in_attesa;
                return (
                  <div
                    key={d.id}
                    className="bg-[#09090b] border border-zinc-800 hover:border-zinc-700 transition overflow-hidden"
                  >
                    {/* colored top bar */}
                    <div className={`h-[2px] ${s.bar}`} />
                    <div className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lime-400 font-mono text-xs font-bold bg-lime-500/5 border border-lime-500/10 px-2 py-0.5">
                            {d.codice}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-mono">
                            {new Date(d.created_at).toLocaleString("it-IT", {
                              day: "2-digit", month: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-sm font-sans leading-relaxed line-clamp-2">
                          {d.descrizione}
                        </p>
                        {d.approvato_da && (
                          <p className="text-[10px] text-zinc-600 mt-2 font-mono">
                            👤 {d.approvato_da} · {new Date(d.decisione_data).toLocaleDateString("it-IT")}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 border ${s.badge} uppercase tracking-wider`}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
