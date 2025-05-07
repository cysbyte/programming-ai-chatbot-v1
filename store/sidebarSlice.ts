import { createSlice } from '@reduxjs/toolkit';

interface SidebarState {
  isOpen: boolean;
  isOpenForConversation: boolean;
}

const initialState: SidebarState = {
  isOpen: true,
  isOpenForConversation: false,
};

export const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    toggleSidebarForConversation: (state) => {
      state.isOpenForConversation = !state.isOpenForConversation;
    },
  },
});

export const { toggleSidebar, toggleSidebarForConversation } = sidebarSlice.actions;
export default sidebarSlice.reducer; 