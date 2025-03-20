import React, { useState, useEffect } from "react";
import { ChevronDownIcon, Box } from "@chakra-ui/icons";
import { Link } from "react-router-dom";
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
    window.location.reload();
  };

  const handleScrollToBottom = () => {
    const footer = document.getElementById("footer");
    console.log("Footer element:", footer);
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth", block: "end" });
    } else {
      console.warn("Footer element not found");
    }
  };

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Programs", path: "/programs" },
    { name: "Profile", path: "/Profile" },
  ];

  return (
    <div className="title flex justify-around h-[4.7rem] items-center pt-7 w-full">
      <div className="ml-[-20px]">
        <img
          src={websitelogo}
          alt="EliteFit Logo"
          className="logo max-h-[130px] aspect-[3/2] object-contain"
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
          <li>
            <Box as="button" onClick={handleScrollToBottom} aria-label="Scroll to Footer">
              <span className="flex items-center gap-1 cursor-pointer">
                Contact Us
                <ChevronDownIcon boxSize={5} className="translate-y-[2px]" />
              </span>
            </Box>
          </li>
        </ul>
      </div>

      {authToken ? (
        <button
          className="signin px-[1.5rem] py-[0.6rem] text-base font-bold text-[#0d2436] border-[1px] border-[#6CB33F] rounded-full bg-white hover:bg-green-50 transition"
          onClick={handleLogout}
        >
          Logout
        </button>
      ) : (
        <Link to="/Login-Page">
          <button className="signin px-[1.5rem] py-[0.6rem] text-base font-bold text-[#0d2436] border-[1px] border-[#6CB33F] rounded-full bg-white hover:bg-green-50 transition">
            Sign In
          </button>
        </Link>
      )}
    </div>
  );
}

export default Title;
