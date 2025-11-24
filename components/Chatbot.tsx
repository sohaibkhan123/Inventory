import React, { useState, useRef, useEffect } from 'react';
import { ChatIcon, XIcon } from './Icons';
import type { InventoryItem, UsageEntry } from '../types';

interface ChatbotProps {
  inventory: InventoryItem[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ inventory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: 'welcome', 
        role: 'assistant', 
        content: `Hello! I am your Advanced Inventory Search Assistant.<br/><br/>Type any keyword (e.g., <b>"200"</b>, <b>"Beam"</b>, <b>"John"</b>) and I will find all related items, PRs, and usage records for you instantly.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      csvContent += "Project ID,PR Number,Item Code,Description,Weight,PR Qty,Required Qty,Received Qty,Remaining Qty\n";
      inventory.forEach(item => {
        const used = (item.usage?.reduce((sum, u) => sum + u.quantity, 0) || 0);
        const rem = item.receivedQty - used;
        const row = [
            item.projectId,
            item.prNumber,
            `"${item.itemCode}"`,
            `"${item.description}"`,
            item.weight,
            item.prQty,
            item.requiredQty,
            item.receivedQty,
            rem
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

  const performAdvancedSearch = (query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    
    // 1. Search Items
    const itemMatches = inventory.filter(item => 
        item.itemCode.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.prNumber.toLowerCase().includes(lowerQuery) ||
        item.projectId.toLowerCase().includes(lowerQuery) ||
        String(item.weight).includes(lowerQuery)
    );

    // 2. Search Usage
    const usageMatches: {item: InventoryItem, entry: UsageEntry}[] = [];
    inventory.forEach(item => {
        if (item.usage) {
            item.usage.forEach(u => {
                if (
                    u.projectId.toLowerCase().includes(lowerQuery) ||
                    u.issuedTo.toLowerCase().includes(lowerQuery) ||
                    (u.date && u.date.includes(lowerQuery))
                ) {
                    usageMatches.push({ item, entry: u });
                }
            });
        }
    });

    // Build Response HTML
    let responseHtml = '';

    if (itemMatches.length === 0 && usageMatches.length === 0) {
        responseHtml = `I couldn't find anything matching "<b>${query}</b>". Try a different keyword like a project ID, item code, or name.`;
    } else {
        responseHtml += `<p class="mb-2">Found <b>${itemMatches.length + usageMatches.length}</b> results for "<b>${query}</b>":</p>`;

        if (itemMatches.length > 0) {
            responseHtml += `<div class="mb-4">
                <h4 class="font-bold text-blue-800 mb-1">📦 Inventory Items (${itemMatches.length})</h4>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="min-w-full text-sm bg-white">
                        <thead class="bg-blue-100 text-blue-900">
                            <tr>
                                <th class="p-2 text-left">Project</th>
                                <th class="p-2 text-left">Item</th>
                                <th class="p-2 text-left">PR #</th>
                                <th class="p-2 text-right">Rem Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemMatches.slice(0, 10).map(item => {
                                const used = (item.usage || []).reduce((sum, u) => sum + u.quantity, 0);
                                const rem = item.receivedQty - used;
                                return `
                                    <tr class="border-t hover:bg-gray-50">
                                        <td class="p-2 border-r">${item.projectId}</td>
                                        <td class="p-2 border-r font-medium">${item.itemCode}<br/><span class="text-xs text-gray-500">${item.description}</span></td>
                                        <td class="p-2 border-r text-xs">${item.prNumber}</td>
                                        <td class="p-2 text-right font-bold ${rem < 5 ? 'text-red-600' : 'text-green-600'}">${rem}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    ${itemMatches.length > 10 ? `<p class="text-xs text-gray-500 p-1 text-center">...and ${itemMatches.length - 10} more items.</p>` : ''}
                </div>
            </div>`;
        }

        if (usageMatches.length > 0) {
            responseHtml += `<div class="mb-2">
                <h4 class="font-bold text-purple-800 mb-1">📋 Usage Records (${usageMatches.length})</h4>
                <div class="overflow-x-auto border rounded-lg">
                    <table class="min-w-full text-sm bg-white">
                        <thead class="bg-purple-100 text-purple-900">
                            <tr>
                                <th class="p-2 text-left">Item</th>
                                <th class="p-2 text-left">Used In</th>
                                <th class="p-2 text-left">Issued To</th>
                                <th class="p-2 text-right">Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usageMatches.slice(0, 10).map(({item, entry}) => `
                                <tr class="border-t hover:bg-gray-50">
                                    <td class="p-2 border-r font-medium">${item.itemCode}</td>
                                    <td class="p-2 border-r">${entry.projectId}</td>
                                    <td class="p-2 border-r">${entry.issuedTo}</td>
                                    <td class="p-2 text-right">${entry.quantity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${usageMatches.length > 10 ? `<p class="text-xs text-gray-500 p-1 text-center">...and ${usageMatches.length - 10} more records.</p>` : ''}
                </div>
            </div>`;
        }
    }

    return responseHtml;
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
      setIsSearching(true);

      // Simulate "thinking" delay
      setTimeout(() => {
          let resultHtml = '';
          const lowerText = text.toLowerCase().trim();

          // Command Handling
          if (lowerText.includes('export inventory')) {
             exportToCSV('inventory');
             resultHtml = "✅ Inventory report exported to CSV.";
          } else if (lowerText.includes('export usage')) {
             exportToCSV('usage');
             resultHtml = "✅ Usage report exported to CSV.";
          } else if (lowerText === 'help') {
             resultHtml = "Try typing a <b>Project ID</b>, <b>Item Code</b>, or <b>Person's Name</b> to search.";
          } else {
             // Perform Advanced Search
             resultHtml = performAdvancedSearch(text);
          }

          setMessages(prev => [...prev, { 
              id: crypto.randomUUID(), 
              role: 'assistant', 
              content: resultHtml 
          }]);
          setIsSearching(false);
      }, 400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (command: string) => {
    sendMessage(command);
  };

  const quickActions = [
    { label: "Export Inventory", command: "Export Inventory" },
    { label: "Export Usage", command: "Export Usage" },
    { label: "Help", command: "Help" },
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
                  <h3 className="font-bold text-xl tracking-tight">Smart Search</h3>
                  <p className="text-xs text-blue-200 font-medium">Advanced Inventory Query System</p>
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
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[95%] sm:max-w-[85%] rounded-2xl p-5 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none shadow-md text-lg'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none w-full shadow-sm'
                    }`}
                  >
                      {msg.role === 'assistant' ? (
                        <div 
                          className="prose prose-sm max-w-none text-gray-800"
                          dangerouslySetInnerHTML={{ __html: msg.content }} 
                        />
                      ) : (
                        <span>{msg.content}</span>
                      )}
                  </div>
                </div>
              ))}
              {isSearching && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center space-x-2">
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 pt-2 pb-4 sm:pb-6 shrink-0 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] flex flex-col gap-2">
             <div className="max-w-4xl mx-auto w-full px-4 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {quickActions.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.command)}
                        disabled={isSearching}
                        className="whitespace-nowrap px-4 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-xs font-medium hover:bg-gray-100 hover:border-gray-300 transition-all"
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto w-full px-4 sm:px-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search by Project, PR, Item, or User..."
                  className="w-full border-0 bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:bg-white rounded-full py-3 pl-5 pr-12 shadow-inner transition-all focus:ring-blue-500"
                  disabled={isSearching}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSearching || !input.trim()}
                  className={`absolute right-2 p-2 rounded-full transition-colors shadow-sm ${
                    input.trim() && !isSearching 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Search Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110 z-40 group focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Open Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
          </span>
        </button>
      )}
    </>
  );
};
