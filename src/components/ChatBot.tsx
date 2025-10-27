import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  text: 'Hi! I\'m your MyGig-Economy assistant. I can help you with:\n\n• Understanding SARS tax requirements\n• Recording income and expenses\n• Creating invoices\n• Tracking deductions\n• Tax planning advice\n\nWhat would you like help with today?',
  sender: 'bot',
  timestamp: new Date()
};

const QUICK_RESPONSES: { [key: string]: string } = {
  'record income': 'To record income, go to the Income tab and click "Add Income". You\'ll need to enter the amount, date, source, and category. Remember to keep all receipts and invoices for SARS!',
  'add expense': 'To add an expense, go to the Expenses tab and click "Add Expense". Make sure to categorize it correctly as SARS has specific deduction rules. Upload a receipt if you have one!',
  'create invoice': 'To create an invoice, go to the Invoices tab and click "Create Invoice". Fill in your client details, line items, and the system will generate a SARS-compliant invoice for you.',
  'tax deductions': 'SARS allows several deductions for gig workers:\n\n• Home office expenses (max 17% of home costs)\n• Internet & phone (business portion)\n• Vehicle expenses (business km only)\n• Professional development\n• Equipment & software\n\nTrack everything in the Expenses section!',
  'provisional tax': 'As a self-employed person, you may need to register for provisional tax if your income exceeds R30,000 per year. Check the Tax Insights tab for your requirements and deadlines.',
  'tax brackets': 'South African tax brackets for 2024/25:\n\n• R0 - R237,100: 18% of taxable income\n• R237,101 - R370,500: R42,678 + 26%\n• R370,501 - R512,800: R77,362 + 31%\n• R512,801 - R673,000: R121,475 + 36%\n• R673,001 - R857,900: R179,147 + 39%\n• R857,901+: R251,258 + 41%\n\nCheck Tax Insights for your estimated liability!',
  'help': 'I can assist with:\n\n1. Recording income & expenses\n2. Creating invoices\n3. Understanding tax deductions\n4. Provisional tax information\n5. SARS compliance tips\n6. Using platform features\n\nWhat would you like to know more about?'
};

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    for (const [key, response] of Object.entries(QUICK_RESPONSES)) {
      if (lowerMessage.includes(key) || lowerMessage.includes(key.replace(' ', ''))) {
        return response;
      }
    }

    if (lowerMessage.includes('income')) {
      return QUICK_RESPONSES['record income'];
    }
    if (lowerMessage.includes('expense') || lowerMessage.includes('deduction')) {
      return QUICK_RESPONSES['add expense'];
    }
    if (lowerMessage.includes('invoice')) {
      return QUICK_RESPONSES['create invoice'];
    }
    if (lowerMessage.includes('tax') || lowerMessage.includes('sars')) {
      return QUICK_RESPONSES['provisional tax'];
    }

    return 'I\'m here to help! You can ask me about:\n\n• Recording income & expenses\n• Creating invoices\n• Tax deductions & compliance\n• Platform features\n\nTry asking something like "How do I record income?" or "What are tax deductions?"';
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: findBestResponse(inputText),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 z-50"
          aria-label="Open chat assistant"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-semibold">MyGig Assistant</h3>
                <p className="text-xs text-blue-100">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
