
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT_TEMPLATE } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  initChat(knowledge: string) {
    this.chat = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_PROMPT_TEMPLATE(knowledge),
        temperature: 0.7,
      },
    });
  }

  async *sendMessageStream(text: string) {
    if (!this.chat) {
      throw new Error("Chat not initialized");
    }

    try {
      const result = await this.chat.sendMessageStream({ message: text });
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      console.error("Gemini Streaming Error:", error);
      yield "I'm sorry, I encountered an error. Please reach us at +212 600 00 00 00.";
    }
  }
}
