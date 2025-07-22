import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, DollarSign, Zap } from 'lucide-react';
import AIInsightsService, { type SpendingInsight } from '@/lib/ai-insights';
import type { Expense, Subscription, Goal } from '@/lib/types';

interface ChatbotMessage {
  role: string;
  content: string;
  insights?: SpendingInsight[];
  suggestions?: string[];
}

// Enhanced API call that includes financial insights
async function fetchGeminiResponseWithInsights(
  messages: ChatbotMessage[], 
  pageContext: string,
  expenses?: Expense[],
  subscriptions?: Subscription[],
  goals?: Goal[]
): Promise<{ response: string; insights?: SpendingInsight[]; suggestions?: string[] }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: messages.map(m => ({ role: m.role, content: m.content })), 
        pageContext,
        hasFinancialData: expenses && expenses.length > 0,
        requestInsights: true
      }),
    });
    if (!res.ok) return { response: "Sorry, I couldn't process your request." };
    const data = await res.json();
    
    // Generate AI insights if financial data is available
    let insights: SpendingInsight[] = [];
    let suggestions: string[] = [];
    
    if (expenses && expenses.length > 0) {
      // Check if user is asking about spending, savings, or budget
      const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || '';
      if (lastMessage.includes('spending') || lastMessage.includes('save') || lastMessage.includes('budget') || lastMessage.includes('money')) {
        insights = await AIInsightsService.generateSpendingInsights(expenses, subscriptions || [], goals);
        
        // Generate quick suggestions
        suggestions = [
          "Analyze my spending patterns",
          "Show me potential savings",
          "Check for spending anomalies",
          "Forecast next month's expenses"
        ];
      }
    }
    
    return { 
      response: data.response || "Sorry, I couldn't process your request.",
      insights: insights.slice(0, 3), // Top 3 insights
      suggestions
    };
  } catch (e) {
    return { response: "Sorry, there was a problem connecting to the assistant." };
  }
}

interface ChatbotWidgetProps {
  expenses?: Expense[];
  subscriptions?: Subscription[];
  goals?: Goal[];
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ expenses = [], subscriptions = [], goals = [] }) => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeInsights, setActiveInsights] = useState<SpendingInsight[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageContext = `Current page: ${pathname}`;

  useEffect(() => {
    if (open && showWelcome && messages.length === 0) {
      const welcomeMessage = expenses.length > 0 
        ? "👋 Welcome to MoneySimp! I can help you with spending insights, budget analysis, and financial tips. How can I assist you today? 💡"
        : "👋 Welcome to MoneySimp! How can I help you today? 💡";
      setMessages([{ role: "assistant", content: welcomeMessage }]);
      setShowWelcome(false);
    }
  }, [open, showWelcome, messages.length, expenses.length]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setAttachments([]);
    setLoading(true);
    
    try {
      const result = await fetchGeminiResponseWithInsights(newMessages, pageContext, expenses, subscriptions, goals);
      
      const assistantMessage: ChatbotMessage = {
        role: "assistant", 
        content: result.response,
        insights: result.insights,
        suggestions: result.suggestions
      };
      
      setMessages([...newMessages, assistantMessage]);
      
      // Update active insights for display
      if (result.insights && result.insights.length > 0) {
        setActiveInsights(result.insights);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInput(suggestion);
    const newMessages = [...messages, { role: "user", content: suggestion }];
    setMessages(newMessages);
    setLoading(true);
    
    try {
      let result;
      // Handle special insight requests
      if (suggestion.includes("spending patterns")) {
        const insights = await AIInsightsService.generateSpendingInsights(expenses, subscriptions, goals);
        result = {
          response: "Here's an analysis of your spending patterns:\n\n" + 
                   insights.map(i => `• ${i.title}: ${i.message}`).join('\n'),
          insights: insights.slice(0, 3)
        };
      } else if (suggestion.includes("potential savings")) {
        const tip = await AIInsightsService.generatePersonalizedTip(expenses, subscriptions, goals, 'cost_cutting');
        result = {
          response: `💰 **Money Saving Opportunity**\n\n${tip.tip}\n\n` + 
                   ('potentialSavings' in tip && tip.potentialSavings ? `**Potential Monthly Savings:** $${tip.potentialSavings}` : ''),
          suggestions: 'actionItems' in tip ? tip.actionItems : []
        };
      } else if (suggestion.includes("anomalies")) {
        const insights = await AIInsightsService.generateSpendingInsights(expenses, subscriptions, goals);
        const anomalies = insights.filter(i => i.type === 'anomaly');
        result = {
          response: anomalies.length > 0 
            ? "🚨 **Spending Anomalies Detected**\n\n" + anomalies.map(a => `• ${a.message}`).join('\n')
            : "✅ No unusual spending patterns detected. Your spending looks normal!",
          insights: anomalies
        };
      } else {
        result = await fetchGeminiResponseWithInsights(newMessages, pageContext, expenses, subscriptions, goals);
      }
      
      const assistantMessage: ChatbotMessage = {
        role: "assistant", 
        content: result.response,
        insights: result.insights,
        suggestions: result.suggestions
      };
      
      setMessages([...newMessages, assistantMessage]);
      
      if (result.insights && result.insights.length > 0) {
        setActiveInsights(result.insights);
      }
    } catch (error) {
      console.error('Suggestion handling error:', error);
      setMessages([...newMessages, { 
        role: "assistant", 
        content: "Sorry, I couldn't process that request. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
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
