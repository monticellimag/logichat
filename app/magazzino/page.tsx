"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FotoMagazzino } from "@/types";

export default function MagazzinoPage() {
  // ── Upload state ────────────────────────────────────────────────────────────
  const [disposizioni, setDisposizioni] = useState<any[]>([]);
  const [disposizioneId, setDisposizioneId] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // ── Gallery state ───────────────────────────────────────────────────────────
  const [foto, setFoto] = useState<FotoMagazzino[]>([]);
  const [fotoTab, setFotoTab] = useState<"tutte" | "approvate" | "in_attesa">("tutte");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchDisposizioni = useCallback(async () => {
    try {
      const res = await fetch("/api/disposizioni");
      const data = await res.json();
      const approvate = data.filter((d: any) => d.stato === "approvato");
      setDisposizioni(approvate);
      if (approvate.length > 0 && !disposizioneId) {
        setDisposizioneId(approvate[0].id);
      }
    } catch {/* ignora */}
  }, [disposizioneId]);

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

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadError("");
    setUploadSuccess("");

    if (!disposizioneId) {
      setUploadError("Nessuna disposizione attiva. LOG1 deve crearne una e il Preposto approvarla.");
      setUploadLoading(false);
      return;
    }
    if (!descrizione.trim()) {
      setUploadError("Inserisci una descrizione.");
      setUploadLoading(false);
      return;
    }
    if (!fotoFile) {
      setUploadError("Seleziona una foto.");
      setUploadLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("descrizione", descrizione.trim());
      fd.append("disposizione_id", disposizioneId);
      fd.append("foto", fotoFile);

      const res = await fetch("/api/foto", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore upload");

      setUploadSuccess("✓ Foto inviata al Preposto per approvazione.");
      setDescrizione("");
      setFotoFile(null);
      setFotoPreview(null);
      const inp = document.getElementById("foto-input") as HTMLInputElement;
      if (inp) inp.value = "";
      fetchFoto();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // ── Derivati ────────────────────────────────────────────────────────────────
  const fotoFiltrate = foto.filter((f) => {
    if (fotoTab === "approvate") return f.stato === "approvato";
    if (fotoTab === "in_attesa") return f.stato === "in_attesa";
    return true;
  });

  const statoBadge: Record<string, string> = {
    in_attesa: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    approvato:  "bg-lime-500/10 border-lime-500/40 text-lime-400",
    rifiutato:  "bg-rose-500/10 border-rose-500/40 text-rose-400",
  };
  const statoBar: Record<string, string> = {
    in_attesa: "bg-amber-500",
    approvato:  "bg-lime-500",
    rifiutato:  "bg-rose-500",
  };
  const statoLabel: Record<string, string> = {
    in_attesa: "⏳ In Attesa",
    approvato:  "✅ Approvata",
    rifiutato:  "❌ Rifiutata",
  };

  return (
    <main className="min-h-screen bg-[#000000] text-zinc-100 font-mono relative overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-lime-500/20 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <Link href="/" className="text-zinc-600 hover:text-lime-400 transition text-[10px] font-bold uppercase tracking-widest">
              ← Control Hierarchy
            </Link>
            <h1 className="text-3xl font-black tracking-tighter text-white mt-2">
              Magazzino <span className="text-zinc-600">//</span> Foto
            </h1>
            <p className="text-zinc-500 text-xs mt-1">
              Carica foto operative e monitora le approvazioni del Preposto.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 bg-lime-400 animate-pulse" />
            <span className="text-[10px] text-lime-400 font-bold uppercase tracking-widest">Live</span>
          </div>
        </header>

        {/* ── SEZIONE UPLOAD ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1.5 h-4 bg-lime-500 inline-block" />
            Carica Nuova Foto
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Form (3/5) */}
            <div className="lg:col-span-3 bg-[#09090b] border border-zinc-800 p-6 space-y-4">

              {/* Selezione disposizione */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                  Disposizione Attiva
                </label>
                {disposizioni.length === 0 ? (
                  <div className="border border-rose-500/20 bg-rose-950/10 text-rose-400 px-4 py-3 text-xs font-sans">
                    ⚠️ Nessuna disposizione approvata. LOG1 deve crearne una.
                  </div>
                ) : (
                  <select
                    value={disposizioneId}
                    onChange={(e) => setDisposizioneId(e.target.value)}
                    disabled={uploadLoading}
                    className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-lime-500/60 transition cursor-pointer font-mono"
                  >
                    {disposizioni.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.codice} — {d.descrizione.slice(0, 40)}{d.descrizione.length > 40 ? "…" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                  Note / Descrizione
                </label>
                <input
                  type="text"
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  placeholder="Es. Fine carico camion TRJ, Bancale danneggiato..."
                  disabled={uploadLoading || disposizioni.length === 0}
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-lime-500/60 transition font-sans"
                />
              </div>

              {/* Feedback */}
              {uploadError && (
                <div className="bg-rose-950/20 border border-rose-500/20 text-rose-400 px-3 py-2.5 text-xs flex gap-2">
                  <span>⚠️</span>{uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="bg-lime-950/20 border border-lime-500/20 text-lime-400 px-3 py-2.5 text-xs flex gap-2">
                  <span>✓</span>{uploadSuccess}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit as any}
                disabled={uploadLoading || disposizioni.length === 0}
                className="w-full bg-lime-500 hover:bg-lime-400 active:bg-lime-600 text-black font-extrabold py-3 text-xs uppercase tracking-widest transition disabled:opacity-40 cursor-pointer"
              >
                {uploadLoading
                  ? <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  : "Carica Foto ➔"}
              </button>
            </div>

            {/* Drop zone (2/5) */}
            <div className="lg:col-span-2">
              <label
                htmlFor="foto-input"
                className="block h-full min-h-[240px] border-2 border-dashed border-zinc-800 hover:border-lime-500/50 bg-[#09090b] cursor-pointer transition group relative overflow-hidden"
              >
                <input
                  id="foto-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  disabled={uploadLoading || disposizioni.length === 0}
                  className="sr-only"
                />

                {fotoPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fotoPreview}
                      alt="Anteprima"
                      className="w-full h-full object-cover absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-white text-xs font-bold">📷 Cambia foto</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[240px] text-center p-6">
                    <span className="text-5xl mb-3 group-hover:scale-110 transition">📸</span>
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-lime-400 transition block">
                      Tocca per scattare o selezionare
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-1">
                      Supporta fotocamera smartphone
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>
        </section>

        {/* ── SEZIONE GALLERY ─────────────────────────────────────────────── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <span className="w-1.5 h-4 bg-zinc-600 inline-block" />
              Foto Ricevute
              <span className="text-zinc-600 font-normal normal-case text-xs ml-1">
                ({fotoFiltrate.length})
              </span>
            </h2>

            {/* Tab filtro */}
            <div className="flex border border-zinc-800 text-[10px] font-bold overflow-hidden">
              {(["tutte", "approvate", "in_attesa"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFotoTab(tab)}
                  className={`px-4 py-2 uppercase tracking-widest transition cursor-pointer ${
                    fotoTab === tab
                      ? "bg-lime-500 text-black"
                      : "bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {tab === "tutte" ? "Tutte" : tab === "approvate" ? "✅ Approvate" : "⏳ In Attesa"}
                </button>
              ))}
            </div>
          </div>

          {fotoFiltrate.length === 0 ? (
            <div className="bg-[#09090b] border border-zinc-800 p-12 text-center text-zinc-600">
              <span className="text-3xl block mb-2">📷</span>
              {fotoTab === "in_attesa"
                ? "Nessuna foto in attesa."
                : fotoTab === "approvate"
                ? "Nessuna foto ancora approvata."
                : "Nessuna foto ricevuta. Postane una nel gruppo Telegram."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {fotoFiltrate.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedPhoto(`/api/foto?file_id=${f.telegram_file_id}`)}
                  className="group cursor-pointer bg-[#09090b] border border-zinc-800 hover:border-zinc-600 transition overflow-hidden"
                >
                  {/* Status bar */}
                  <div className={`h-[2px] ${statoBar[f.stato] ?? "bg-zinc-700"}`} />

                  {/* Immagine */}
                  <div className="aspect-square overflow-hidden bg-zinc-950 relative">
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
                    <p className="text-[10px] text-zinc-300 truncate font-sans font-medium">
                      {f.descrizione || "Senza descrizione"}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 border ${statoBadge[f.stato] ?? ""}`}>
                        {statoLabel[f.stato] ?? f.stato}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono shrink-0">
                        {new Date(f.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                        {" "}
                        {new Date(f.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {(f as any).disposizioni ? (
                      <p className="text-[9px] text-lime-500/70 font-mono truncate">
                        🔗 {(f as any).disposizioni.codice}
                      </p>
                    ) : (
                      <p className="text-[9px] text-zinc-700 font-mono">Generica</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ── Modal anteprima ─────────────────────────────────────────────────── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-3xl max-h-[85vh] relative border border-zinc-800 overflow-hidden shadow-2xl"
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
              className="absolute top-3 right-3 bg-black/80 hover:bg-zinc-900 text-white w-8 h-8 flex items-center justify-center border border-zinc-700 transition cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
