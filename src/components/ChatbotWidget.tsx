import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Real API call to your backend (e.g., /api/chat)
async function fetchGeminiResponse(messages: {role: string, content: string}[], pageContext: string): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, pageContext }),
    });
    if (!res.ok) return "Sorry, I couldn't process your request.";
    const data = await res.json();
    return data.response || "Sorry, I couldn't process your request.";
  } catch (e) {
    return "Sorry, there was a problem connecting to the assistant.";
  }
}

export const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageContext = `Current page: ${pathname}`;

  useEffect(() => {
    if (open && showWelcome && messages.length === 0) {
      setMessages([{ role: "assistant", content: "👋 Welcome to MoneySimp! How can I help you today? 💡" }]);
      setShowWelcome(false);
    }
  }, [open, showWelcome, messages.length]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    // TODO: send attachments to backend and include in context
    const response = await fetchGeminiResponse(newMessages, pageContext);
    setMessages([...newMessages, { role: "assistant", content: response }]);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  // Voice mode logic
  const handleVoice = async () => {
    if (!voiceMode) {
      setVoiceMode(true);
      return;
    }
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new window.MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("audio", audioBlob);
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.text) setInput(data.text);
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        alert("Microphone access denied or not supported.");
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const getWindowClasses = () => {
    if (maximized) return "fixed inset-4 z-50";
    if (minimized) return "fixed bottom-6 right-6 w-80 h-12 z-50";
    return "fixed bottom-6 right-6 w-96 max-w-[90vw] max-h-[80vh] z-50";
  };

  if (!open) {
    return (
      <button
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-2xl z-50"
        onClick={() => setOpen(true)}
        aria-label="Open chatbot"
      >
        💬
      </button>
    );
  }

  return (
    <div className={getWindowClasses()}>
      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-xl flex flex-col border border-gray-200 dark:border-gray-700 h-full">
        {/* Header with controls */}
        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700">
          <span className="font-semibold">💬 MoneySimp Chatbot</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleVoice}
              className={`p-1 rounded ${isRecording ? 'bg-red-500 text-white animate-pulse' : voiceMode ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-blue-500'}`}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              🎤
            </button>
            <button onClick={() => setMinimized(!minimized)} className="text-gray-500 hover:text-yellow-500" title="Minimize">➖</button>
            <button onClick={() => setMaximized(!maximized)} className="text-gray-500 hover:text-green-500" title={maximized ? "Restore" : "Maximize"}>{maximized ? "🗗" : "🗖"}</button>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-red-500 text-xl" title="Close">✕</button>
          </div>
        </div>
        {!minimized && <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  msg.role === "user" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-base font-bold my-2 pb-1 border-b border-gray-300 dark:border-gray-600">{children}</h1>,
                          h2: ({children}) => <h2 className="text-sm font-bold my-1.5 text-gray-800 dark:text-gray-200">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold my-1 text-gray-700 dark:text-gray-300">{children}</h3>,
                          p: ({children}) => <p className="my-1 leading-relaxed text-sm">{children}</p>,
                          ul: ({children}) => <ul className="list-disc ml-4 my-2 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal ml-4 my-2 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
                          code: ({children, className}) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-gray-200 dark:bg-gray-700 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-xs font-mono border">{children}</code>
                            ) : (
                              <code className={`block bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-xs font-mono overflow-x-auto border ${className}`}>{children}</code>
                            );
                          },
                          pre: ({children}) => <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 my-3 overflow-x-auto">{children}</pre>,
                          blockquote: ({children}) => (
                            <blockquote className="border-l-4 border-blue-400 pl-3 my-2 italic text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 py-2 rounded-r">
                              {children}
                            </blockquote>
                          ),
                          table: ({children}) => (
                            <div className="overflow-x-auto my-2">
                              <table className="border-collapse border border-gray-300 dark:border-gray-600 w-full text-xs">{children}</table>
                            </div>
                          ),
                          th: ({children}) => <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-100 dark:bg-gray-700 font-semibold text-left">{children}</th>,
                          td: ({children}) => <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{children}</td>,
                          a: ({children, href}) => (
                            <a href={href} className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 font-medium" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          hr: () => <hr className="border-gray-300 dark:border-gray-600 my-3" />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-sm">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start"><div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2"><div className="text-sm">🤔 Thinking...</div></div></div>
            )}
            <div ref={bottomRef} />
          </div>
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="border-t dark:border-gray-700 px-3 py-2">
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 text-xs flex items-center">
                    📎 {att.name}
                    <button onClick={() => handleRemoveAttachment(idx)} className="ml-2 text-red-500">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Input */}
          <div className="flex items-center border-t dark:border-gray-700 px-2 py-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt" className="hidden" title="Attach files" />
            <button onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-blue-500 p-1 mr-2" title="Attach Files">📎</button>
            {voiceMode && (
              <button onClick={() => setIsRecording(r => !r)} className={`p-1 mr-2 rounded ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-blue-500'}`} title={isRecording ? "Stop Recording" : "Start Recording"}>🎤</button>
            )}
            <input
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1 mr-2 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none"
              placeholder="Type your question... 💭"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              disabled={loading}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1 disabled:opacity-50"
              onClick={handleSend}
              disabled={loading || (!input.trim() && attachments.length === 0)}
            >
              📤
            </button>
          </div>
        </>}
      </div>
    </div>
  );
};
