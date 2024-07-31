import { collection, getDocs, query, where } from "@firebase/firestore";
import "../styles/addUsers.css"
import { db } from "../configs/firebase";
import { useState } from "react";
import { useSoldierStore } from "../configs/store";

function AddUser({ addUser }) {
  const [soldier, setSoldier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formdata = new FormData(e.target);
    const username = formdata.get('username');

    if (!username) {
      setError("Please enter a username");
      setLoading(false);
      return;
    }

    try {
      const userRef = collection(db, "soldiers");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        const soldierData = querySnapShot.docs[0].data();
        setSoldier({ ...soldierData, id: querySnapShot.docs[0].id });
      } else {
        setSoldier(null);
        setError("User not found");
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!soldier) {
      setError("No user selected");
      return;
    }

    try {
      await addUser(soldier.id, soldier);
      setError(null);
      setSoldier(null); // Clear the selected soldier after adding
    } catch (error) {
      console.error(error);
      setError("An error occurred while adding the user");
    }
  };

  return (
    <div className='addUser'>
      <form onSubmit={handleSearch}>
        <input type="text" placeholder='username' name="username" />
        <button disabled={loading}>{loading ? "Searching..." : "Search"}</button>
      </form>
      {error && <div className='error'>{error}</div>}
      {soldier && (
        <div className='user'>
          <div className="detail">
            <img src={soldier.avatar || "../pictures/Avatar1.webp"} alt="" height={50} />
            <span>{soldier.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
}

export default AddUser;
