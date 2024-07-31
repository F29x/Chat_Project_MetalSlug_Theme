import { useState } from "react";
import "../styles/login.css";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../configs/firebase";
import { doc, setDoc } from "firebase/firestore";
import upload from "../configs/Upload";

function Login() {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });

    const [loading, setLoading] = useState(false);

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const form = new FormData(e.target);
        const { email, password } = Object.fromEntries(form);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login Successful");
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const form = new FormData(e.target);
        const { username, email, password, confirmPassword } = Object.fromEntries(form);

        if (!username || !email || !password || !confirmPassword) {
            toast.error("Please fill out all fields");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            let imgUrl = "";
            if (avatar.file) {
                imgUrl = await upload(avatar.file);
                setAvatar(prevAvatar => ({
                    ...prevAvatar,
                    url: imgUrl
                }));
            }

            const response = await createUserWithEmailAndPassword(auth, email, password);
            if (!response.user) {
                throw new Error("User registration failed");
            }

            await setDoc(doc(db, "soldiers", response.user.uid), {
                username,
                avatar: imgUrl,
                email,
                id: response.user.uid,
                blocked: [],
            });

            await setDoc(doc(db, "chats", response.user.uid), {
                chats: [],
            });

            toast.success("Soldier Registered Successfully, Go on Now!");
        } catch (error) {
            console.error(error); // Log the error to debug
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login">
            <div className="first">
                <h3>Give your credentials soldier</h3>
                <form onSubmit={handleRegister}>
                    <input type="text" placeholder="Username" name="username" />
                    <input type="text" placeholder="Email" name="email" />
                    <input type="password" placeholder="Password" name="password" />
                    <input type="password" placeholder="Confirm Password" name="confirmPassword" />
                    <label htmlFor="file">
                        <img src={avatar.url || "../pictures/Avatar1.webp"} alt="" height={85} />
                        Upload Image
                    </label>
                    <input type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                    <button disabled={loading}>{loading ? "Loading" : "Register"}</button>
                </form>
            </div>
            <div className="middle"></div>
            <div className="first">
                <h3>You are back soldier</h3>
                <form onSubmit={handleLogin}>
                    <input type="text" placeholder="Email" name="email" />
                    <input type="password" placeholder="Password" name="password" />
                    <button disabled={loading}>{loading ? "Loading" : "Login"}</button>
                </form>
            </div>
        </div>
    );
}

export default Login;
