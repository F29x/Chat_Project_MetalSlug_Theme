import { useEffect, useState } from "react";
import { useChatStore } from '../configs/chatstore';
import { db } from '../configs/firebase';
import { useSoldierStore } from '../configs/store';
import '../styles/features.css';
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { Howl } from 'howler';
import { auth } from "../configs/firebase";

function Features({ setChatCustomization }) {
  const { user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, resetChat, chatId } = useChatStore();
  const { currentUser } = useSoldierStore();

  const [bgColor, setBgColor] = useState('#f0f0f0'); // Initial background color
  const [fontColor, setFontColor] = useState('#000000');
  const [fontSize, setFontSize] = useState('16px');
  const [settingsVisible, setSettingsVisible] = useState(false); // State for settings visibility
  const [photosVisible, setPhotosVisible] = useState(false); // State for photos visibility
  const [filesVisible, setFilesVisible] = useState(false); // State for files visibility
  const [photos, setPhotos] = useState([]); // State for storing photos
  const [files, setFiles] = useState([]); // State for storing other files
  const [notificationSound, setNotificationSound] = useState(''); // State for storing notification sound URL

  const soundOptions = [
    { name: 'Sound 1', url: '../sounds/iphone_sms_original.mp3' },
    { name: 'Sound 2', url: '../sounds/tones.mp3' },
    { name: 'Sound 3', url: '../sounds/whistle.mp3' },
    { name: 'Sound 4', url: '../sounds/window_8.mp3' },
  ];

  useEffect(() => {
    const fetchFiles = async () => {
      if (chatId) {
        const chatRef = doc(db, "messages", chatId);
        const chatSnapshot = await getDoc(chatRef);

        if (chatSnapshot.exists()) {
          const chatData = chatSnapshot.data();
          const photos = [];
          const files = [];
          if (chatData.messages) {
            chatData.messages.forEach(message => {
              if (message.file) {
                if (message.file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                  photos.push(message.file);
                } else {
                  files.push(message.file);
                }
              }
            });
            setPhotos(photos);
            setFiles(files);
          }
        }
      }
    };

    fetchFiles();

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
  }, [chatId, currentUser.id]);

  const handleBlock = async () => {
    if (!user) {
      console.error("No user to block/unblock");
      return;
    }

    const userDocRef = doc(db, "soldiers", currentUser.id);

    try {
      console.log(`Updating block status for user ${user.id}...`);
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      console.log("Block status updated");
      changeBlock();
      console.log("Block status changed in state");
    } catch (err) {
      console.error("Error updating block status:", err);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    resetChat();
  };

  const applyCustomization = () => {
    setChatCustomization({ bgColor, fontColor, fontSize });
  };

  const toggleSettingsVisibility = () => {
    setSettingsVisible(!settingsVisible);
  };

  const togglePhotosVisibility = () => {
    setPhotosVisible(!photosVisible);
  };

  const toggleFilesVisibility = () => {
    setFilesVisible(!filesVisible);
  };

  const handleSoundChange = (e) => {
    setNotificationSound(e.target.value);
  };

  const applySound = async () => {
    const userDocRef = doc(db, "soldiers", currentUser.id);
    await updateDoc(userDocRef, {
      notificationSound: notificationSound,
    });
  };

  const playSound = () => {
    if (notificationSound) {
      const sound = new Howl({
        src: [notificationSound],
        volume: 0.5,
      });
      sound.play();
    }
  };

  return (
    <div className='main-features'>
      <div className='user'>
        <img src={user?.avatar || "../pictures/Avatar1.webp"} alt="" height={50} />
        <h2>{user?.username || "User Name"}</h2>
      </div>
      <div className='info'>
        <div className="option">
          <div className='settings' onClick={toggleSettingsVisibility}>
            <span>Chat Settings</span>
            <img src={settingsVisible ? "../pictures/ArrowDown.webp" : "../pictures/ArrowUp.webp"} alt="" height={40} />
          </div>
          {settingsVisible && (
            <div className="customization">
              <label>
                Background Color:
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
              </label>
              <label>
                Font Color:
                <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} />
              </label>
              <label>
                Font Size:
                <input type="number" value={parseInt(fontSize)} onChange={(e) => setFontSize(e.target.value + 'px')} />
              </label>
              <button onClick={applyCustomization}>Apply</button>
              <label>
                Notification Sound:
                <select value={notificationSound} onChange={handleSoundChange}>
                  {soundOptions.map((option, index) => (
                    <option key={index} value={option.url}>{option.name}</option>
                  ))}
                </select>
              </label>
              {notificationSound && (
                <>
                  <button onClick={playSound}>Play Sound</button>
                  <button onClick={applySound}>Apply Sound</button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="option">
          <div className='settings' onClick={togglePhotosVisibility}>
            <span>Photos</span>
            <img src={photosVisible ? "../pictures/ArrowDown.webp" : "../pictures/ArrowUp.webp"} alt="" className='down' />
          </div>
          {photosVisible && (
            <div className="photos">
              {photos.length > 0 ? (
                photos.map((photo, index) => (
                  <div key={index} className="photoItem">
                    <div className='photoDetail'>
                      <img src={photo} alt={`Photo ${index}`} style={{ maxWidth: '100px' }} />
                      <span>{photo.split('/').pop()}</span>
                      <a href={photo} target="_blank" rel="noopener noreferrer">
                        <img src="../pictures/Download.webp" alt="Download" height={30} className='dd' />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div>No photos available</div>
              )}
            </div>
          )}
        </div>
        <div className="option">
          <div className='settings' onClick={toggleFilesVisibility}>
            <span>Shared files</span>
            <img src={filesVisible ? "../pictures/ArrowDown.webp" : "../pictures/ArrowUp.webp"} alt="" height={40} />
          </div>
          {filesVisible && (
            <div className="files">
              {files.length > 0 ? (
                files.map((file, index) => (
                  <div key={index} className="fileItem">
                    <div className='fileDetail'>
                      <span>{file.split('/').pop()}</span>
                      <a href={file} target="_blank" rel="noopener noreferrer">
                        <img src="../pictures/Download.webp" alt="Download" height={30} className='dd' />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div>No files available</div>
              )}
            </div>
          )}
        </div>
        <button className='button' onClick={handleBlock}>
          {isCurrentUserBlocked
            ? "You are Blocked!"
            : isReceiverBlocked
            ? "User blocked"
            : "Block User"}
        </button>
        <button className='logout' onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}

export default Features;
