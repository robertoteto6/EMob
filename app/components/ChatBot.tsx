"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  sender: "user" | "bot";
  text: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim()) return;
    const question = input;
    setMessages((msgs) => [...msgs, { sender: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question }),
      });
      const data = await res.json();
      const text = data.text || "";
      setMessages((msgs) => [...msgs, { sender: "bot", text }]);
    } catch (e) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Error al obtener respuesta." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chatbot card p-4 mt-8 flex flex-col">
      <h2 className="text-lg font-semibold mb-2 text-center text-[var(--accent)]">
        Chatbot eSports
      </h2>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto mb-2 space-y-2 p-1"
        style={{ maxHeight: "300px" }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded text-sm max-w-full whitespace-pre-line ${
              m.sender === "user"
                ? "bg-[var(--accent)] text-black self-end"
                : "bg-[#2a2a2a]"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-gray-400">Pensando...</p>
        )}
      </div>
      <div className="flex">
        <input
          type="text"
          className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] p-2 rounded-l"
          placeholder="Haz una pregunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-[var(--accent)] text-black px-4 rounded-r"
          disabled={loading}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
