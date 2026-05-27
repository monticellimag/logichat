"use client";

import React, { useState, useEffect } from "react";

export default function MagazzinoUploadPage() {
  const [disposizioni, setDisposizioni] = useState<any[]>([]);
  const [disposizioneId, setDisposizioneId] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Recupera le disposizioni approvate a cui associare le foto
  const fetchDisposizioniApprovate = async () => {
    try {
      const res = await fetch("/api/disposizioni");
      if (!res.ok) throw new Error("Errore nel recupero dati");
      const data = await res.json();
      
      // Filtra solo le disposizioni approvate
      const approvate = data.filter((d: any) => d.stato === "approvato");
      setDisposizioni(approvate);
      if (approvate.length > 0) {
        setDisposizioneId(approvate[0].id);
      }
    } catch (err) {
      console.error("Errore nel caricamento delle disposizioni:", err);
    }
  };

  useEffect(() => {
    fetchDisposizioniApprovate();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFotoFile(file);

    // Genera l'anteprima dell'immagine localmente
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!disposizioneId) {
      setErrorMsg("Nessuna disposizione attiva selezionata. Assicurati che ce ne sia almeno una approvata.");
      setLoading(false);
      return;
    }

    if (!descrizione.trim()) {
      setErrorMsg("Inserisci una descrizione per la foto.");
      setLoading(false);
      return;
    }

    if (!fotoFile) {
      setErrorMsg("Seleziona una foto da caricare.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("descrizione", descrizione.trim());
      formData.append("disposizione_id", disposizioneId);
      formData.append("foto", fotoFile);

      const res = await fetch("/api/foto", {
        method: "POST",
        body: formData, // Non impostiamo gli header; FormData lo fa da solo
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore durante l'upload della foto");
      }

      setSuccessMsg("✓ Foto caricata con successo! Inviata al Preposto per approvazione.");
      setDescrizione("");
      setFotoFile(null);
      setFotoPreview(null);
      
      // Resetta il selettore file nativo
      const fileInput = document.getElementById("foto-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (err: any) {
      setErrorMsg(err.message || "Errore sconosciuto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl p-6 relative overflow-hidden group">
        {/* Subtle glow effect */}
        <div className="absolute -inset-px bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-2xl blur opacity-30 group-hover:opacity-40 transition duration-500" />

        {/* Title */}
        <header className="text-center mb-6 relative z-10">
          <div className="text-4xl mb-2">🏭</div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-400">
            Logichat Magazzino
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-mono">
            Caricamento Foto Disposizioni
          </p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Seleziona la Disposizione Attiva
            </label>
            {disposizioni.length === 0 ? (
              <div className="w-full bg-slate-950/80 border border-rose-500/10 text-rose-400/90 rounded-xl px-4 py-3 text-xs italic">
                ⚠️ Nessuna disposizione attiva approvata disponibile al momento.LOG1 deve prima crearla e il Preposto deve approvarla.
              </div>
            ) : (
              <select
                value={disposizioneId}
                onChange={(e) => setDisposizioneId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition cursor-pointer"
                disabled={loading}
              >
                {disposizioni.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.codice} — {d.descrizione.substring(0, 30)}...
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Descrizione o Note della Foto
            </label>
            <input
              type="text"
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="E.g., Fine caricamento camion, Bancale danneggiato..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition"
              disabled={loading || disposizioni.length === 0}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Seleziona o Scatta Foto
            </label>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-950/40 transition group/upload">
              <input
                id="foto-input"
                type="file"
                accept="image/*"
                capture="environment" // Abilita l'apertura diretta della fotocamera posteriore su dispositivi mobili!
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading || disposizioni.length === 0}
              />
              
              {fotoPreview ? (
                <div className="w-full max-h-48 rounded-xl overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fotoPreview}
                    alt="Anteprima caricamento"
                    className="object-cover w-full h-full max-h-48"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition duration-200">
                    <span className="text-white text-xs font-semibold">Tocca per cambiare</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="text-4xl block mb-2">📸</span>
                  <span className="text-xs font-medium text-slate-400 block group-hover/upload:text-teal-400 transition">
                    Tocca per Scattare o Selezionare
                  </span>
                  <span className="text-[10px] text-slate-600 block mt-1">
                    Supporta fotocamera da smartphone
                  </span>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <span>✓</span> {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || disposizioni.length === 0}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-semibold rounded-xl py-3.5 px-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-40"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Carica Foto</span>
                <span>➔</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
