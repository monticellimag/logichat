"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [systemTime, setSystemTime] = useState("");
  const [activeLogs, setActiveLogs] = useState<string[]>([
    "INITIALIZING COGNITIVE INTERFACE...",
    "SUPABASE DATABASE CONNECTED // RLS DEACTIVATED",
    "TELEGRAM GATEWAY ACTIVE on port 3000",
    "LOGICHAT PLATFORM ONLINE."
  ]);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleTimeString("it-IT", { hour12: false }) + 
        " // " + 
        now.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const addHoverLog = (portal: string) => {
    const timestamp = new Date().toLocaleTimeString("it-IT", { hour12: false });
    setActiveLogs((prev) => [
      `[${timestamp}] FOCUS ACQUIRED: ${portal.toUpperCase()} PORTAL`,
      ...prev.slice(0, 3)
    ]);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-mono text-slate-400 text-sm">
        LOADING CORE INTERFACE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 relative overflow-hidden flex flex-col justify-between selection:bg-slate-800 selection:text-white">
      {/* Soft industrial subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent pointer-events-none" />

      {/* TOP STATUS BAR */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm z-10 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-slate-900 font-extrabold tracking-widest text-sm">LOGICHAT // SYS_v1.0</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <div>DATABASE: <span className="text-emerald-600 font-bold">ONLINE</span></div>
          <div>BOT GATEWAY: <span className="text-emerald-600 font-bold">READY</span></div>
          <div className="font-mono text-slate-400">{systemTime}</div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center gap-12 z-10">
        
        {/* ASYMMETRIC TYPOGRAPHIC HERO */}
        <section className="flex flex-col gap-4 text-left max-w-4xl">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-slate-450 pl-3">
            LOGISTICS & TELEGRAM SYNERGY SYSTEM
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 leading-none tracking-tight">
            LOGICHAT <br />
            <span className="text-slate-400 font-light">// CONTROL HIERARCHY</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed mt-2 font-sans">
            Piattaforma industriale per lo smistamento delle disposizioni operative da LOG1, convalida immediata dei preposti via Telegram, e archiviazione fotografica illimitata per i magazzinieri.
          </p>
        </section>

        {/* ASYMMETRIC CONTROLS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* PORTALS LIST */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* PORTAL 1: LOG1 */}
            <Link 
              href="/log1"
              onMouseEnter={() => addHoverLog("LOG1")}
              className="group relative bg-white border border-slate-200 hover:border-slate-350 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer rounded-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="text-slate-300 text-3xl font-extrabold tracking-widest font-mono group-hover:text-slate-500 transition-colors">
                  01 //
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-wide group-hover:text-slate-950 transition-colors">
                    LOG1 Dashboard
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md font-sans">
                    Pannello di invio per disposizioni operative e monitoraggio in tempo reale delle foto caricate dai magazzinieri.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2 font-bold group-hover:bg-slate-850 group-hover:text-white group-hover:border-slate-850 transition-all shadow-sm">
                ACCEDI PORTALE ➔
              </div>
            </Link>

            {/* PORTAL 2: MAGAZZINO */}
            <Link 
              href="/magazzino"
              onMouseEnter={() => addHoverLog("Magazzino")}
              className="group relative bg-white border border-slate-200 hover:border-slate-350 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer rounded-2xl md:ml-12"
            >
              <div className="flex items-start gap-4">
                <div className="text-slate-300 text-3xl font-extrabold tracking-widest font-mono group-hover:text-slate-500 transition-colors">
                  02 //
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-wide group-hover:text-slate-950 transition-colors">
                    Magazzino Upload
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md font-sans">
                    Interfaccia mobile-first per magazzinieri. Caricamento foto ed esecuzione delle disposizioni con integrazione fotocamera.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2 font-bold group-hover:bg-slate-850 group-hover:text-white group-hover:border-slate-850 transition-all shadow-sm">
                APRI TELECAMERA ➔
              </div>
            </Link>

            {/* PORTAL 3: PREPOSTO */}
            <Link 
              href="/preposto"
              onMouseEnter={() => addHoverLog("Preposto")}
              className="group relative bg-white border border-slate-200 hover:border-slate-350 shadow-sm shadow-slate-100/40 hover:shadow-md transition-all duration-300 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer rounded-2xl md:mr-12"
            >
              <div className="flex items-start gap-4">
                <div className="text-slate-300 text-3xl font-extrabold tracking-widest font-mono group-hover:text-slate-500 transition-colors">
                  03 //
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-wide group-hover:text-slate-950 transition-colors">
                    Preposto Control Room
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md font-sans">
                    Log storico, statistiche di approvazione e registro di controllo attività svolte dai bot automatici.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 border border-slate-200 bg-slate-50 rounded-xl px-4 py-2 font-bold group-hover:bg-slate-850 group-hover:text-white group-hover:border-slate-850 transition-all shadow-sm">
                REGISTRO OPERATIVO ➔
              </div>
            </Link>

          </div>

          {/* TELEMETRY / LIVE LOGS */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 text-slate-100 p-6 rounded-2xl flex flex-col gap-6 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                SYSTEM TELEMETRY
              </span>
              <span className="text-[10px] text-slate-500 font-mono">LIVE FEED</span>
            </div>
            
            <div className="flex flex-col gap-3 font-mono text-[11px] min-h-[100px]">
              {activeLogs.map((log, index) => (
                <div key={index} className={`truncate ${index === 0 ? "text-emerald-400" : "text-slate-400"}`}>
                  {index === 0 ? "> " : "  "}{log}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>ACTIVE WEBHOOK:</span>
                <span className="text-slate-200 font-bold font-mono">/api/telegram/webhook</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>PHOTO STORAGE:</span>
                <span className="text-slate-200 font-bold">TELEGRAM ARCHIVE</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>DB PROVIDER:</span>
                <span className="text-slate-200 font-bold">SUPABASE CLOUD</span>
              </div>
            </div>

            <div className="bg-slate-850/60 border border-slate-800 p-4 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans">
              <strong>Nota Operativa:</strong> Le approvazioni in tempo reale richiedono l'abilitazione del Webhook. Assicurati che il bot Telegram sia stato avviato e le variabili d'ambiente inserite nel file <code>.env.local</code> siano valide.
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm z-10 px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-inner">
        <span className="text-[10px] text-slate-400 tracking-wider">
          LOGICHAT PLATFORM // © {new Date().getFullYear()} // TUTTI I DIRITTI RISERVATI
        </span>
        <div className="flex items-center gap-6 text-[10px] text-slate-450">
          <span className="hover:text-slate-800 transition-colors">SYS_STATUS: ACTIVE</span>
          <span>|</span>
          <span className="hover:text-slate-800 transition-colors">SECURITY: AES-256</span>
          <span>|</span>
          <span className="hover:text-slate-800 transition-colors">API PROXIES: ENABLED</span>
        </div>
      </footer>
    </div>
  );
}
