import React from "react";
import Title from "./Title";
import varad from "../../Images/varad.webp";
import "./NewFP.css";
import "../Pages/Pages.css";

function NewFP() {
  return (
    <div className="element w-full">
      <div className="image-container">
        <img src={varad} alt="Shape" className="top-image" />
      </div>
      <div>
        <Title />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 w-full mt-2 h-auto md:h-[40.3rem] gap-6">
        {/* Left Section */}
        <div className="flex justify-center items-center w-full px-4">
          <div className="area flex flex-col items-start max-w-[40rem] text-left">
          <h1 className="text-[40px] md:text-[45px] font-medium leading-[1.1]">
          <span className="A">R</span>ehabBuddy{" "}
          <span className="word">AI-Powered</span> Rehabilitation Assistant
          Guided recovery with real-time feedback for faster healing.
        </h1>

        <p className="text-gray-500 text-lg mt-4">
        Boost productivity with AI for effective compliance, improved adherence, and        
        impactful results.
        </p>

            {/* <button className="demo mt-4 text-white px-6 py-4 rounded-2xl text-lg font-semibold">
              Book A Demo
            </button> */}
          </div>
        </div>

        {/* Right Section */}
        <div className=" flex justify-center items-center w-full">
          <div className="video rounded-xl overflow-hidden shadow-lg w-full max-w-[630px]">
            <iframe
              src="https://www.youtube.com/embed/3TJ_sOgMZd8?autoplay=1&controls=0&enablejsapi=1&rel=0&loop=1&modestbranding=1&showsearch=0&showinfo=0&autohide=1&playsinline=1&cc_load_policy=0"
              title="Trainer Video"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-[300px] md:h-[530px] object-cover"
              muted
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewFP;
