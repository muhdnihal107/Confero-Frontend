import {create }from 'zustand';
import { Message, ChatGroup } from '../api/chat';

interface ChatState {
  currentGroup: ChatGroup | null;
  messages: Message[];
  setCurrentGroup: (group: ChatGroup) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  connectWebSocket: (groupId: string, token: string) => void;
  disconnectWebSocket: () => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  let ws: WebSocket | null = null;

  return {
    currentGroup: null,
    messages: [],
    setCurrentGroup: (group) => set({ currentGroup: group }),
    addMessage: (message) => {
      set((state) => {
        // Avoid duplicates
        if (state.messages.some((msg) => msg.id === message.id)) {
          return state;
        }
        // Only add if message belongs to current group
        if (state.currentGroup?.id === message.chat_group) {
          return { messages: [...state.messages, message] };
        }
        return state;
      });
    },
    setMessages: (messages) => set({ messages }),
    clearMessages: () => set({ messages: [] }),
    connectWebSocket: (groupId, token) => {
      if (ws) ws.close();
      ws = new WebSocket(`ws://localhost:8002/ws/chats/${groupId}/?token=${token}`);
      ws.onopen = () => console.log('WebSocket connected');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id && data.chat_group) {
            get().addMessage({
              ...data,
              created_at: new Date(data.created_at).toISOString(),
              read_by: data.read_by || [],
            });
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };
      ws.onerror = (error) => console.error('WebSocket error:', error);
      ws.onclose = () => console.log('WebSocket disconnected');
    },
    disconnectWebSocket: () => {
      if (ws) {
        ws.close();
        ws = null;
      }
    },
  };
});