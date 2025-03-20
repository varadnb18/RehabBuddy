import React from "react";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaInstagram,
} from "react-icons/fa";

import whitelogo from "../../Images/whitelogo.png";

const Footer = () => {
  return (
    <footer className="footer bg-black text-white py-16 px-6">
      <div className="max-w-[1200px] mx-auto flex flex-wrap justify-between gap-10 lg:gap-20">
        {/* Left Section */}
        <div className="w-full md:w-auto text-center md:text-left">
          <img
            src={whitelogo}
            alt="EliteFit.AI Logo"
            className=" mx-[-10px] md:ml- w-48 h-auto"
            w
          />

          <p className="text-md mb-1">Copyright © RehabBuddy</p>
          <p className="text-md mb-4">All Rights Reserved.</p>

          {/* Social Icons */}
          <div className="flex justify-center md:justify-start space-x-5">
            <FaFacebookF className="text-lg cursor-pointer hover:text-green-400" />
            <FaLinkedinIn className="text-lg cursor-pointer hover:text-green-400" />
            <a href="https://youtu.be/T57rCqYXOPE?si=osWMul1uWIWrOVA-" target="_blank" rel="noopener noreferrer">
            <FaYoutube className="text-lg cursor-pointer hover:text-green-400" />
            </a>
            <FaInstagram className="text-lg cursor-pointer hover:text-green-400" />
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 w-full md:w-auto text-center md:text-left">
          <div>
            <h3 className="text-[#6CB33F] font-bold mb-2 text-lg">
              Who We Serve
            </h3>
            <ul className="text-md space-y-3">
              <li>Healthcare</li>
              <li>Fitness/Yoga</li>
              <li>Sports</li>
              <li>Insurance</li>
              <li>Public Sector</li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#6CB33F] font-bold mb-2 text-lg">
              About RehabBuddy
            </h3>
            <ul className="text-md space-y-3">
              <li>Why RehabBuddy</li>
              <li>Careers</li>
              <li>Contact Us</li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#6CB33F] font-bold mb-2 text-lg">Resources</h3>
            <ul className="text-md space-y-3">
              <li>Videos</li>
              <li>Press</li>
              <li>FAQ</li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#6CB33F] font-bold mb-2 text-lg">Legal</h3>
            <ul className="text-md space-y-3">
              <li>Terms of Use</li>
              <li>Privacy Policy</li>
              <li>Cookies & Ads</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


