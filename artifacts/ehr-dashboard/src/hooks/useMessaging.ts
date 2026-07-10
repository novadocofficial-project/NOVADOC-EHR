import { useCallback, useEffect, useState } from "react";
import { SEED_MESSAGES, type ChatMessage } from "@/data/messagingSeed";

const STORAGE_KEY = "ehr-messaging-v1";
const CHANNEL_NAME = "ehr-messaging-v1";

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ChatMessage[];
  } catch {
    // ignore malformed storage
  }
  return SEED_MESSAGES;
}

function saveMessages(messages: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function useMessaging() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages());

  useEffect(() => {
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    const onMessage = () => setMessages(loadMessages());
    channel?.addEventListener("message", onMessage);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setMessages(loadMessages());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      channel?.removeEventListener("message", onMessage);
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const sendMessage = useCallback((contactId: string, text: string) => {
    setMessages(prev => {
      const next: ChatMessage[] = [
        ...prev,
        {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          contactId,
          sender: "me",
          text,
          timestamp: new Date().toISOString(),
        },
      ];
      saveMessages(next);
      try {
        new BroadcastChannel(CHANNEL_NAME).postMessage("update");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return { messages, sendMessage };
}
