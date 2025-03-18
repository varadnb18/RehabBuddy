import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../FireBase/FireBase";
import StreakCalendar from "../Calendar/StreakCalendar";
import YogaScreenTimeChart from "../UI/YogaScreenTimeChart";
import ExerciseTimeChart from "../UI/ExerciseTimeChart";
import PersonalInfo from "../UI/PersonalInfo";
import ChatBotIcon from "./ChatBot";
import Title from "../UI/Title";

const StatBox = ({ number, label }) => (
  <div className="w-32 h-32 border border-gray-300 rounded flex flex-col items-center justify-center text-center">
    <span className="text-2xl font-bold">{number}</span>
    <span className="text-sm">{label}</span>
  </div>
);

function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats] = useState({
    totalSessions: 0,
    totalVisitors: 0,
    newVisitors: 0,
    timeSpent: "0 days",
  });

  const calculateAge = (birthDate) => {
    if (!birthDate) return "N/A";
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() &&
        today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const fetchUserData = async (userId) => {
      if (!userId) return;
      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({ ...data, age: calculateAge(data.date_of_birth) });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <Title />

      <div
        className="grid grid-cols-3"
        style={{ gridTemplateColumns: "45% 32% 23%" }}
      >
        <div className="flex flex-col items-center w-[100%] ml-10">
          <div className="p-8 w-[90%] pb-5 pt-5 flex flex-col items-start">
            <h1 className="text-3xl font-bold text-left text-[#333] mb-3 leading-normal">
              Breathe deep, 🧘🏻‍♀️🌿
              <br />
              Find balance, flow with peace!
            </h1>
            <p className="text-lg text-center text-[#666] leading-relaxed mb-3">
              Embrace the journey. The body achieves what the mind believes.
            </p>
          </div>

          <div style={{ minWidth: "600px" }}>
            <YogaScreenTimeChart />
          </div>

          <div className="p-4">
            <div className="flex gap-6 ml-5">
              <StatBox number={stats.totalSessions} label="Total Sessions" />
              <StatBox number={stats.totalVisitors} label="Total Visitors" />
              <StatBox number={stats.newVisitors} label="New Visitors" />
              <StatBox number={stats.timeSpent} label="Time Spent" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center w-[100%]">
          <div className="w-[320px] pb-5">
            <ExerciseTimeChart />
          </div>
          <div className="w-[70%] mt-[-40px] z-30">
            <StreakCalendar />
          </div>
        </div>

        <PersonalInfo userData={userData} loading={loading} />
      </div>

      {/* Chatbot Icon */}
      <ChatBotIcon />
    </div>
  );
}

export default ProfilePage;
