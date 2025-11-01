import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import AgentDirectory from './components/AgentDirectory.tsx';
import ToolsDirectory from './components/ToolsDirectory.tsx';
import AgentRoom from './components/AgentRoom.tsx';
import GuidedMeditation from './components/GuidedMeditation.tsx';
import ContentAnalyzer from './components/ContentAnalyzer.tsx';
import GuidedPrayer from './components/GuidedPrayer.tsx';
import PrayerPills from './components/PrayerPills.tsx';
import DissonanceAnalyzer from './components/DissonanceAnalyzer.tsx';
import TherapeuticJournal from './components/TherapeuticJournal.tsx';
import QuantumSimulator from './components/QuantumSimulator.tsx';
import PhiFrontierRadar from './components/PhiFrontierRadar.tsx';
import DoshaDiagnosis from './components/DoshaDiagnosis.tsx';
import WellnessVisualizer from './components/WellnessVisualizer.tsx';
import BeliefResignifier from './components/BeliefResignifier.tsx';
import EmotionalSpendingMap from './components/EmotionalSpendingMap.tsx';
import RiskCalculator from './components/RiskCalculator.tsx';
import ArchetypeJourney from './components/ArchetypeJourney.tsx';
import VerbalFrequencyAnalysis from './components/VerbalFrequencyAnalysis.tsx';
import LiveConversation from './components/LiveConversation.tsx';
import { usePicOrchestrator } from './hooks/usePicOrchestrator.ts';
import { View, Session, AgentId, Message, ToolStates } from './types.ts';
import { AGENTS } from './constants.tsx';
import { createAgentChat, sendMessageToAgentStream } from './services/geminiService.ts';
import { createDoshaChat, startDoshaConversation, continueDoshaConversation } from './services/geminiDoshaService.ts';
import { Chat } from "@google/genai";


type ChatHistories = {
  [key in AgentId]?: Message[];
};

type ChatInstances = {
  [key in AgentId]?: Chat;
};


