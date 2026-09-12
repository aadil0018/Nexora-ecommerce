import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, ShoppingBag, CornerDownLeft, Loader2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import FormattedAIMessage from '../components/FormattedAIMessage';
import api from '../services/api';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I'm your AI Shopping Copilot. Tell me what you're looking for, your budget in ₹, or specific features you need (e.g. *'I need a laptop for programming under ₹60000'* or *'Wireless headphones with active noise cancellation under ₹10,000'*).",
      products: [],
      mode: 'ready',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const starterSuggestions = [
    'I need a laptop for programming under ₹60000',
    'Show me wireless headphones under ₹5000 with good battery life',
    'Best flagship smartphone for photography',
    'Smartwatch for fitness tracking and sleep monitoring',
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || inputPrompt).trim();
    if (!queryText || loading) return;

    const userMessageId = Date.now();
    const newUserMsg = {
      id: userMessageId,
      sender: 'user',
      text: queryText,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: queryText,
        history: messages.slice(-6).map((m) => ({
          sender: m.sender,
          text: m.text,
        })),
      });

      if (res.data.success) {
        const aiData = res.data.data;
        const newBotMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: aiData.reply,
          products: aiData.matchedProducts || [],
          criteria: aiData.extractedCriteria,
          mode: aiData.mode,
        };
        setMessages((prev) => [...prev, newBotMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `I encountered an issue searching our catalog: ${err.message}. Please try rephrasing your request!`,
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '24px 0 60px', maxWidth: '1000px' }}>
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--gradient-ai)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Bot size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
          AI Shopping Copilot
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Real-time catalog search grounded in our database. Ask questions with budgets, specs, or brands.
        </p>
      </div>

      {/* Chat Container */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '680px',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '14px',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: msg.sender === 'user' ? '80%' : '90%',
              }}
            >
              {/* Bot Avatar */}
              {msg.sender === 'assistant' && (
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={20} color="#fff" />
                </div>
              )}

              {/* Message Bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div
                  style={{
                    padding: msg.sender === 'user' ? '14px 18px' : '18px 22px',
                    borderRadius:
                      msg.sender === 'user'
                        ? '18px 18px 4px 18px'
                        : '18px 18px 18px 4px',
                    background:
                      msg.sender === 'user'
                        ? 'var(--primary)'
                        : 'var(--bg-surface-elevated)',
                    border:
                      msg.sender === 'user'
                        ? 'none'
                        : '1px solid var(--border-subtle)',
                    color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    boxShadow: 'var(--shadow-sm)',
                    overflowX: 'auto',
                  }}
                >
                  {msg.sender === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  ) : (
                    <FormattedAIMessage content={msg.text} />
                  )}
                </div>

                {/* Embedded Matched Products Grid */}
                {msg.products && msg.products.length > 0 && (
                  <div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '10px',
                      }}
                    >
                      Matched Products from Database ({msg.products.length}):
                    </span>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '14px',
                      }}
                    >
                      {msg.products.map((prod) => (
                        <ProductCard key={prod._id} product={prod} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {msg.sender === 'user' && (
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <User size={20} color="var(--primary)" />
                </div>
              )}
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div style={{ display: 'flex', gap: '14px', alignSelf: 'flex-start' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={20} color="#fff" />
              </div>
              <div
                style={{
                  padding: '14px 20px',
                  borderRadius: '18px 18px 18px 4px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                }}
              >
                <Loader2 size={16} color="var(--accent-cyan)" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Searching catalog and reasoning recommendations...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Starter suggestions bar */}
        <div
          style={{
            padding: '10px 20px',
            background: 'var(--bg-surface-elevated)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {starterSuggestions.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <input
              type="text"
              placeholder="Ask anything... (e.g. 'I need a laptop for programming under ₹60000')"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
              className="form-control"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '14px 20px',
                fontSize: '0.95rem',
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="btn btn-primary"
              style={{
                borderRadius: 'var(--radius-full)',
                width: '48px',
                height: '48px',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
