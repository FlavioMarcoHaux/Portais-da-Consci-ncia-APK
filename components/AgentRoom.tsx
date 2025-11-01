import React, { useState, useRef, useEffect } from 'react';
import { AgentRoomProps } from '../types.ts';
import { AGENTS, toolMetadata } from '../constants.tsx';
import { X, Send } from 'lucide-react';

const AgentRoom: React.FC<AgentRoomProps> = ({
    agent,
    onExit,
    messages,
    onSendMessage,
    isLoading,
    orchestrator,
    onSwitchAgent,
    onStartSession
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(agent.id, input.trim());
            setInput('');
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    return (
        <div className="h-full w-full flex animate-fade-in">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
                    <div className="flex items-center gap-4">
                        <agent.icon className={`w-12 h-12 ${agent.themeColor}`} />
                        <div>
                            <h1 className="text-2xl font-bold">{agent.name}</h1>
                            <p className="text-sm text-gray-400">{agent.description}</p>
                        </div>
                    </div>
                    <button onClick={onExit} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </header>
                
                <main className="flex-1 overflow-y-scroll p-6 space-y-6">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.sender === 'agent' && <agent.icon className={`w-8 h-8 ${agent.themeColor} flex-shrink-0 mt-1`} />}
                            <div className={`max-w-xl px-4 py-3 rounded-2xl ${message.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">
                                    {message.text}
                                    {isLoading && message.id === messages[messages.length - 1].id && message.sender === 'agent' && (
                                        <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse" style={{ animationDuration: '1.2s' }}></span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 border-t border-gray-700/50">
                    <form onSubmit={handleSend} className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={`Converse com ${agent.name}...`}
                            disabled={isLoading}
                            className="w-full bg-gray-800/80 border border-gray-600 rounded-xl p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
                            rows={1}
                        />
                        <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 text-white p-2 rounded-full transition-colors">
                            <Send size={20} />
                        </button>
                    </form>
                </footer>
            </div>
            
            {/* Side Panel */}
            <aside className="w-80 border-l border-gray-700/50 flex flex-col p-4 bg-black/10">
                <div className="flex-1 overflow-y-auto min-h-0">
                    <h3 className="text-md font-semibold text-gray-300 mb-2">Ferramentas de {agent.name}</h3>
                    <div className="space-y-2">
                         {agent.tools && agent.tools.length > 0 ? (
                            agent.tools.map(toolId => {
                                const tool = toolMetadata[toolId];
                                if (!tool) return null;
                                return (
                                    <div 
                                        key={toolId} 
                                        onClick={() => onStartSession({ type: toolId as any })}
                                        className="p-3 bg-gray-800/70 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-700/90 transition-colors"
                                    >
                                        <tool.icon className={`w-6 h-6 ${agent.themeColor} flex-shrink-0`} />
                                        <div>
                                            <p className="font-semibold text-sm">{tool.title}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500 text-center p-4">Nenhuma ferramenta disponível para este mentor.</p>
                        )}
                    </div>
                </div>

                {onSwitchAgent && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <h3 className="text-md font-semibold text-gray-300 mb-2">Trocar Mentor</h3>
                        <div className="space-y-2">
                             {Object.values(AGENTS).filter(a => a.id !== agent.id).map(otherAgent => (
                                <div key={otherAgent.id} onClick={() => onSwitchAgent(otherAgent.id)} className="p-2 bg-gray-800/70 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-700/90 transition-colors">
                                    <otherAgent.icon className={`w-6 h-6 ${otherAgent.themeColor} flex-shrink-0`} />
                                    <p className="font-semibold text-sm">{otherAgent.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </aside>
        </div>
    );
};

export default AgentRoom;