import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api';

const SUGGESTIONS = [
    'Who is likely to win?',
    'Which match has the closest odds?',
    'Which match is most predictable?',
    'Give me a summary of all matches.',
];

/**
 * Parses and renders Gemini markdown output as structured React elements.
 * Eliminates the react-markdown dependency in favour of a lightweight, crash-safe
 * custom renderer that handles bold syntax and unordered list conversion.
 */
function formatAIText(text) {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];

    function flushList() {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`}>
                    {listItems.map((item, i) => <li key={i}>{applyBold(item)}</li>)}
                </ul>
            );
            listItems = [];
        }
    }

    function applyBold(line) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );
    }

    lines.forEach((line, i) => {
        const bulletMatch = line.match(/^[\*\-]\s+(.*)/);
        if (bulletMatch) {
            listItems.push(bulletMatch[1]);
        } else {
            flushList();
            const trimmed = line.trim();
            if (trimmed) {
                elements.push(<p key={i}>{applyBold(trimmed)}</p>);
            }
        }
    });

    flushList();
    return elements;
}

function Agent() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hi! I am your Sports AI Agent. Ask me anything about the current matches and I will analyze the odds data for you.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function sendMessage(question) {
        const userQuestion = question || input.trim();
        if (!userQuestion) return;

        setMessages(prev => [...prev, { role: 'user', text: userQuestion }]);
        setInput('');
        setLoading(true);

        const data = await apiPost('/agent/query', { userQuestion });

        setLoading(false);
        setMessages(prev => [...prev, {
            role: 'ai',
            text: data.answer || 'Sorry, I could not process that request.'
        }]);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') sendMessage();
    }

    return (
        <div className="container">
            <h1 className="page-title">AI Agent</h1>
            <p className="page-subtitle">Ask questions about matches and odds — powered by Gemini</p>

            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-bubble ${msg.role}`}>
                            {msg.role === 'ai'
                                ? <div className="markdown-content">{formatAIText(msg.text)}</div>
                                : msg.text
                            }
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-bubble ai">⏳ Analyzing match data...</div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="suggestions">
                    {SUGGESTIONS.map((s, i) => (
                        <button
                            key={i}
                            className="suggestion-chip"
                            onClick={() => sendMessage(s)}
                            disabled={loading}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <div className="chat-input-row">
                    <input
                        type="text"
                        placeholder="Ask about matches, odds, predictions..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button
                        className="chat-send-btn"
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Agent;
