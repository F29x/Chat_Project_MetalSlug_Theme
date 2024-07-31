import "../styles/users.css";
import UserCard from './UserCard';
import ChatList from './ChatList';

function Users() {
  return (
    <div className="main-users">
       <UserCard/>
       <ChatList/>
      
    </div>
  )
}

export default Users
