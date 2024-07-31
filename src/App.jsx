import  { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Chat from "./components/Chat";
import Features from "./components/Features";
import Users from "./components/Users";
import Login from "./components/Login";
import Alert from "./components/Alert";
import Carousel from './components/Carousel'; // Import the Carousel component
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./configs/firebase";
import { useSoldierStore } from "./configs/store";
import useChatStore from "./configs/chatstore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useSoldierStore();
  const { chatId } = useChatStore();

  const [customization, setCustomization] = useState({
    bgColor:  'hsla(30, 56%, 51%, 0.4)',
    fontColor: '#000000',
    fontSize: '16px'
  });

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => { unSub() };
  }, [fetchUserInfo]);

  if (isLoading) return (
    <div className="loading">Loading...</div>
  );

  return (
    <Router>
      <nav>
        
            <Link to="/" ><button className='home'>Home</button></Link>
        
      </nav>
      <Routes>
        <Route exact path="/" element={<Carousel />} />
        <Route path="/chat" element={
          <div className='main-container'>
            {currentUser ? (
              <>
                <Users />
                {chatId && <Chat customization={customization} />}
                {chatId && <Features setChatCustomization={setCustomization} />}
              </>
            ) : (
              <Login />
            )}
            <Alert />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
