import { useEffect, useRef, useState } from 'react';
import '../styles/chat.css';
import EmojiPicker from 'emoji-picker-react';
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc } from '@firebase/firestore';
import { db } from '../configs/firebase';
import useChatStore from '../configs/chatstore';
import { useSoldierStore } from '../configs/store';
import upload from '../configs/Upload';
import { format } from 'timeago.js';
import { Howl } from 'howler';

function Chat({ customization }) {
    const { bgColor, fontColor, fontSize } = customization;
    const [emoji, setEmoji] = useState(false);
    const [text, setText] = useState('');
    const [chat, setChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [file, setFile] = useState({ file: null, url: "" });

    const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
    const { currentUser } = useSoldierStore();
    const endRef = useRef(null);
    const [notificationSound, setNotificationSound] = useState('');

    useEffect(() => {
        const fetchUserSettings = async () => {
            const userDocRef = doc(db, "soldiers", currentUser.id);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.notificationSound) {
                    setNotificationSound(userData.notificationSound);
                }
            }
        };

        fetchUserSettings();
    }, [currentUser.id]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    useEffect(() => {
        if (!chatId) {
            setLoading(false);
            setError('Chat ID is not defined');
            return;
        }

        const unSub = onSnapshot(doc(db, "messages", chatId), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const chatData = docSnapshot.data();
                setChat(chatData);
                setLoading(false);

                if (chatData.messages.length > 0) {
                    const lastMessage = chatData.messages[chatData.messages.length - 1];
                    if (lastMessage.senderId !== currentUser.id && notificationSound) {
                        const sound = new Howl({
                            src: [notificationSound],
                            volume: 0.5,
                        });
                        sound.play();
                    }
                }
            } else {
                setError('Chat not found');
                setLoading(false);
            }
        }, (err) => {
            setError(err.message);
            setLoading(false);
        });

        return () => {
            unSub();
        };
    }, [chatId, currentUser.id, notificationSound]);

    const handleEmoji = (e) => {
        setText((previous) => previous + e.emoji);
        setEmoji(false);
    };

    const handleFile = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0]),
            });
        }
    };

    const handleSend = async () => {
        if (text === "" && !file.file) return;

        let fileUrl = null;

        try {
            if (file.file) {
                fileUrl = await upload(file.file);
            }

            const newMessage = {
                senderId: currentUser.id,
                text,
                createdAt: new Date(),
                isUserMessage: true,
                ...(fileUrl && { file: fileUrl, fileName: file.file.name }),
            };

            await updateDoc(doc(db, "messages", chatId), {
                messages: arrayUnion(newMessage),
                ...(fileUrl && { photos: arrayUnion(fileUrl) }) // Add this line to save photo URL
            });

            const receiverChatRef = doc(db, "chats", user.id);
            const receiverChatSnapshot = await getDoc(receiverChatRef);
            let receiverChats = receiverChatSnapshot.exists() ? receiverChatSnapshot.data().chats : [];

            receiverChats = receiverChats.map(chat => {
                if (chat.chatId === chatId) {
                    return {
                        ...chat,
                        unreadCount: chat.unreadCount + 1, // Increment unread count
                        lastMessage: text || "File",
                        updatedAt: Date.now(),
                    };
                }
                return chat;
            });

            await updateDoc(receiverChatRef, { chats: receiverChats });

            const userChatRef = doc(db, "chats", currentUser.id);
            const userChatSnapshot = await getDoc(userChatRef);
            let userChats = userChatSnapshot.exists() ? userChatSnapshot.data().chats : [];

            userChats = userChats.map(chat => {
                if (chat.chatId === chatId) {
                    return {
                        ...chat,
                        lastMessage: text || "File",
                        updatedAt: Date.now(),
                    };
                }
                return chat;
            });

            await updateDoc(userChatRef, { chats: userChats });

        } catch (err) {
            console.log(err);
        } finally {
            setFile({ file: null, url: "" });
            setText("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (isCurrentUserBlocked) {
        return <div>You are blocked by this user.</div>;
    }

    if (!user) {
        return <div>Chat not accessible</div>;
    }

    return (
        <div className='main-chat' style={{ backgroundColor: bgColor }}>
            <div className='top-chat'>
                <div className='user'>
                    <img src={user.avatar || "../pictures/Avatar1.webp"} alt="" id='avatar' />
                </div>
                <div className='description'>
                    <span>{user?.username}</span>
                </div>
                <div className='icons'>
                    <img src="../pictures/Phone.webp" alt="" />
                    <img src="../pictures/Camera.webp" alt="" />
                    <img src="../pictures/Info.webp" alt="" />
                </div>
            </div>
            <div className='middle-chat' style={{ color: fontColor, fontSize }}>
                {chat ? (
                    chat.messages.map((message, index) => (
                        <div key={index} className={message.senderId === currentUser.id ? 'my message' : 'message'}>
                            {message.senderId !== currentUser.id && <img src={user.avatar || "../pictures/Avatar1.webp"} alt="" height={40} />}
                            <div className='message-content'>
                                {message.text && <p>{message.text}</p>}
                                {message.file && (
                                    <>
                                        {message.fileName.endsWith(".jpg") || message.fileName.endsWith(".png") || message.fileName.endsWith(".gif") || message.fileName.endsWith(".webp") ? (
                                            <img src={message.file} alt={message.fileName} style={{ maxWidth: '200px' }} />
                                        ) : (
                                            <a href={message.file} target="_blank" rel="noopener noreferrer">{message.fileName}</a>
                                        )}
                                    </>
                                )}
                                <span>{format(message.createdAt.toDate())}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div>No messages found</div>
                )}
                {file.url && (
                    <div className="my message">
                        <div className="message-content">
                            {file.file.name.endsWith(".jpg") || file.file.name.endsWith(".png") || file.file.name.endsWith(".gif") || file.file.name.endsWith(".webp") ? (
                                <img src={file.url} alt={file.file.name} style={{ maxWidth: '200px' }} />
                            ) : (
                                <a href={file.url} target="_blank" rel="noopener noreferrer">{file.file.name}</a>
                            )}
                        </div>
                    </div>
                )}
                <div ref={endRef}></div>
            </div>
            <div className='bottom-chat'>
                <div className='icons'>
                    <label htmlFor="file">
                        <img src="../pictures/Image.webp" alt="" />
                    </label>
                    <input
                        type="file"
                        id="file"
                        style={{ display: "none" }}
                        onChange={handleFile}
                    />
                    <img src="../pictures/Foto.webp" alt="" />
                    <img src="../pictures/Microphone.webp" alt="" />
                </div>
                <input
                    type="text"
                    placeholder={(isCurrentUserBlocked || isReceiverBlocked) ? "You cannot send a message" : "Type a message..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                    style={{ color: fontColor, fontSize }}
                />
                <div className='emoji'>
                    <img src="../pictures/Emoji.webp" alt="" onClick={() => setEmoji((previous) => !previous)} />
                    {emoji && (
                        <div className='for-emoji'>
                            <EmojiPicker onEmojiClick={handleEmoji} />
                        </div>
                    )}
                </div>
                <button className='send' onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>Send</button>
            </div>
        </div>
    );
}

export default Chat;
