'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCache } from '../lib/cache';
import { apiCache } from '../lib/cache';
import { debounce } from '../lib/utils';
import { Spinner } from './LoadingOptimized';
import { useAppStore } from '../store';
import { useAutoHideOnScroll } from '../hooks/useAutoHideOnScroll';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'quick-reply' | 'suggestion';
}

interface QuickReply {
  id: string;
  text: string;
  action: string;
}

const QUICK_REPLIES: QuickReply[] = [
  { id: '1', text: '🏆 Próximos partidos', action: 'upcoming_matches' },
  { id: '2', text: '📊 Estadísticas', action: 'stats' },
  { id: '3', text: '👥 Equipos populares', action: 'popular_teams' },
  { id: '4', text: '🎮 Juegos disponibles', action: 'available_games' }
];

const TYPING_DELAY = 1000;
const MAX_MESSAGES = 50; // Limitar mensajes para rendimiento

const ChatBot: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const setChatOpen = useAppStore(state => state.setChatOpen);
  const chatOpenInStore = useAppStore(state => state.chatOpen);
  const autoHideFab = useAutoHideOnScroll({ idleDelay: 200, showAtTop: true });
  const shouldShowFab = isOpen || autoHideFab;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente de esports. ¿En qué puedo ayudarte?',
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { get: getCached, set: setCached } = useCache(apiCache);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Enfocar input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Mantener estado global sincronizado para evitar solapamientos con otros botones
  const lastSyncedOpenRef = useRef(isOpen);

  useEffect(() => {
    if (lastSyncedOpenRef.current === isOpen && chatOpenInStore === isOpen) {
      return;
    }

    lastSyncedOpenRef.current = isOpen;
    setChatOpen(isOpen);
  }, [isOpen, chatOpenInStore, setChatOpen]);

  // Debounced typing indicator
  const debouncedTyping = useCallback(
    debounce(() => setIsTyping(false), TYPING_DELAY),
    []
  );

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    setMessages(prev => {
      const updated = [...prev, newMessage];
      // Mantener solo los últimos MAX_MESSAGES mensajes
      return updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
    });
  }, []);

  const handleQuickReply = useCallback(async (action: string, text: string) => {
    addMessage({ text, isUser: true, type: 'quick-reply' });
    setShowQuickReplies(false);
    setIsTyping(true);

    // Simular respuesta basada en la acción
    setTimeout(() => {
      let response = '';
      switch (action) {
        case 'upcoming_matches':
          response = 'Aquí tienes los próximos partidos más importantes. Puedes ver más detalles en la sección de partidos.';
          break;
        case 'stats':
          response = 'Las estadísticas están disponibles para equipos y jugadores. ¿Qué estadísticas te interesan más?';
          break;
        case 'popular_teams':
          response = 'Los equipos más populares incluyen Team Liquid, Fnatic, G2 Esports y muchos más. ¿Quieres información sobre algún equipo específico?';
          break;
        case 'available_games':
          response = 'Cubrimos League of Legends, Dota 2, CS:GO, Valorant, Overwatch y más juegos. ¿Cuál te interesa?';
          break;
        default:
          response = 'Gracias por tu consulta. ¿Hay algo más en lo que pueda ayudarte?';
      }
      
      addMessage({ text: response, isUser: false, type: 'text' });
      setIsTyping(false);
    }, 1500);
  }, [addMessage]);

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isTyping) return;

    const messageText = inputValue.trim();
    addMessage({ text: messageText, isUser: true, type: 'text' });
    setInputValue('');
    setIsTyping(true);
    setShowQuickReplies(false);

    try {
      // Verificar cache primero
      const cacheKey = `chat_${messageText.toLowerCase()}`;
      const cachedResponse = getCached(cacheKey);
      
      if (cachedResponse) {
        addMessage({ text: cachedResponse, isUser: false, type: 'text' });
        setIsTyping(false);
        return;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: messageText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botResponse = data.text || data.response || 'Lo siento, no pude procesar tu mensaje.';
      
      // Cachear respuesta
      setCached(cacheKey, botResponse, 10 * 60 * 1000); // 10 minutos
      
      addMessage({ text: botResponse, isUser: false, type: 'text' });
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({ 
        text: 'Lo siento, hubo un error. Inténtalo de nuevo.', 
        isUser: false, 
        type: 'text' 
      });
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, addMessage, getCached, setCached]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Mostrar indicador de escritura
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      debouncedTyping();
    }
  }, [isTyping, debouncedTyping]);

  // Componente de mensaje optimizado
  const MessageComponent = memo<{ message: Message }>(({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl text-sm break-words ${
          message.isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
        }`}
      >
        {message.text}
        <div className={`text-xs mt-1 opacity-70 ${
          message.isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  ));

  return (
    <>
      {/* Botón flotante del chat */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 sm:right-6 bottom-[calc(1rem+var(--safe-area-inset-bottom))] sm:bottom-[calc(1.5rem+var(--safe-area-inset-bottom))] z-50 w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          shouldShowFab ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Ventana del chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed right-4 sm:right-6 bottom-[calc(4.5rem+var(--safe-area-inset-bottom))] sm:bottom-[calc(6rem+var(--safe-area-inset-bottom))] z-40 w-[calc(100vw-2rem)] max-w-sm sm:w-96 h-[70vh] sm:h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Asistente EMob</h3>
                    <p className="text-xs text-blue-100">Siempre disponible</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 text-white/80 hover:text-white transition-colors"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <MessageComponent key={message.id} message={message} />
                ))}
              </AnimatePresence>
              
              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-2xl rounded-bl-md flex items-center space-x-2">
                    <Spinner size="sm" color="secondary" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Escribiendo...</span>
                  </div>
                </motion.div>
              )}
              
              {/* Quick replies */}
              {showQuickReplies && messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Respuestas rápidas:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply.id}
                        onClick={() => handleQuickReply(reply.action, reply.text)}
                        className="p-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        {reply.text}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu mensaje..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '100px' }}
                    disabled={isTyping}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center disabled:cursor-not-allowed"
                >
                  {isTyping ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

ChatBot.displayName = 'ChatBot';

export default ChatBot;
