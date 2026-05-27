export interface Disposizione {
  id: string;
  created_at: string;
  codice: string;
  descrizione: string;
  stato: "in_attesa" | "approvato" | "rifiutato";
  approvato_da?: string;
  decisione_data?: string;
}

export interface FotoMagazzino {
  id: string;
  created_at: string;
  descrizione: string;
  telegram_file_id: string;
  stato: "in_attesa" | "approvato" | "rifiutato";
  decisione_da?: string;
  decisione_data?: string;
  disposizione_id?: string;
  disposizione?: Disposizione;
}
