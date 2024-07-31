import { doc, getDoc, updateDoc } from "@firebase/firestore";
import { create } from "zustand";
import { db } from "./firebase";
import { useSoldierStore } from "./store";

export const useChatStore = create((set) => ({
    chatId: null,
    user: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,
    unreadCounts: {},

    changeChat: async (chatId, user) => {
        const currentUser = useSoldierStore.getState().currentUser;

        if (user.blocked.includes(currentUser.id)) {
            return set({
                chatId,
                user: null,
                isCurrentUserBlocked: true,
                isReceiverBlocked: false,
            });
        } else if (currentUser.blocked.includes(user.id)) {
            return set({
                chatId,
                user: user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: true,
            });
        }

        // Reset unreadCount in Firestore when chat is selected
        const chatDocRef = doc(db, "chats", currentUser.id);
        const chatDocSnap = await getDoc(chatDocRef);

        if (chatDocSnap.exists()) {
            const chats = chatDocSnap.data().chats.map(chat => {
                if (chat.chatId === chatId) {
                    return { ...chat, unreadCount: 0, isSeen: true };
                }
                return chat;
            });

            await updateDoc(chatDocRef, { chats });

            const unreadCounts = chats.reduce((acc, chat) => {
                acc[chat.chatId] = chat.unreadCount;
                return acc;
            }, {});

            set({
                chatId,
                user: user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: false,
                unreadCounts,
            });
        }
    },

    updateUnreadCount: async (chatId, count) => {
        const currentUser = useSoldierStore.getState().currentUser;
        const chatDocRef = doc(db, "chats", currentUser.id);
        const chatDocSnap = await getDoc(chatDocRef);

        if (chatDocSnap.exists()) {
            const chats = chatDocSnap.data().chats.map(chat => {
                if (chat.chatId === chatId) {
                    return { ...chat, unreadCount: count };
                }
                return chat;
            });

            await updateDoc(chatDocRef, { chats });

            set((state) => ({
                unreadCounts: {
                    ...state.unreadCounts,
                    [chatId]: count,
                },
            }));
        }
    },

    changeBlock: () => {
        set((state) => ({
            ...state,
            isReceiverBlocked: !state.isReceiverBlocked,
        }));
    },
}));

export default useChatStore;
