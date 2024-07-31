import { useEffect, useState } from 'react';
import '../styles/chatlist.css';
import AddUser from './AddUser';
import { useSoldierStore } from '../configs/store';
import { doc, getDoc, onSnapshot, updateDoc, setDoc, serverTimestamp, arrayUnion, collection } from '@firebase/firestore';
import { db } from '../configs/firebase';
import useChatStore from '../configs/chatstore';

const ChatList = () => {
    const [plus, setPlus] = useState(false);
    const [chats, setChats] = useState([]);
    const [input, setInput] = useState("");

    const { currentUser } = useSoldierStore();
    const { changeChat, updateUnreadCount } = useChatStore();

    useEffect(() => {
        if (!currentUser) return;

        const unSub = onSnapshot(doc(db, "chats", currentUser.id), async (res) => {
            const items = res.data().chats;

            const promises = items.map(async (item) => {
                const userDocRef = doc(db, 'soldiers', item.receiverId);
                const userDocSnap = await getDoc(userDocRef);

                const user = userDocSnap.data();

                return { ...item, user };
            });

            const chatData = await Promise.all(promises);

            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        });

        return () => {
            unSub();
        };
    }, [currentUser]);

    const handleSelect = async (chat) => {
        const chatIndex = chats.findIndex((item) => item.chatId === chat.chatId);

        if (chatIndex !== -1) {
            const updatedChats = [...chats];
            updatedChats[chatIndex] = {
                ...updatedChats[chatIndex],
                isSeen: true,
                unreadCount: 0, // Reset unread count on select
            };

            const userChatsRef = doc(db, "chats", currentUser.id);

            try {
                await updateDoc(userChatsRef, {
                    chats: updatedChats.map(({ user, ...rest }) => rest), // Remove user field
                });

                // Update the unread count in the store
                updateUnreadCount(chat.chatId, 0);

                // Update the local state
                setChats(updatedChats);

                changeChat(chat.chatId, chat.user);
            } catch (err) {
                console.log(err);
            }
        }
    };

    const handleRemove = async (chat) => {
        const updatedChats = chats.filter((item) => item.chatId !== chat.chatId);

        const userChatsRef = doc(db, "chats", currentUser.id);

        try {
            await updateDoc(userChatsRef, {
                chats: updatedChats.map(({ user, ...rest }) => rest), // Remove user field
            });
            setChats(updatedChats);
        } catch (err) {
            console.log(err);
        }
    };

    const addUser = async (newUserId, newUser) => {
        // Check if the user already exists in the chat list
        const existingChat = chats.find(chat => chat.receiverId === newUserId);
        if (existingChat) {
            console.log("User already exists in the chat list");
            throw new Error("User already exists in the chat list");
        }

        const newChatRef = doc(collection(db, "messages"));

        await setDoc(newChatRef, {
            createdAt: serverTimestamp(),
            messages: [],
            lastMessage: "Initial message",
            participants: [currentUser.id, newUserId],
        });

        const newChat = {
            chatId: newChatRef.id,
            receiverId: newUserId,
            lastMessage: "",
            updatedAt: Date.now(),
            user: newUser,
        };

        await updateDoc(doc(db, "chats", newUserId), {
            chats: arrayUnion({
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: currentUser.id,
                updatedAt: Date.now(),
            })
        });

        await updateDoc(doc(db, "chats", currentUser.id), {
            chats: arrayUnion({
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: newUserId,
                updatedAt: Date.now(),
            })
        });

        setChats(prevChats => [newChat, ...prevChats]);
    };

    const filteredChats = chats.filter((c) =>
        c.user.username.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className="main-list">
            <div className="search">
                <div className="search-bar">
                    <img src="../pictures/Search1.webp" alt="" />
                    <input 
                        type="text" 
                        placeholder="Search" 
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>
                <img
                    src={plus ? "../pictures/Minus.webp" : "../pictures/Plus.webp"}
                    alt="add"
                    className="plus"
                    onClick={() => setPlus((previous) => !previous)}
                />
            </div>
            {filteredChats.map(chat => (
                <div className="details" key={chat.chatId}>
                    <img 
                        src={chat.user.blocked.includes(currentUser.id)
                            ? "../pictures/Avatar1.webp"
                            : chat.user.avatar || "../pictures/Avatar1.webp"
                        } 
                        alt="" 
                        height={55} 
                        onClick={() => handleSelect(chat)}
                    />
                    <div className="text-info" onClick={() => handleSelect(chat)}>
                        <span>{chat.user.blocked.includes(currentUser.id) ? "User" : chat.user.username}</span>
                        <p>{chat.lastMessage}</p>
                        {chat.unreadCount > 0 && (
                            <span className="unread-count glow">{chat.unreadCount}</span>
                        )}
                    </div>
                    <button 
                        className="remove-button" 
                        onClick={() => handleRemove(chat)}
                    >
                        Remove
                    </button>
                </div>
            ))}
            {plus && <AddUser addUser={addUser} />}
        </div>
    );
};

export default ChatList;
