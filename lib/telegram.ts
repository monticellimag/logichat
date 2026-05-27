const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn("⚠️ Warning: TELEGRAM_BOT_TOKEN is not defined in environment variables.");
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

/**
 * Client nativo e super leggero per interagire con le Telegram Bot API
 * Ottimizzato per l'ambiente Next.js Serverless (zero dipendenze esterne, massima velocità)
 */
export const telegramClient = {
  /**
   * Invia un messaggio di testo a un chat_id specifico
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    replyMarkup?: InlineKeyboardMarkup
  ) {
    const url = `${BASE_URL}/sendMessage`;
    const body: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    };

    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram sendMessage failed: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  },

  /**
   * Invia una foto a un chat_id specifico. Supporta sia un file_id esistente sia un caricamento diretto (Buffer)
   */
  async sendPhoto(
    chatId: string | number,
    photo: string | Buffer,
    caption?: string,
    replyMarkup?: InlineKeyboardMarkup
  ) {
    const url = `${BASE_URL}/sendPhoto`;

    if (typeof photo === "string") {
      // Se photo è una stringa (es. file_id o URL), inviamo un normale JSON
      const body: Record<string, any> = {
        chat_id: chatId,
        photo,
        parse_mode: "Markdown",
      };

      if (caption) body.caption = caption;
      if (replyMarkup) body.reply_markup = replyMarkup;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram sendPhoto (file_id) failed: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } else {
      // Se photo è un Buffer (es. caricamento da magazzino), usiamo multipart/form-data
      const formData = new FormData();
      formData.append("chat_id", String(chatId));
      
      const blob = new Blob([photo], { type: "image/jpeg" });
      formData.append("photo", blob, "photo.jpg");

      if (caption) formData.append("caption", caption);
      if (replyMarkup) formData.append("reply_markup", JSON.stringify(replyMarkup));
      formData.append("parse_mode", "Markdown");

      const response = await fetch(url, {
        method: "POST",
        body: formData, // FormData imposta automaticamente l'header corretto per multipart
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram sendPhoto (binary) failed: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    }
  },

  /**
   * Risponde a una Callback Query proveniente dal click su un bottone inline
   */
  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false) {
    const url = `${BASE_URL}/answerCallbackQuery`;
    const body: Record<string, any> = {
      callback_query_id: callbackQueryId,
    };

    if (text) {
      body.text = text;
      body.show_alert = showAlert;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram answerCallbackQuery failed: ${errorText}`);
    }

    return response.json();
  },

  /**
   * Modifica il testo (e i bottoni) di un messaggio esistente (utile per mostrare "Approvato da..." sul bottone cliccato)
   */
  async editMessageText(
    chatId: string | number,
    messageId: number,
    text: string,
    replyMarkup?: InlineKeyboardMarkup
  ) {
    const url = `${BASE_URL}/editMessageText`;
    const body: Record<string, any> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "Markdown",
    };

    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram editMessageText failed: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  },

  /**
   * Recupera i dettagli di un file (tra cui l'url di download) partendo dal suo file_id
   */
  async getFile(fileId: string) {
    const url = `${BASE_URL}/getFile?file_id=${fileId}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram getFile failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.ok || !data.result) {
      throw new Error(`Telegram getFile returned invalid data: ${JSON.stringify(data)}`);
    }

    const filePath = data.result.file_path;
    const fileDownloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    return {
      file_path: filePath,
      download_url: fileDownloadUrl,
    };
  },
};
