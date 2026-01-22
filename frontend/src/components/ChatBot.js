/**
 * Health Buddy AI Chatbot Component
 * A floating chat popup for AI-powered health assistance
 * Includes Text-to-Speech for accessibility
 */

import { useState, useRef, useEffect } from 'react';
import { apiUrl } from '../config/api';
import {
    FiMessageCircle, FiX, FiTrash2, FiSend, FiAlertTriangle, FiVolume2, FiVolumeX
} from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [speakingIndex, setSpeakingIndex] = useState(null);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Text-to-Speech function
    const speakMessage = (text, index) => {
        if (!window.speechSynthesis) return;

        // Stop any ongoing speech
        window.speechSynthesis.cancel();

        if (speakingIndex === index) {
            setSpeakingIndex(null);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.lang = 'en-US';

        utterance.onstart = () => setSpeakingIndex(index);
        utterance.onend = () => setSpeakingIndex(null);
        utterance.onerror = () => setSpeakingIndex(null);

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setSpeakingIndex(null);
    };


    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Get welcome message when chat opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            fetchWelcomeMessage();
        }
    }, [isOpen]);

    const fetchWelcomeMessage = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(apiUrl('/chat/welcome'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMessages([{
                    role: 'assistant',
                    content: data.welcome_message
                }]);
                setSuggestions(data.suggestions || []);
            }
        } catch (error) {
            console.error('Failed to fetch welcome message:', error);
            setMessages([{
                role: 'assistant',
                content: "Hi! I'm Health Buddy, your AI health assistant. How can I help you today?"
            }]);
        }
    };

    const sendMessage = async (messageText) => {
        if (!messageText.trim() || isLoading) return;

        const token = localStorage.getItem('token');
        if (!token) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Please log in to use the chat feature."
            }]);
            return;
        }

        // Add user message
        const userMessage = { role: 'user', content: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setSuggestions([]);

        try {
            // Build conversation history for context
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await fetch(apiUrl('/chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: messageText,
                    conversation_history: conversationHistory
                })
            });

            if (response.ok) {
                const data = await response.json();

                // Add assistant response
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.response
                }]);

                // Update suggestions
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(inputValue);
    };

    const handleSuggestionClick = (suggestion) => {
        sendMessage(suggestion);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    };

    const toggleChat = () => {
        setIsOpen(prev => !prev);
    };

    const clearChat = () => {
        setMessages([]);
        fetchWelcomeMessage();
    };

    return (
        <div className="chatbot-container">
            {/* Chat Popup */}
            {isOpen && (
                <div className="chatbot-popup">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar"><RiRobot2Line /></div>
                            <div>
                                <h3>Health Buddy</h3>
                                <span className="chatbot-status">
                                    <span className="status-dot"></span>
                                    Online
                                </span>
                            </div>
                        </div>
                        <div className="chatbot-header-actions">
                            <button
                                className="chatbot-action-btn"
                                onClick={clearChat}
                                title="Clear chat"
                            >
                                <FiTrash2 />
                            </button>
                            <button
                                className="chatbot-close-btn"
                                onClick={toggleChat}
                                title="Close chat"
                            >
                                <FiX />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`chatbot-message ${msg.role}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="message-avatar"><RiRobot2Line /></div>
                                )}
                                <div className="message-bubble">
                                    <p>{msg.content}</p>
                                    {msg.role === 'assistant' && (
                                        <button
                                            className={`message-speak-btn ${speakingIndex === index ? 'speaking' : ''}`}
                                            onClick={() => speakMessage(msg.content, index)}
                                            title={speakingIndex === index ? "Stop" : "Listen"}
                                        >
                                            {speakingIndex === index ? <FiVolumeX /> : <FiVolume2 />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}


                        {isLoading && (
                            <div className="chatbot-message assistant">
                                <div className="message-avatar"><RiRobot2Line /></div>
                                <div className="message-bubble loading">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions */}
                    {suggestions.length > 0 && !isLoading && (
                        <div className="chatbot-suggestions">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    className="suggestion-chip"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <form className="chatbot-input-form" onSubmit={handleSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything about your health..."
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="send-btn"
                        >
                            <FiSend />
                        </button>
                    </form>

                    {/* Disclaimer */}
                    <div className="chatbot-disclaimer">
                        <FiAlertTriangle style={{ marginRight: '4px' }} />
                        AI assistant - Not medical advice
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                className={`chatbot-fab ${isOpen ? 'active' : ''}`}
                onClick={toggleChat}
                aria-label="Open chat"
            >
                {isOpen ? (
                    <span className="fab-icon"><FiX /></span>
                ) : (
                    <>
                        <span className="fab-icon"><FiMessageCircle /></span>
                        <span className="fab-pulse"></span>
                    </>
                )}
            </button>
        </div>
    );
};

export default ChatBot;
