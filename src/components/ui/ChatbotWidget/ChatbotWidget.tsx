import React, { useState, useRef } from "react";
import { usePathname } from "next/navigation";

// Replace this with your actual Genkit/Gemini API call
async function fetchGeminiResponse(messages: {role: string, content: string}[], pageContext: string): Promise<string> {
  // TODO: Replace with real API call
  // For now, simulate context-aware polite redirect
  const last = messages[messages.length-1]?.content?.toLowerCase() || "";
  if (last.includes("weather") || last.includes("sports") || last.includes("politics")) {
    return "I'm here to help with questions about this website. Please ask something related to your finances or the current page.";
  }
  // Simulate a helpful answer
  return `This is a context-aware answer for: \"${last}\" (Page: ${pageContext})`;
}

export const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const pageContext = `Current page: ${pathname}`;

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const response = await fetchGeminiResponse(newMessages, pageContext);
    setMessages([...newMessages, { role: "assistant", content: response }]);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-80 bg-white dark:bg-gray-900 shadow-2xl rounded-xl flex flex-col border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
            <span className="font-semibold">💬 MoneySimp Chatbot</span>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-red-500 text-xl">×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: 320 }}>
            {messages.length === 0 && (
              <div className="text-gray-400 text-sm">Ask me anything about this page or your finances!</div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
                <div className={msg.role === "user" ? "inline-block bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-blue-100 rounded-lg px-3 py-1 my-1" : "inline-block bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1 my-1"}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center border-t dark:border-gray-700 px-2 py-2">
            <input
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1 mr-2 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              disabled={loading}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1 disabled:opacity-50"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-2xl"
          onClick={() => setOpen(true)}
          aria-label="Open chatbot"
        >
          💬
        </button>
      )}
    </div>
  );
};
