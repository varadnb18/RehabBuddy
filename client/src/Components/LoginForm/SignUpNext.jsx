import React from "react";
import Logo from "./Logo";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../FireBase/FireBase";
import { doc, setDoc } from "firebase/firestore";
import { useSignup } from "./SignupContext";
import toast from "react-hot-toast";

const SignUpNext = ({ handleFocus, handleBlur, toggleForm, setPage }) => {
  const navigate = useNavigate();
  const { signup, setSignup, handleChange } = useSignup();

  async function handleSubmit(event) {
    event.preventDefault();

    console.log("Signup Data:", signup);

    const { username, email, password, heightWeight, DOB, Gender } = signup;

    let height = null,
      weight = null;
    if (heightWeight && heightWeight.includes("/")) {
      const parts = heightWeight.split("/");
      if (parts.length === 2) {
        height = parseInt(parts[0].trim());
        weight = parseInt(parts[1].trim());
      }
    }

    if (
      !username ||
      !email ||
      !password ||
      !DOB ||
      !Gender ||
      !height ||
      !weight
    ) {
      console.log("⚠️ Missing fields detected!");
      toast.error("Please fill in all fields correctly.");
      return;
    }

    const toastId = toast.loading("Signing up...");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("✅ User registered successfully!", user);

      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          username,
          email,
          date_of_birth: DOB,
          gender: Gender,
          height,
          weight,
        });
      }

      const token = await user.getIdToken();
      localStorage.setItem("authToken", token);

      setSignup({
        username: "",
        email: "",
        password: "",
        DOB: "",
        Gender: "",
        heightWeight: "",
      });

      toast.success("Sign-up Successful!", { id: toastId, duration: 3000 });

      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.log("🔥 Error during sign-up:", err.message);
      toast.error("Sign-up failed: " + err.message, { id: toastId });
    }
  }

  return (
    <form
      action="index.html"
      autoComplete="off"
      className="sign-up-form"
      onSubmit={handleSubmit}
    >
      <Logo />
      <div className="heading">
        <h2>Get Started</h2>
        <h6>Already have an account?</h6>
        <button type="button" className="toggle" onClick={toggleForm}>
          Sign in
        </button>
      </div>

      <div className="actual-form">
        <div className="input-wrap1">
          <input
            type="date"
            name="DOB"
            className="input-field1"
            value={signup.DOB}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            required
          />
          <label className="label1">Date of Birth</label>
        </div>

        <div className="input-wrap">
          <select
            name="Gender"
            className={`input-field ${signup.Gender ? "active" : ""}`}
            value={signup.Gender}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            required
          >
            <option value=""></option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <label>Gender</label>
        </div>

        <div className="input-wrap">
          <input
            type="text"
            name="heightWeight"
            className={`input-field ${signup.heightWeight ? "active" : ""}`}
            value={signup.heightWeight}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            required
          />
          <label>Height/Weight (e.g., 170 / 70)</label>
        </div>

        <div className="submit-btn">
          <input
            type="button"
            value="Prev"
            className="sign-btn"
            onClick={() => {
              setPage((currpage) => currpage - 1);
            }}
          />

          <input type="submit" value="Sign Up" className="sign-btn" />
        </div>

        <p className="text">
          By signing up, I agree to the
          <Link to="#">Terms of Services</Link> and
          <Link to="#">Privacy Policy</Link>
        </p>
      </div>
    </form>
  );
};

export default SignUpNext;
