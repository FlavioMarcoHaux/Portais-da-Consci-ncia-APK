
import { useState, useEffect, useCallback } from 'react';
// FIX: Added .ts extension to the import path.
import { UserStateVector, AgentId } from '../types.ts';

const INITIAL_USV: UserStateVector = {
  spiritual: 70,
  emotional: 45, // Higher is worse
  physical: 60,
  financial: 30,
};

// Calculates the "User Coherence Score" (UCS) as a proxy for Φ.
// We define coherence as low variance between states.
// A perfect score of 100 means all states are at 100 (except emotional at 0).
const calculateUCS = (usv: UserStateVector): number => {
  const values = [
    usv.spiritual / 100,
    (100 - usv.emotional) / 100, // Invert emotional score
    usv.physical / 100,
    usv.financial / 100,
  ];

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  
  // Coherence is inversely proportional to variance.
  const coherence = 1 - Math.sqrt(variance); // sqrt to make it less sensitive

  // Overall score is a mix of average state and coherence.
  const averageState = mean;
  
  return Math.round((averageState * 0.6 + coherence * 0.4) * 100);
};

// Principle of Conscious Action (PAC): Find the most dissonant state and recommend an agent.
const getRecommendation = (usv: UserStateVector): AgentId | null => {
    const states: { name: keyof UserStateVector, value: number, agent: AgentId }[] = [
        { name: 'spiritual', value: usv.spiritual, agent: AgentId.COHERENCE },
        { name: 'emotional', value: 100 - usv.emotional, agent: AgentId.EMOTIONAL_FINANCE }, // a higher emotional score (e.g. 80) means more dissonance, so we want to target it
        { name: 'physical', value: usv.physical, agent: AgentId.HEALTH },
        { name: 'financial', value: usv.financial, agent: AgentId.INVESTMENTS },
    ];

    // Find the state with the lowest value (or highest dissonance for emotional)
    const lowestState = states.sort((a, b) => a.value - b.value)[0];

    // Simple logic: if a state is below a threshold, recommend an agent
    if(lowestState.value < 50) {
        // Special case: If finance is low but emotional is also low (high dissonance), recommend emotional finance first
        if (lowestState.agent === AgentId.INVESTMENTS && usv.emotional > 50) {
            return AgentId.EMOTIONAL_FINANCE;
        }
        return lowestState.agent;
    }

    return null;
};


export const usePicOrchestrator = () => {
  const [usv, setUsv] = useState<UserStateVector>(INITIAL_USV);
  const [ucs, setUcs] = useState<number>(0);
  const [recommendation, setRecommendation] = useState<AgentId | null>(null);

  useEffect(() => {
    const newUcs = calculateUCS(usv);
    const newRecommendation = getRecommendation(usv);
    setUcs(newUcs);
    setRecommendation(newRecommendation);
  }, [usv]);

  // This function simulates the positive effect of an agent interaction
  const updateUserState = useCallback((agentId: AgentId) => {
    setUsv(prevUsv => {
        const newUsv = {...prevUsv};
        const improvement = 10 + Math.floor(Math.random() * 15); // Random improvement between 10 and 25

        switch(agentId) {
            case AgentId.COHERENCE:
                newUsv.spiritual = Math.min(100, newUsv.spiritual + improvement);
                newUsv.emotional = Math.max(0, newUsv.emotional - Math.floor(improvement/2)); // Coherence also calms
                break;
            case AgentId.HEALTH:
                newUsv.physical = Math.min(100, newUsv.physical + improvement);
                break;
            case AgentId.EMOTIONAL_FINANCE:
                newUsv.emotional = Math.max(0, newUsv.emotional - improvement);
                break;
            case AgentId.INVESTMENTS:
                 newUsv.financial = Math.min(100, newUsv.financial + improvement);
                 break;
            case AgentId.SELF_KNOWLEDGE:
                // Interacting with meta-agent improves all states slightly by increasing awareness
                newUsv.spiritual = Math.min(100, newUsv.spiritual + 5);
                newUsv.emotional = Math.max(0, newUsv.emotional - 5);
                newUsv.physical = Math.min(100, newUsv.physical + 5);
                newUsv.financial = Math.min(100, newUsv.financial + 5);
                break;
        }
        return newUsv;
    });
  }, []);

  return { usv, ucs, recommendation, updateUserState };
};