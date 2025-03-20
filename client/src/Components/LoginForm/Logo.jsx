import React from "react";
import websitelogo from "../../Images/website-logo.png";

const Logo = () => {
  return (
    <div className="logo">
      <img src={websitelogo} alt="rehabBuddy" style={{ width: "150px", height: "auto" }} />
    </div>
  );
};

export default Logo;
