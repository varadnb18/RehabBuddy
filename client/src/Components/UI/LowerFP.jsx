import React from "react";
import { useNavigate } from "react-router-dom";
import girl from "../../Images/girl-workout.webp";
import "./LowerFP.css";

const LowerFP = () => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      navigate("/programs"); 
    } else {
      navigate("/Login-Page"); 
    }
  };

  return (
    <div className="lower-fp-container">
      <div className="lower-fp-wrapper">
        
        <div className="lower-fp-image">
          <img src={girl} alt="Workout AI Tracking" />
        </div>

        <div className="lower-fp-content">
          <h2>Enhance Recovery and Engagement with AI</h2>

          <div className="lower-fp-feature">
            <div
              className="lower-fp-icon"
              style={{ backgroundColor: "#EBFEB1" }}
            >
              <img
                src="https://img.icons8.com/?size=45&id=105414&format=png&color=000000"
                alt="Increase Revenue"
              />
            </div>
            <div>
              <h3 className="font-bold text-[1.3rem]">Accelerate Progress</h3>
              <p className="text-md text-gray-600 text-[1.1rem]">
                Speed up rehabilitation with AI-driven insights and personalized feedback.
              </p>
            </div>
          </div>

          <div className="lower-fp-feature">
            <div
              className="lower-fp-icon"
              style={{ backgroundColor: "#C4F2FE" }}
            >
              <img
                src="https://img.icons8.com/?size=100&id=79306&format=png&color=000000"
                alt="Boost User Engagement"
              />
            </div>
            <div>
              <h3 className="font-bold text-[1.3rem]">Ensure Better Compliance</h3>
              <p className="text-md text-gray-600 text-[1.1rem]">
                Improve exercise adherence and consistency with real-time guidance.
              </p>
            </div>
          </div>

          <button className="STUDIES" onClick={handleNavigation}>
            Get Started Now!
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowerFP;
