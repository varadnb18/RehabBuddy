import React from "react";
import { useNavigate } from "react-router-dom";
import boy from "../../Images/plankexc.webp";
import "./BottomFP.css";

const BottomFP = () => {
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
    <div className="bottomfp-container flex justify-center items-start mb-20 bg-white">
      <div className="bottomfp-wrapper flex justify-between bg-white w-[85%]">
        {/* Right Section - Content */}
        <div className="bottomfp-content flex flex-col ml-10 max-w-[520px]">
          <h2 className="bottomfp-title text-[2.3rem] font-bold mb-5">
          Stay Consistent, Stay Inspired
          </h2>

          <div className="bottomfp-feature flex items-center mt-5 gap-3 mb-2">
            <div className="bottomfp-icon bg-[#EBFEB1] p-[5px] rounded-full flex items-center justify-center w-[65px] h-[65px]">
              <img
                src="https://img.icons8.com/?size=100&id=58892&format=png&color=000000"
                className="bottomfp-img w-12"
              />
            </div>
            <div>
              <h3 className="bottomfp-heading font-bold text-[1.2rem]">
              Stay Motivated with Streak Tracking
              </h3>
              <p className="bottomfp-text text-md text-gray-600 text-[1rem]">
              Build healthy habits by maintaining exercise streaks and tracking progress over time.
              </p>
            </div>
          </div>

          <div className="bottomfp-feature flex items-center mt-5 gap-3 mb-3">
            <div className="bottomfp-icon bg-[#C4F2FE] p-[5px] rounded-full flex items-center justify-center w-[65px] h-[65px]">
              <img
                src="https://img.icons8.com/?size=60&id=77451&format=png&color=000000"
                className="bottomfp-img w-12"
              />
            </div>
            <div>
              <h3 className="bottomfp-heading font-bold text-[1.2rem]">
              Earn Rewards & Badges
              </h3>
              <p className="bottomfp-text text-md text-gray-600 text-[1rem]">
              Stay engaged with gamified achievements - unlock badges and milestones as you progress.
              </p>
            </div>
          </div>
          <div>
            
            <button className="STUDIES mt-6 bg-gray-800 text-white px-7 py-4 rounded-xl hover:bg-gray-700 font-bold" onClick={handleNavigation}>
            Join the Movement!
            </button>
          </div>
        </div>
        {/* Center - AI Tracked Image */}
        <div className="bottomfp-image-container relative max-w-[500px] mr-10">
          <img
            src={boy}
            alt="Workout AI Tracking"
            className="bottomfp-image rounded-3xl h-[500px] w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default BottomFP;
