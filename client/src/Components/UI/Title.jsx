import React, { useState, useEffect } from "react";
import { ChevronDownIcon, Box } from "@chakra-ui/icons";
import { Link } from "react-router-dom";
import ProfilePopup from "./ProfilePopup";
import logo from "../../Images/logo.webp";
import websitelogo from "../../Images/website-logo.png";
import "./Title.css";

function Title() {
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setAuthToken(token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("pointsAccumulation");
    setAuthToken(null);
  };

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Programs", path: "/programs" },
    { name: "Resources", path: "/" },
    { name: "ContactUs", path: "/" },
  ];

  return (
    <div className="title flex justify-around h-[4.7rem] items-center pt-7 w-full">
      <div>
        <img
          src={websitelogo}
          alt="EliteFit Logo"
          className="logo max-h-[150px] aspect-[3/2] object-contain"
        />
      </div>

      <div>
        <ul className="navbar flex justify-center gap-10 font-medium">
          {menuItems.map(({ name, path }) => (
            <li key={name}>
              <Box as="button" aria-label="Dropdown">
                <Link to={path} className="flex items-center gap-1">
                  {name}
                  <ChevronDownIcon boxSize={5} className="translate-y-[2px]" />
                </Link>
              </Box>
            </li>
          ))}
        </ul>
      </div>

      {authToken ? (
        <ProfilePopup handleLogout={handleLogout} />
      ) : (
        <Link to="/Login-Page">
          <button className="signin px-[1.5rem] py-[0.6rem] text-base font-bold text-[#0d2436] border-[1px] border-[#6CB33F] rounded-full bg-white hover:bg-green-50 transition">
            SignIn
          </button>
        </Link>
      )}
    </div>
  );
}

export default Title;
