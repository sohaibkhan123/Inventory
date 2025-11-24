import React, { useState, useRef, useEffect } from 'react';
import { ChatIcon, XIcon } from './Icons';
import type { InventoryItem } from '../types';

interface ChatbotProps {
  inventory: InventoryItem[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

declare global {
  interface Window {
    puter: any;
  }
}

export const Chatbot: React.FC<ChatbotProps> = ({ inventory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: 'welcome', 
        role: 'assistant', 
        content: `Hello! I am your AI Inventory Assistant powered by Puter.<br/><br/>I have access to your live inventory data. Ask me anything!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingSearchTerm, setAwaitingSearchTerm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // --- Export Helper ---
  const exportToCSV = (category: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = "report.csv";

    if (category === 'usage') {
      filename = "Usage_Report.csv";
      csvContent += "Date,Project,Item Code,Description,Issued To,Quantity Used,Issue Slip Available\n";
      inventory.forEach(item => {
        if (item.usage) {
            item.usage.forEach(u => {
                const row = [
                    u.date ? new Date(u.date).toISOString().split('T')[0] : '',
                    u.projectId,
                    `"${item.itemCode}"`,
                    `"${item.description}"`,
                    `"${u.issuedTo || ''}"`,
                    u.quantity,
                    u.issueSlipImage ? "Yes" : "No"
                ].join(",");
                csvContent += row + "\n";
            });
        }
      });
    } else {
      filename = "Inventory_Report.csv";
      csvContent += "Project ID,PR Number,Item Code,Description,Weight,PR Qty,Required Qty,Received Qty,Balance Qty\n";
      inventory.forEach(item => {
        const balance = item.receivedQty - (item.usage?.reduce((sum, u) => sum + u.quantity, 0) || 0);
        const row = [
            item.projectId,
            item.prNumber,
            `"${item.itemCode}"`,
            `"${item.description}"`,
            item.weight,
            item.prQty,
            item.requiredQty,
            item.receivedQty,
            balance
        ].join(",");
        csvContent += row + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return filename;
  };

  const sendMessage = async (text: string) => {
      if (!text.trim()) return;
      
      // 1. Add User Message
      const userMessage: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: text
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      // 2. Prepare AI Context
      try {
        if (!window.puter || !window.puter.ai) {
             throw new Error("Puter.js not loaded or AI unavailable. Please refresh.");
        }

        // Check for Local Search Override (to keep it fast if user explicitly uses the Search UI)
        if (awaitingSearchTerm) {
            setAwaitingSearchTerm(false);
            // We pass this intention to the AI
        }

        // Compress inventory data for the AI context (save tokens)
        const inventoryContext = inventory.map(i => {
            const used = (i.usage || []).reduce((a,b)=>a+b.quantity,0);
            const bal = i.receivedQty - used;
            return `[${i.projectId}] ${i.itemCode} (${i.description}): Rec:${i.receivedQty}, Bal:${bal}, Loc:${i.prNumber}`;
        }).join('\n');

        const usageContext = inventory.flatMap(i => 
            (i.usage||[]).map(u => 
                `Usage: ${i.itemCode} used in ${u.projectId} by ${u.issuedTo} on ${u.date.split('T')[0]} (Qty: ${u.quantity}) ${u.issueSlipImage ? '[Slip:Yes]' : '[Slip:No]'}`
            )
        ).join('\n');

        const systemMessage = {
            role: 'system',
            content: `You are an intelligent Steel Inventory Assistant.
            
            DATA CONTEXT:
            --- INVENTORY ---
            ${inventoryContext.slice(0, 15000)} ${inventoryContext.length > 15000 ? '...(truncated)' : ''}
            
            --- USAGE HISTORY ---
            ${usageContext.slice(0, 10000)} ${usageContext.length > 10000 ? '...(truncated)' : ''}
            
            RULES:
            1. Use the data above to answer questions accurately.
            2. If the user asks for a LIST or TABLE, generate HTML tables using Tailwind classes (e.g., <table class="min-w-full border border-gray-300">). Use <th class="bg-blue-600 text-white p-2">.
            3. If the user explicitly asks to EXPORT data, reply ONLY with "[[EXPORT:INVENTORY]]" or "[[EXPORT:USAGE]]".
            4. Be concise and helpful.
            5. If asked about "IR" or "Issue Slip", refer to the [Slip:Yes/No] data.
            `
        };

        const chatHistory = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
        }));

        // 3. Call Puter AI
        // Fixed: Using window.puter.ai.chat(messages, options) instead of chatCompletion
        const response = await window.puter.ai.chat(
            [systemMessage, ...chatHistory, { role: 'user', content: text }],
            { model: 'gpt-4o-mini' }
        );

        const aiText = response?.message?.content || response?.toString() || "I couldn't generate a response. Please try again.";

        // 4. Handle Special Actions
        if (aiText.includes('[[EXPORT:INVENTORY]]')) {
            exportToCSV('inventory');
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "✅ Inventory report exported to CSV." }]);
        } else if (aiText.includes('[[EXPORT:USAGE]]')) {
            exportToCSV('usage');
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "✅ Usage report exported to CSV." }]);
        } else {
            setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: aiText }]);
        }

      } catch (err: any) {
          console.error(err);
          setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Error: ${err.message || "Failed to connect to AI."}` }]);
      } finally {
          setIsLoading(false);
      }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action: any) => {
      if (action.label === 'Search') {
          setAwaitingSearchTerm(true);
          setTimeout(() => {
              if (inputRef.current) inputRef.current.focus();
          }, 50);
      } else {
          sendMessage(action.command);
      }
  };

  const quickActions = [
    { label: "Show Inventory", command: "Show Inventory Table" },
    { label: "Show Usage", command: "Show Usage History Table" },
    { label: "Search", command: "Search" },
    { label: "Export Inventory", command: "Export Inventory" },
    { label: "Export Usage", command: "Export Usage" },
  ];

  return (
    <>
      {/* Full Screen Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-100 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 shadow-lg flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/30">
                  <ChatIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl tracking-tight">Inventory Assistant</h3>
                  <p className="text-xs text-blue-200 font-medium">Powered by Puter.ai</p>
                </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-white/20 p-2 rounded-full transition-colors text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close Chat"
            >
              <XIcon className="w-8 h-8" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-gray-50">
            <div className="max-w-6xl mx-auto w-full space-y-8">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.content && (
                      <div
                        className={`max-w-[95%] sm:max-w-[85%] rounded-2xl p-6 shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none w-full shadow-sm'
                        }`}
                      >
                          {msg.role === 'assistant' ? (
                            <div 
                              className="prose prose-lg max-w-none overflow-x-auto text-gray-900 prose-headings:text-blue-900 prose-strong:text-blue-800 prose-table:shadow-sm prose-th:bg-blue-600 prose-th:text-white prose-td:border-gray-200 prose-td:p-2"
                              dangerouslySetInnerHTML={{ __html: msg.content || '' }} 
                            />
                          ) : (
                            <span className="text-lg">{msg.content}</span>
                          )}
                      </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-5 shadow-sm">
                    <div className="flex space-x-2 items-center">
                      <span className="text-sm text-gray-500 font-semibold mr-2">Thinking...</span>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Actions & Input Area */}
          <div className={`bg-white border-t border-gray-200 pt-2 pb-4 sm:pb-6 shrink-0 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] flex flex-col gap-2 ${awaitingSearchTerm ? 'border-t-4 border-blue-500' : ''}`}>
            
            {!awaitingSearchTerm && (
                <div className="max-w-6xl mx-auto w-full px-4 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => handleQuickAction(action)}
                            disabled={isLoading}
                            className="whitespace-nowrap px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-medium hover:bg-blue-100 hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="max-w-6xl mx-auto w-full px-4 sm:px-0">
              <div className="relative flex items-center">
                 {awaitingSearchTerm && (
                     <div className="absolute left-3 z-10 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                     </div>
                 )}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={awaitingSearchTerm ? "Search by item code, description, or project..." : "Ask me anything about your inventory..."}
                  className={`w-full border-0 bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:bg-white rounded-full py-3 shadow-inner transition-all ${awaitingSearchTerm ? 'pl-10 pr-12 ring-2 ring-blue-500' : 'pl-4 pr-12 focus:ring-blue-500'}`}
                  disabled={isLoading}
                />
                {awaitingSearchTerm && (
                     <button
                        type="button"
                        onClick={() => { setAwaitingSearchTerm(false); setInput(''); }}
                        className="absolute right-14 p-1 text-gray-400 hover:text-gray-600"
                     >
                        <span className="text-xs font-bold uppercase border border-gray-300 rounded px-1">ESC</span>
                     </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={`absolute right-2 p-2 rounded-full transition-colors shadow-sm ${
                    input.trim() && !isLoading 
                        ? awaitingSearchTerm ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {awaitingSearchTerm ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                  ) : (
                      <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110 z-40 group focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Open Assistant"
        >
          <ChatIcon className="w-8 h-8" />
          <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        </button>
      )}
    </>
  );
};
