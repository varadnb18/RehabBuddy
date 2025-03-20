import React, { useState } from "react";
import Logo from "./Logo";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../FireBase/FireBase";
import { updateStreak } from "../Calendar/updateStreak";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const SignInForm = ({ handleFocus, handleBlur, toggleForm }) => {
  const navigate = useNavigate();
  const [signin, setSignin] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSignin((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const toastId = toast.loading('Signing in...');

    // Prevent duplicate submissions
    if (submitting) return;
    setSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        signin.email,
        signin.password
      );
      const user = userCredential.user;

      // Show toast for successful login
      toast.success("Login Successful!", { id: toastId, duration: 3000 });
      
      await updateStreak();

      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);

      setSignin({ email: "", password: "" });
      
      // Delay navigation to allow toast visibility
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.log(err.message);
      toast.error("Invalid Credentials", {id : toastId});
      setSubmitting(false);
    }
  };

  return (
    <form className="sign-in-form" autoComplete="off" onSubmit={handleSubmit}>
      <Logo />
      <div className="heading">
        <h2>Welcome Back</h2>
        <h6>Not registered yet?</h6>
        <button type="button" className="toggle" onClick={toggleForm}>
          Sign up
        </button>
      </div>

      <div className="actual-form">
        <div className="input-wrap">
          <input
            type="email"
            className={`input-field ${signin.email ? "active" : ""}`}
            name="email"
            value={signin.email}
            required
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
          <label>Email</label>
        </div>

        <div className="input-wrap">
          <input
            type="password"
            className={`input-field ${signin.password ? "active" : ""}`}
            name="password"
            value={signin.password}
            required
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />
          <label>Password</label>
        </div>

        <input type="submit" value="Sign In" className="sign-btn" />

        <p className="text">
          Forgotten your password or your login details?{" "}
          <Link to="#">Get help</Link> signing in
        </p>
      </div>
    </form>
  );
};

export default SignInForm;
