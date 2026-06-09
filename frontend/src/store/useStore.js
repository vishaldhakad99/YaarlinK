import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => set({
        user, accessToken, refreshToken, isAuthenticated: true
      }),
      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        localStorage.removeItem('yaarlink-store');
      },

      // Theme
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
      },

      // Discover
      discoverUsers: [],
      currentCardIndex: 0,
      discoverMode: 'ai',
      setDiscoverUsers: (users) => set({ discoverUsers: users, currentCardIndex: 0 }),
      nextCard: () => set(state => ({ currentCardIndex: state.currentCardIndex + 1 })),

      // Matches
      matches: [],
      setMatches: (matches) => set({ matches }),
      addMatch: (match) => set(state => ({ matches: [match, ...state.matches] })),

      // Messages
      activeChat: null,
      messages: {},
      setActiveChat: (chat) => set({ activeChat: chat }),
      setMessages: (matchId, msgs) => set(state => ({
        messages: { ...state.messages, [matchId]: msgs }
      })),
      addMessage: (matchId, msg) => set(state => ({
        messages: {
          ...state.messages,
          [matchId]: [...(state.messages[matchId] || []), msg]
        }
      })),

      // Notifications
      notifications: [],
      unreadCount: 0,
      addNotification: (n) => set(state => ({
        notifications: [n, ...state.notifications],
        unreadCount: state.unreadCount + 1
      })),
      clearUnread: () => set({ unreadCount: 0 }),

      // Vibe
      setVibe: async (vibe) => {
        try {
          await api.patch('/auth/vibe', { vibe });
          set(state => ({ user: { ...state.user, currentVibe: vibe } }));
        } catch (e) { console.error(e); }
      },
      setMood: async (mood) => {
        try {
          await api.patch('/auth/mood', { mood });
          set(state => ({ user: { ...state.user, currentMood: mood } }));
        } catch (e) { console.error(e); }
      },

      // Communities
      communities: [],
      setCommunities: (c) => set({ communities: c }),

      // Events
      events: [],
      setEvents: (e) => set({ events: e }),

      // Loading
      globalLoading: false,
      setGlobalLoading: (v) => set({ globalLoading: v }),
    }),
    {
      name: 'yaarlink-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
      })
    }
  )
);

export default useStore;
