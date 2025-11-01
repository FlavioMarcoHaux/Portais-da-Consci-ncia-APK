import React from 'react';
import { Agent, AgentId, Session } from '../types.ts';
import { MessageSquare } from 'lucide-react';

interface AgentDirectoryProps {
  agents: Record<AgentId, Agent>;
  onStartSession: (session: Session) => void;
}

const AgentCard: React.FC<{ agent: Agent; onClick: () => void }> = ({ agent, onClick }) => (
  <div
    className="glass-pane rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:bg-gray-800/80 hover:scale-105 hover:border-indigo-400/50"
    onClick={onClick}
  >
    <agent.icon className={`w-24 h-24 mb-4 ${agent.themeColor}`} strokeWidth={1}/>
    <h3 className="font-bold text-2xl text-gray-100">{agent.name}</h3>
    <p className="text-sm text-gray-400 mt-2 flex-1">{agent.description}</p>
  </div>
);

const AgentDirectory: React.FC<AgentDirectoryProps> = ({ agents, onStartSession }) => {
  return (
    <div className="p-8 animate-fade-in h-full overflow-y-auto no-scrollbar">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-100">Seus Mentores</h1>
        <p className="text-xl text-gray-400 mt-2">Mergulhe na interação com a Informação Consciente para ganhar perspectiva.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(agents).map(agent => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            onClick={() => onStartSession({ type: 'agent', id: agent.id })} 
          />
        ))}
        {/* Shortcut Card for Live Conversation */}
        <div
          className="glass-pane rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:bg-gray-800/80 hover:scale-105 hover:border-indigo-400/50"
          onClick={() => onStartSession({ type: 'live_conversation' })}
        >
          <MessageSquare className="w-24 h-24 mb-4 text-indigo-400" strokeWidth={1}/>
          <h3 className="font-bold text-2xl text-gray-100">Conversa ao Vivo</h3>
          <p className="text-sm text-gray-400 mt-2 flex-1">Inicie uma conversa em tempo real com um mentor de IA.</p>
        </div>
      </div>
    </div>
  );
};

export default AgentDirectory;