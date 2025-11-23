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

export const Chatbot: React.FC<ChatbotProps> = ({ inventory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: 'welcome', 
        role: 'assistant', 
        content: `Hello! I am your Inventory Assistant.<br/><br/>I can help you search for items, track usage, or export reports.<br/><b>Try asking:</b><br/>- "Show Inventory"<br/>- "Show Usage"<br/>- "Search [keyword]"`
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

  // --- Helper: Convert Data to CSV and Download ---
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

  // --- Logic: Search ---
  const runSearch = (term: string) => {
    const lowerTerm = term.toLowerCase();
    const results = inventory.filter(i => 
        i.itemCode.toLowerCase().includes(lowerTerm) ||
        i.description.toLowerCase().includes(lowerTerm) ||
        i.prNumber.toLowerCase().includes(lowerTerm) ||
        i.projectId.toLowerCase().includes(lowerTerm)
    );
    
    if (results.length === 0) {
        return `No items found matching "<b>${term}</b>".`;
    }
    
    let html = `<p class="mb-2">Found <b>${results.length}</b> items matching "<b>${term}</b>":</p>
      <div class="overflow-x-auto">
        <table class="min-w-full border border-gray-300 text-sm">
          <thead class="bg-blue-600 text-white">
            <tr><th class="p-2">Project</th><th class="p-2">Code</th><th class="p-2">Desc</th><th class="p-2">Bal</th></tr>
          </thead>
          <tbody>`;
          
    results.slice(0, 10).forEach(item => {
         const used = (item.usage || []).reduce((sum, u) => sum + u.quantity, 0);
         const balance = item.receivedQty - used;
         html += `<tr class="border-b"><td class="p-2">${item.projectId}</td><td class="p-2 font-bold">${item.itemCode}</td><td class="p-2 truncate max-w-[150px]">${item.description}</td><td class="p-2 font-bold">${balance}</td></tr>`;
    });
    
    html += `</tbody></table></div>`;
    if(results.length > 10) html += `<p class="text-xs text-gray-500 mt-1">...and ${results.length - 10} more.</p>`;
    return html;
  };

  // --- Logic: Generate Inventory Table ---
  const generateInventoryReport = () => {
      if (inventory.length === 0) return "Inventory is empty.";
      
      let html = `<p class="mb-2">Here is the current inventory summary:</p>
      <div class="overflow-x-auto max-h-60">
        <table class="min-w-full border border-gray-300 text-sm">
          <thead class="bg-gray-800 text-white sticky top-0">
            <tr><th class="p-2">Project</th><th class="p-2">Code</th><th class="p-2">Qty</th></tr>
          </thead>
          <tbody>`;
          
      inventory.slice(0, 15).forEach(item => {
           const used = (item.usage || []).reduce((sum, u) => sum + u.quantity, 0);
           const balance = item.receivedQty - used;
           html += `<tr class="border-b"><td class="p-2">${item.projectId}</td><td class="p-2">${item.itemCode}</td><td class="p-2">${balance} / ${item.receivedQty}</td></tr>`;
      });
      html += `</tbody></table></div>`;
      if(inventory.length > 15) html += `<p class="text-xs text-gray-500 mt-1">Showing first 15 items.</p>`;
      return html;
  };

  // --- Logic: Generate Usage Table ---
  const generateUsageReport = () => {
      const usageItems = inventory.filter(i => i.usage && i.usage.length > 0);
      if (usageItems.length === 0) return "No usage records found.";

      let html = `<p class="mb-2">Recent usage history:</p>
      <div class="overflow-x-auto max-h-60">
        <table class="min-w-full border border-gray-300 text-sm">
          <thead class="bg-green-700 text-white sticky top-0">
            <tr><th class="p-2">Date</th><th class="p-2">Item</th><th class="p-2">To</th><th class="p-2">Slip</th></tr>
          </thead>
          <tbody>`;
      
      usageItems.forEach(item => {
          item.usage?.forEach(u => {
              const dateStr = u.date ? new Date(u.date).toLocaleDateString() : '-';
              const slipBadge = u.issueSlipImage 
                ? `<span class="text-green-600 font-bold">Yes</span>` 
                : `<span class="text-gray-400">No</span>`;
              html += `<tr class="border-b"><td class="p-2 whitespace-nowrap">${dateStr}</td><td class="p-2">${item.itemCode}</td><td class="p-2">${u.issuedTo}</td><td class="p-2 text-center">${slipBadge}</td></tr>`;
          });
      });

      html += `</tbody></table></div>`;
      return html;
  };

  const sendMessage = async (text: string) => {
      if (!text.trim()) return;
      
      const userMessage: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: text
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      // Simulate network delay for better UX
      setTimeout(() => {
        let response = "";
        const lower = text.toLowerCase();

        // Search Logic
        if (awaitingSearchTerm) {
            response = runSearch(text);
            setAwaitingSearchTerm(false);
        } 
        // Command Processing
        else if (lower.includes('search')) {
            // Fallback if user types "search X" directly without clicking button
            const term = text.replace(/search/i, '').trim();
            if (term) {
                response = runSearch(term);
            } else {
                response = "Please enter a keyword to search (e.g., 'Search 200').";
            }
        }
        else if (lower.includes('inventory') || lower.includes('stock')) {
             if (lower.includes('export')) {
                 exportToCSV('inventory');
                 response = "✅ Inventory report exported to CSV.";
             } else {
                 response = generateInventoryReport();
             }
        } 
        else if (lower.includes('usage') || lower.includes('history')) {
             if (lower.includes('export')) {
                 exportToCSV('usage');
                 response = "✅ Usage report exported to CSV.";
             } else {
                 response = generateUsageReport();
             }
        }
        else {
            response = `I'm not sure how to help with that. Please try one of the quick actions below or type "Search [keyword]".`;
        }

        const botMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 600);
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
    { label: "Show Inventory", command: "Show Inventory" },
    { label: "Show Usage", command: "Show Usage" },
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
                  <p className="text-xs text-blue-200 font-medium">Automated System</p>
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
                      <span className="text-sm text-gray-500 font-semibold mr-2">Processing...</span>
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
                  placeholder={awaitingSearchTerm ? "Search by item code, description, or project..." : "Type your message..."}
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
