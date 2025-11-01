// FIX: This file was created to handle chat interactions with the various AI agents.
// It uses the Gemini Chat API to maintain conversational context and provides a streaming
// function for real-time responses in the UI.

import { GoogleGenAI, Chat } from "@google/genai";
import { Agent } from '../types.ts';

/**
 * Creates a system instruction prompt based on the agent's persona.
 * @param agent The agent for which to create the instruction.
 * @returns A string containing the system instruction.
 */
const getSystemInstruction = (agent: Agent): string => {
  return `Você é ${agent.name}. Seu propósito é ${agent.description}. Interaja com o usuário com base nessa persona. Seja prestativo e mantenha-se em seu papel. Fale em Português do Brasil.`;
};


/**
 * Creates a new chat session instance for a given agent.
 * @param agent The agent for the chat session.
 * @returns A Chat instance.
 */
export const createAgentChat = (agent: Agent): Chat => {
  // As per guidelines, create a new instance to ensure the latest API key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(agent),
    },
  });
  return chat;
};


/**
 * Sends a message to an agent and returns a streaming response.
 * @param chat The Chat instance to use for sending the message.
 * @param message The user's message text.
 * @returns An async iterable stream of GenerateContentResponse chunks.
 */
export const sendMessageToAgentStream = async (chat: Chat, message: string) => {
  try {
    const responseStream = await chat.sendMessageStream({ message });
    return responseStream;
  } catch (error) {
    console.error(`Error in sendMessageToAgentStream:`, error);
    throw new Error(`Failed to send message to agent.`);
  }
};
