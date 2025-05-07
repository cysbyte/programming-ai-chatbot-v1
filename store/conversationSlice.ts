import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Message } from '@/lib/ai-service';

interface ConversationState {
  images: string[];
  userInput: string;
  conversationId: string;
  round: number;
  prompts: Message[];
  isProcessing: boolean;
}

const initialState: ConversationState = {
  images: [],
  userInput: "",
  conversationId: "",
  round: 0,
  prompts: [],
  isProcessing: false,
};

export const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    addImage: (state, action: PayloadAction<string>) => {
      if (state.images.length < 3) {
        state.images.push(action.payload);
      }
    },
    removeImage: (state, action: PayloadAction<number>) => {
      state.images.splice(action.payload, 1);
    },
    clearImages: (state) => {
      state.images = [];
    },
    setUserInput: (state, action: PayloadAction<string>) => {
      state.userInput = action.payload;
    },
    setConversationId: (state, action: PayloadAction<string>) => {
      state.conversationId = action.payload;
    },
    setRound: (state, action: PayloadAction<number>) => {
      state.round = action.payload;
    },
    setPrompts: (state, action: PayloadAction<Message[]>) => {
      state.prompts = action.payload;
    },
    setIsProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
  },
});

export const { addImage, removeImage, clearImages, setUserInput, setConversationId, setRound, setPrompts, setIsProcessing } = conversationSlice.actions;
export default conversationSlice.reducer; 