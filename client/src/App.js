import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// import Header from "./Components/Header/Header";
import LoginPage from "./Components/LoginForm/LoginPage";
import NotFound from "./Components/UI/NotFoundPage";
import "./index.css";
import SecondPage from "./Components/Pages/SecondPage";
import ProfilePage from "./Components/Pages/ProfilePage";
import SplitingWindow from "./Components/Pages/SplitingWindow";
import FrontPage from "./Components/Pages/FrontPage";
import ProtectedRoute from "./ProtectedRoute";
import ChatPage from "./Components/UI/ChatPage";
import Badges from "./Components/Pages/Badges";
import { PoseContextProvider } from "./Components/Pages/poseContext";

const isAuthenticated = () => {
  return localStorage.getItem("authToken") !== null;
};

function App() {
  return (
    <PoseContextProvider>
      <Routes>
      <Route path="/" element={<FrontPage />} />

      <Route
        path="/Login-Page"
        element={isAuthenticated() ? <Navigate to="/" /> : <LoginPage />}
      />

       <Route path="/badges" element={<Badges />} />

      {/* Protected Routes */}
      <Route
        path="/programs"
        element={
          <ProtectedRoute>
            <SecondPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chatbot"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/Profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/:name"
        element={
          <ProtectedRoute>
            <SplitingWindow />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </PoseContextProvider>
    
  );
}

export default App;
