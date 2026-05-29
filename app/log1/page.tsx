"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

export default function Log1Dashboard() {
  const [disposizioni, setDisposizioni] = useState<any[]>([]);
  const [codice, setCodice] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [tipologia, setTipologia] = useState("carico");
  const [allegato, setAllegato] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Stati per la gestione della sezione Archivio e filtri avanzati
  const [activeSection, setActiveSection] = useState<"attesa" | "archivio">("attesa");
  const [filterTipologia, setFilterTipologia] = useState("tutti");
  const [filterStato, setFilterStato] = useState("tutti");

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
      const formData = new FormData();
      formData.append("codice", codice.trim());
      formData.append("descrizione", descrizione.trim());
      formData.append("tipologia", tipologia);
      if (allegato) {
        formData.append("allegato", allegato);
      }

      const res = await fetch("/api/disposizioni", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore invio");

      setSuccessMsg(`Disposizione "${codice.trim()}" inviata al Preposto.`);
      setCodice("");
      setDescrizione("");
      setTipologia("carico");
      setAllegato(null);

      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      fetchDisposizioni();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Sei sicuro di voler annullare questa disposizione?")) return;
    try {
      const res = await fetch(`/api/disposizioni/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Errore durante l'annullamento");
      fetchDisposizioni();
    } catch (err) {
      alert("Impossibile annullare la disposizione");
    }
  };

  const statusStyle: Record<string, { bar: string; badge: string; label: string }> = {
    in_attesa: {
      bar: "bg-amber-400",
      badge: "bg-amber-50 border-amber-200 text-amber-700",
      label: "⏳ In Attesa",
    },
    approvato: {
      bar: "bg-emerald-500",
      badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
      label: "✅ Approvata",
    },
    rifiutato: {
      bar: "bg-rose-500",
      badge: "bg-rose-50 border-rose-200 text-rose-700",
      label: "❌ Rifiutata",
    },
  };

  const tipologiaStyle: Record<string, { badge: string; label: string; dot?: string }> = {
    carico: {
      badge: "bg-blue-50 border-blue-200 text-blue-700",
      label: "🔵 Carico",
    },
    scarico: {
      badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
      label: "🟢 Scarico",
    },
    priorita: {
      badge: "bg-rose-50 border-rose-200 text-rose-700 animate-pulse",
      label: "🚨 Priorità",
      dot: "w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5"
    },
    generica: {
      badge: "bg-slate-50 border-slate-200 text-slate-600",
      label: "📦 Generica",
    }
  };

  const counts = {
    in_attesa: disposizioni.filter((d) => d.stato === "in_attesa").length,
    approvato: disposizioni.filter((d) => d.stato === "approvato").length,
    rifiutato: disposizioni.filter((d) => d.stato === "rifiutato").length,
  };

  const displayedDisposizioni = disposizioni.filter((d) => {
    // 1. Text Search Filter (always active)
    const matchesSearch =
      d.codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.descrizione.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Tab Section Filter
    if (activeSection === "attesa") {
      return d.stato === "in_attesa";
    } else {
      // activeSection === "archivio"
      const matchesStatusTab = d.stato === "approvato" || d.stato === "rifiutato";
      if (!matchesStatusTab) return false;

      // 2a. Advanced Filters inside Archive
      const matchesTipologia = filterTipologia === "tutti" || d.tipologia === filterTipologia;
      const matchesStato = filterStato === "tutti" || d.stato === filterStato;

      return matchesTipologia && matchesStato;
    }
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden pb-12">
      {/* Soft industrial subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50 pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-slate-350 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition text-[10px] font-bold uppercase tracking-widest">
              ← Control Hierarchy
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-2">
              LOG1 <span className="text-slate-300">//</span> Disposizioni
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-sans">
              Crea e monitora le disposizioni operative inviate ai magazzinieri.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Live</span>
          </div>
        </header>

        {/* ── KPI strip ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "In Attesa", value: counts.in_attesa, color: "text-amber-700 bg-amber-50/60 border-amber-200" },
            { label: "Approvate", value: counts.approvato, color: "text-emerald-700 bg-emerald-50/60 border-emerald-250" },
            { label: "Rifiutate", value: counts.rifiutato, color: "text-rose-700 bg-rose-50/60 border-rose-250" },
          ].map((k) => (
            <div key={k.label} className={`bg-white border ${k.color.split(" ").slice(1).join(" ")} p-5 rounded-2xl shadow-sm shadow-slate-100/40 text-center flex flex-col justify-center items-center`}>
              <div className={`text-3xl font-black ${k.color.split(" ")[0]}`}>{k.value}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── FORM (2/5) ───────────────────────────────────────────────── */}
          <section className="lg:col-span-2">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm shadow-slate-100/50 sticky top-6">
              <h2 className="text-xs font-bold text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1.5 h-4 bg-slate-500 rounded-full inline-block" />
                Nuova Disposizione
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Codice
                  </label>
                  <input
                    type="text"
                    value={codice}
                    onChange={(e) => setCodice(e.target.value)}
                    placeholder="Es. LOG1-2026-001"
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-850 placeholder-slate-350 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Tipologia Flusso
                  </label>
                  <select
                    value={tipologia}
                    onChange={(e) => setTipologia(e.target.value)}
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-850 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-sans cursor-pointer"
                  >
                    <option value="carico">🔵 Carico Camion</option>
                    <option value="scarico">🟢 Scarico Camion</option>
                    <option value="priorita">🚨 PRIORITÀ (Urgenza)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Istruzione
                  </label>
                  <textarea
                    value={descrizione}
                    onChange={(e) => setDescrizione(e.target.value)}
                    placeholder="Scrivi l'istruzione operativa..."
                    rows={5}
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-850 placeholder-slate-350 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Allegato (Opzionale)
                  </label>
                  <div className="relative flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        <span className="text-xl mb-1">📎</span>
                        <p className="text-xs text-slate-500 font-medium px-4 text-center truncate w-full">
                          {allegato ? allegato.name : "Carica un file (Foto, PDF, ecc.)"}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {allegato ? `${(allegato.size / 1024 / 1024).toFixed(2)} MB` : "Dimensione massima: 10MB"}
                        </p>
                      </div>
                      <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        disabled={loading}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAllegato(file);
                        }}
                      />
                    </label>
                  </div>
                  {allegato && (
                    <button
                      type="button"
                      onClick={() => setAllegato(null)}
                      className="text-[9px] text-rose-500 hover:text-rose-700 font-bold uppercase tracking-widest mt-1.5 inline-block cursor-pointer"
                    >
                      Rimuovi Allegato
                    </button>
                  )}
                </div>

                {submitError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl px-4 py-3 text-xs flex gap-2 font-sans items-center">
                    <span className="text-sm">⚠️</span>{submitError}
                  </div>
                )}
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl px-4 py-3 text-xs flex gap-2 font-sans items-center">
                    <span className="text-sm">✓</span>{successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest transition disabled:opacity-40 cursor-pointer shadow-sm shadow-slate-100"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Invia al Preposto ➔"
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* ── STORICO (3/5) ────────────────────────────────────────────── */}
          <section className="lg:col-span-3 space-y-3">
            {/* Switcer a schede per dividere Storico Attivo da Archivio Storico */}
            <div className="flex border-b border-slate-200 mb-6 p-1 bg-slate-200/50 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSection("attesa")}
                className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  activeSection === "attesa"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ⏳ In Attesa ({counts.in_attesa})
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("archivio")}
                className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                  activeSection === "archivio"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🗄️ Archivio Storico ({counts.approvato + counts.rifiutato})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1.5 h-4 bg-slate-400 rounded-full inline-block" />
                {activeSection === "attesa" ? "Disposizioni in Attesa" : "Archivio Pratiche"} ({displayedDisposizioni.length})
              </h2>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cerca codice o testo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              </div>
            </div>

            {/* Pannello filtri avanzati per la sezione Archivio */}
            {activeSection === "archivio" && (
              <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm shadow-slate-100/50 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Filtra per Tipologia
                  </label>
                  <select
                    value={filterTipologia}
                    onChange={(e) => setFilterTipologia(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-750 focus:outline-none focus:border-slate-350 cursor-pointer font-sans"
                  >
                    <option value="tutti">📁 Tutti i flussi</option>
                    <option value="carico">🔵 Solo Carichi</option>
                    <option value="scarico">🟢 Solo Scarichi</option>
                    <option value="priorita">🚨 Solo Priorità</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Filtra per Stato
                  </label>
                  <select
                    value={filterStato}
                    onChange={(e) => setFilterStato(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-750 focus:outline-none focus:border-slate-350 cursor-pointer font-sans"
                  >
                    <option value="tutti">📊 Tutti gli Stati</option>
                    <option value="approvato">✅ Solo Approvate</option>
                    <option value="rifiutato">❌ Solo Rifiutate</option>
                  </select>
                </div>
              </div>
            )}

            {displayedDisposizioni.length === 0 ? (
              <div className="bg-white border border-slate-200 p-12 rounded-2xl shadow-sm text-center text-slate-450 font-sans">
                <span className="text-3xl block mb-2">📋</span>
                Nessun risultato trovato.
              </div>
            ) : (
              displayedDisposizioni.map((d) => {
                const s = statusStyle[d.stato] ?? statusStyle.in_attesa;
                return (
                  <div
                    key={d.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-sm shadow-slate-100/40 transition-all overflow-hidden"
                  >
                    {/* colored top bar */}
                    <div className={`h-[3px] ${s.bar}`} />
                    <div className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-slate-700 font-mono text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-0.5">
                            {d.codice}
                          </span>
                          
                          {/* Badge Colorato Categoria */}
                          {(() => {
                            const t = tipologiaStyle[d.tipologia] || tipologiaStyle.generica;
                            return (
                              <span className={`relative text-[9px] font-bold px-2 py-0.5 border rounded-md uppercase tracking-wider ${t.badge}`}>
                                {t.label}
                                {t.dot && <span className={t.dot} />}
                              </span>
                            );
                          })()}

                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(d.created_at).toLocaleString("it-IT", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm font-sans leading-relaxed line-clamp-2">
                          {d.descrizione}
                        </p>
                        {d.allegato_url && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400">📎</span>
                            <a
                              href={d.allegato_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-slate-800 underline font-medium truncate max-w-[200px] sm:max-w-xs"
                            >
                              {d.allegato_name || "Visualizza Allegato"}
                            </a>
                          </div>
                        )}
                        {d.approvato_da && (
                          <p className="text-[10px] text-slate-400 mt-2 font-mono">
                            👤 {d.approvato_da} · {new Date(d.decisione_data).toLocaleDateString("it-IT")}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`shrink-0 text-[10px] font-bold px-3 py-1 border rounded-full ${s.badge} uppercase tracking-wider`}>
                          {s.label}
                        </span>
                        {d.stato === "in_attesa" && (
                          <button
                            onClick={() => handleCancel(d.id)}
                            className="text-[10px] text-rose-500 hover:text-rose-700 underline font-bold uppercase tracking-widest mt-1 cursor-pointer"
                          >
                            Annulla
                          </button>
                        )}
                      </div>
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
