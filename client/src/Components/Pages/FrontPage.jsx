import React from "react";
import NewFP from "../UI/NewFP";
import LowerFP from "../UI/LowerFP";
import MiddleFP from "../UI/MiddleFP";
import BottomFP from "../UI/BottomFP";
import Footer from "../UI/Footer";
import ChatBotIcon from "./ChatBot";

function FrontPage() {
  return (
    <>
      <div>
        <NewFP />
      </div>
      <div>
        <MiddleFP />
      </div>
      <div>
        <LowerFP />
      </div>
      <div>
        <BottomFP />
      </div>
      <div>
        <Footer />
      </div>

      {/* Chatbot Icon */}
      <ChatBotIcon />
    </>
  );
}

export default FrontPage;
