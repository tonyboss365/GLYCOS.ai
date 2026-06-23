import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import PremiumButton from './PremiumButton';
import TexttypeReveal, { parseMarkdownToJSX } from './TexttypeReveal';

export const ClinicalChat = ({ inputs, riskScore, contributions }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Seed the initial welcome message when the report is loaded
  useEffect(() => {
    if (inputs && riskScore !== null) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I am the GLYCOS Clinical AI assistant. I have reviewed your metabolic profile, showing a metabolic susceptibility index of ${riskScore}%. Your primary driver is postprandial glucose level. You can ask me questions about what these parameters mean, how they relate to the calculated risk score, or what general clinical recommendations apply. How can I assist you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [inputs, riskScore]);

  // Scroll to bottom on new messages (avoiding auto-scroll on initial load)
  useEffect(() => {
    if (messages.length > 1 || isLoading) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    
    const userMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const token = import.meta.env.VITE_AZURE_API_KEY || '';
      if (!token) {
        throw new Error("GitHub API key is not configured in VITE_AZURE_API_KEY.");
      }

      // Build the contextual clinical prompt as system instructions
      const systemMessage = `You are the GLYCOS Clinical Metabolic Intelligence Assistant.
You are helping a clinician or patient interpret their metabolic prediction report.
Here is the current patient report data:
- Calculated susceptibility score: ${riskScore}%
- Biomarker Values:
  * Glucose: ${inputs.glucose} mg/dL (Normal ref: 70-140)
  * Body Mass Index (BMI): ${inputs.bmi} (Normal ref: 18.5-24.9)
  * Age: ${inputs.age} years
  * Diastolic Blood Pressure: ${inputs.bloodPressure} mmHg (Normal ref: 60-80)
  * Serum Insulin: ${inputs.insulin} uU/mL (Normal ref: 16-166)
  * Triceps Skin Fold Thickness: ${inputs.skinThickness} mm
  * Pregnancies: ${inputs.pregnancies}
  * Diabetes Pedigree Function: ${inputs.diabetesPedigree} (Normal ref: 0.08-2.42)

Biomarker Contribution Weights (from model coefficients):
${contributions ? contributions.map(c => `  * ${c.name}: ${c.value.toFixed(4)}`).join('\n') : 'No contribution weights available.'}

Guidelines:
1. Provide highly informative, clear, scientific responses regarding metabolic health.
2. Contextualize the answers based on the patient's specific biomarker values and calculated susceptibility index above.
3. Be professional and objective. Always clarify that your answers are educational interpretations and not a primary clinical diagnosis.
4. Keep paragraphs short and use lists where appropriate for legibility.`;

      const chatMessages = [
        { role: 'system', content: systemMessage }
      ];

      // Append past chat history
      messages.forEach(m => {
        chatMessages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        });
      });

      // Append the new user message
      chatMessages.push({
        role: 'user',
        content: userText
      });

      const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: chatMessages,
          model: 'gpt-4o-mini',
          temperature: 0.5,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`API fetch error, status code: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || 
        "I apologize, I received an empty response. Please try asking your question again.";

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error("Clinical AI Chatbot Error: ", err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Clinical assistant connection interrupted. Please check your network and make sure the VITE_AZURE_API_KEY environment variable is configured.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full border border-[var(--border-soft)] rounded-none bg-[var(--surface-1)] shadow-sm flex flex-col h-[480px]">
      {/* Widget Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-soft)]">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-[var(--accent)] animate-pulse" />
          <h3 className="font-syne font-bold text-sm uppercase tracking-wider text-[var(--text-1)]">
            Metabolic consultation desk
          </h3>
        </div>
        <span className="flex items-center gap-1 text-[9px] text-[var(--cyan-accent)] bg-[var(--surface-2)] border border-[var(--cyan-accent)]/20 px-2 py-0.5 rounded-none font-mono tracking-wider">
          <Sparkles size={9} />
          LIVE AI PROTOCOL
        </span>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[var(--surface-2)]/30">
        {messages.map((msg, idx) => {
          const isAi = msg.role === 'assistant';
          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${isAi ? 'self-start text-left' : 'self-end flex-row-reverse text-left'}`}
            >
              {/* Profile Icon */}
              <div className={`p-1.5 h-7 w-7 rounded-none flex items-center justify-center border ${
                isAi 
                  ? 'bg-[var(--surface-1)] border-[var(--border-soft)] text-[var(--text-1)]' 
                  : 'bg-[var(--text-1)] border-[var(--text-1)] text-[var(--void)]'
              }`}>
                {isAi ? <Bot size={14} /> : <User size={14} />}
              </div>

              {/* Speech bubble */}
              <div className="flex flex-col gap-1">
                <div className={`p-4 rounded-none border text-xs leading-relaxed ${
                  isAi
                    ? 'bg-[var(--surface-1)] border-[var(--border-soft)] text-[var(--text-1)]'
                    : 'bg-[var(--text-1)] border-[var(--text-1)] text-[var(--void)]'
                }`}>
                  {isAi ? (
                    idx === messages.length - 1 ? (
                      <TexttypeReveal text={msg.content} />
                    ) : (
                      <div className="font-inter text-xs leading-relaxed">{parseMarkdownToJSX(msg.content)}</div>
                    )
                  ) : (
                    <p className="whitespace-pre-line font-inter">{msg.content}</p>
                  )}
                </div>
                <span className={`font-mono text-[7px] text-[var(--text-4)] ${isAi ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] self-start text-left">
            <div className="p-1.5 h-7 w-7 rounded-none flex items-center justify-center border bg-[var(--surface-1)] border-[var(--border-soft)] text-[var(--text-1)]">
              <Bot size={14} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="p-4 rounded-none border bg-[var(--surface-1)] border-[var(--border-soft)] text-[var(--text-1)] flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)] animate-pulse">
                  Consulting model...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input controls */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border-soft)] flex gap-3 bg-[var(--surface-1)]">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about your metabolic report..."
          disabled={isLoading}
          className="flex-1 bg-transparent border border-[var(--border-soft)] px-4 py-2.5 text-xs font-inter text-[var(--text-1)] outline-none focus:border-[var(--cyan-accent)] transition-all duration-200"
        />
        <PremiumButton
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          variant="primary"
          className="px-5 py-2.5 h-full text-xs"
        >
          <Send size={12} />
        </PremiumButton>
      </form>
    </div>
  );
};

export default ClinicalChat;
