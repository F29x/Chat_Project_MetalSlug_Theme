import '../styles/usercard.css';
import { useSoldierStore } from '../configs/store';
import useChatStore from '../configs/chatstore';
import { auth } from '../configs/firebase';

function UserCard() {
  const { currentUser } = useSoldierStore();
  const { resetChat } = useChatStore();

  const handleLogout = () => {
    auth.signOut();
    // resetChat();
  };

  return (
    <div className="main-card">
      <div className="user">
        <img src={currentUser.avatar || "../pictures/Avatar1.webp"} alt="avatar" className="avatar" />
        <div className="user-info">
          <h2>{currentUser.username}</h2>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div className="icons">
        <img src="../pictures/More.webp" alt="more" />
        <img src="../pictures/Camera.webp" alt="video" />
        <img src="../pictures/Edit.webp" alt="edit" />
      </div>
    </div>
  );
}

export default UserCard;