const App: React.FC = () => {
    const orchestrator = usePicOrchestrator();
    const [view, setView] = useState<View>('dashboard');
    const [session, setSession] = useState<Session | null>(null);
    
    // State for mentor chats
    const [chatHistories, setChatHistories] = useState<ChatHistories>({});
    const [chatInstances, setChatInstances] = useState<ChatInstances>({});
    
    // State for tools
    const [doshaChatInstance, setDoshaChatInstance] = useState<Chat | null>(null);
    const [toolStates, setToolStates] = useState<ToolStates>({});

    const [isLoadingMessage, setIsLoadingMessage] = useState(false);

    const handleSendMessage = useCallback(async (agentId: AgentId, messageText: string) => {
        const agent = AGENTS[agentId];
        if (!agent) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: messageText,
            timestamp: Date.now(),
        };

        setChatHistories(prev => ({
            ...prev,
            [agentId]: [...(prev[agentId] || []), userMessage],
        }));
        setIsLoadingMessage(true);
        
        let chat = chatInstances[agentId];
        if (!chat) {
            chat = createAgentChat(agent);
            setChatInstances(prev => ({ ...prev, [agentId]: chat }));
        }

        try {
            const responseStream = await sendMessageToAgentStream(chat, messageText);
            
            let agentResponseText = '';
            const agentMessageId = `agent-${Date.now()}`;
            
            setChatHistories(prev => {
                const currentHistory = prev[agentId] || [];
                const placeholder: Message = { id: agentMessageId, sender: 'agent', text: '', timestamp: Date.now() };
                return { ...prev, [agentId]: [...currentHistory, placeholder] };
            });

            for await (const chunk of responseStream) {
                agentResponseText += chunk.text;
                setChatHistories(prev => {
                    const currentHistory = prev[agentId] || [];
                    return {
                        ...prev,
                        [agentId]: currentHistory.map(msg => 
                            msg.id === agentMessageId ? { ...msg, text: agentResponseText } : msg
                        ),
                    };
                });
            }
        } catch (error) {
            console.error(error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                sender: 'agent',
                text: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
                timestamp: Date.now(),
            };
            setChatHistories(prev => ({
                ...prev,
                [agentId]: [...(prev[agentId] || []), errorMessage],
            }));
        } finally {
            setIsLoadingMessage(false);
            orchestrator.updateUserState(agentId);
        }
    }, [orchestrator, chatInstances]);

    const startDoshaDiagnosis = useCallback(async () => {
        setIsLoadingMessage(true);
        try {
            const chat = createDoshaChat();
            setDoshaChatInstance(chat);
            const firstQuestion = await startDoshaConversation(chat);
            const initialMessage: Message = {
                id: `agent-${Date.now()}`,
                sender: 'agent',
                text: firstQuestion,
                timestamp: Date.now(),
            };
            setToolStates(prev => ({
                ...prev,
                doshaDiagnosis: { messages: [initialMessage], isFinished: false, error: null }
            }));
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Falha ao iniciar o diagnóstico.';
            setToolStates(prev => ({ ...prev, doshaDiagnosis: { messages: [], isFinished: false, error } }));
        } finally {
            setIsLoadingMessage(false);
        }
    }, []);

    const handleDoshaSendMessage = useCallback(async (messageText: string) => {
        if (!doshaChatInstance) return;

        const userMessage: Message = { id: `user-${Date.now()}`, sender: 'user', text: messageText, timestamp: Date.now() };
        setToolStates(prev => ({
            ...prev,
            doshaDiagnosis: {
                ...prev.doshaDiagnosis!,
                messages: [...(prev.doshaDiagnosis?.messages || []), userMessage],
                error: null,
            }
        }));
        setIsLoadingMessage(true);

        try {
            const responseText = await continueDoshaConversation(doshaChatInstance, messageText);
            const agentMessage: Message = { id: `agent-${Date.now()}`, sender: 'agent', text: responseText, timestamp: Date.now() };
            const isFinished = responseText.startsWith("Obrigado por compartilhar.");
             setToolStates(prev => {
                const currentMessages = prev.doshaDiagnosis?.messages || [];
                return {
                    ...prev,
                    doshaDiagnosis: {
                        messages: [...currentMessages, agentMessage],
                        isFinished: isFinished,
                        error: null,
                    }
                };
            });
        } catch(err) {
             const error = err instanceof Error ? err.message : 'Ocorreu um erro ao processar sua resposta.';
             setToolStates(prev => ({
                ...prev,
                doshaDiagnosis: { ...prev.doshaDiagnosis!, error }
             }));
        } finally {
            setIsLoadingMessage(false);
        }
    }, [doshaChatInstance]);


    const handleStartSession = (newSession: Session) => {
        if (newSession.type === 'dosha_diagnosis' && !toolStates.doshaDiagnosis) {
            startDoshaDiagnosis();
        }
        setSession(newSession);
    };

    const handleExitSession = () => {
        setSession(null);
    };
    
    // Allow closing modal by clicking the backdrop
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleExitSession();
        }
    };

    const handleSwitchAgent = (agentId: AgentId) => {
        setSession({ type: 'agent', id: agentId });
    };

    const renderSession = () => {
        if (!session) return null;

        const getChatHistoryForTool = (agentIds: AgentId[]) => {
            return agentIds.reduce((acc: Message[], id) => [...acc, ...(chatHistories[id] || [])], []);
        }

        switch (session.type) {
            case 'agent':
                const agent = AGENTS[session.id];
                return <AgentRoom 
                    agent={agent} 
                    onExit={handleExitSession}
                    messages={chatHistories[agent.id] || []}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoadingMessage}
                    orchestrator={orchestrator}
                    onSwitchAgent={handleSwitchAgent}
                    onStartSession={handleStartSession}
                />;
            case 'meditation':
                return <GuidedMeditation onExit={handleExitSession} orchestrator={orchestrator} chatHistory={chatHistories[AgentId.COHERENCE]} />;
            case 'content_analyzer':
                return <ContentAnalyzer onExit={handleExitSession} chatHistory={getChatHistoryForTool([AgentId.COHERENCE, AgentId.SELF_KNOWLEDGE])} />;
            case 'guided_prayer':
                return <GuidedPrayer onExit={handleExitSession} orchestrator={orchestrator} chatHistory={chatHistories[AgentId.COHERENCE]} />;
            case 'prayer_pills':
                 return <PrayerPills onExit={handleExitSession} orchestrator={orchestrator} chatHistory={chatHistories[AgentId.COHERENCE]} />;
            case 'dissonance_analyzer':
                return <DissonanceAnalyzer onExit={handleExitSession} chatHistory={chatHistories[AgentId.COHERENCE] || []} />;
             case 'therapeutic_journal':
                return <TherapeuticJournal 
                    onExit={handleExitSession} 
                    journalState={toolStates.therapeuticJournal}
                    setJournalState={(newState) => setToolStates(prev => ({...prev, therapeuticJournal: newState}))}
                />;
            case 'quantum_simulator':
                return <QuantumSimulator onExit={handleExitSession} />;
            case 'phi_frontier_radar':
                return <PhiFrontierRadar onExit={handleExitSession} />;
            case 'archetype_journey':
                return <ArchetypeJourney onExit={handleExitSession} />;
            case 'verbal_frequency_analysis':
                return <VerbalFrequencyAnalysis onExit={handleExitSession} chatHistory={getChatHistoryForTool([AgentId.COHERENCE, AgentId.SELF_KNOWLEDGE])} />;
            case 'live_conversation':
                return <LiveConversation onExit={handleExitSession} />;
            case 'dosha_diagnosis':
                return <DoshaDiagnosis 
                    onExit={handleExitSession} 
                    messages={toolStates.doshaDiagnosis?.messages || []}
                    isFinished={toolStates.doshaDiagnosis?.isFinished || false}
                    error={toolStates.doshaDiagnosis?.error || null}
                    onSendMessage={handleDoshaSendMessage}
                    isLoading={isLoadingMessage}
                />;
            case 'wellness_visualizer':
                return <WellnessVisualizer onExit={handleExitSession} />;
            case 'belief_resignifier':
                // FIX: Corrected typo from EMOTional_FINANCE to EMOTIONAL_FINANCE.
                return <BeliefResignifier onExit={handleExitSession} chatHistory={chatHistories[AgentId.EMOTIONAL_FINANCE] || []} />;
            case 'emotional_spending_map':
                return <EmotionalSpendingMap onExit={handleExitSession} />;
            case 'risk_calculator':
                return <RiskCalculator onExit={handleExitSession} onSwitchAgent={handleSwitchAgent} />;
            default:
                return (
                    <div className="h-full w-full flex flex-col items-center justify-center glass-pane rounded-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold">Ferramenta em Construção</h2>
                        <p className="text-gray-400 mt-2">Esta funcionalidade estará disponível em breve.</p>
                        <button onClick={handleExitSession} className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full">Voltar</button>
                    </div>
                );
        }
    };
    
    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard orchestrator={orchestrator} onStartSession={handleStartSession} agents={AGENTS} />;
            case 'agents':
                return <AgentDirectory agents={AGENTS} onStartSession={handleStartSession} />;
            case 'tools':
                return <ToolsDirectory onStartSession={handleStartSession} />;
            default:
                return <Dashboard orchestrator={orchestrator} onStartSession={handleStartSession} agents={AGENTS} />;
        }
    };

    return (
        <div className="bg-gray-900 text-white font-sans flex min-h-screen">
            <Sidebar activeView={view} setView={setView} ucs={orchestrator.ucs} onStartSession={handleStartSession} />
            <main className="flex-1 p-4 relative">
                <div className="w-full h-full bg-black/20 rounded-2xl overflow-hidden">
                    {renderView()}
                </div>
                {session && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={handleBackdropClick}
                    >
                        <div 
                            className="glass-pane rounded-2xl w-full h-full md:w-11/12 md:h-[90vh] md:max-w-6xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing the modal
                        >
                            {renderSession()}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
