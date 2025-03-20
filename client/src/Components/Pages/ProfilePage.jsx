import React, { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../FireBase/FireBase";
import StreakCalendar from "../Calendar/StreakCalendar";
import YogaScreenTimeChart from "../UI/YogaScreenTimeChart";
import ExerciseTimeChart from "../UI/ExerciseTimeChart";
// import PersonalInfo from "../UI/PersonalInfo";
import ChatBotIcon from "./ChatBot";
import Title from "../UI/Title";
import Badges from "../UI/Badges";



const StatBox = ({ number, label, showFire, emoji }) => (
  <div className="w-32 h-32 border border-gray-300 rounded flex flex-col items-center justify-center text-center">
    <span className="text-2xl font-bold inline-flex items-center">
      {number}
      {emoji && <span className="ml-0.5">{emoji}</span>}
      {showFire && <span className="ml-0.5">🔥</span>}
    </span>
    <span className="text-sm">{label}</span>
  </div>
);


function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalUsers: 0,
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
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };


  const calculateStreaks = (streakArray) => {
    if (!streakArray || streakArray.length === 0) return { longest: 0, current: 0 };


    const dates = streakArray.map((date) => new Date(date)).sort((a, b) => a - b);
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else if (diff > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);


    let currentStreak = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { longest: longestStreak, current: currentStreak };
  };

  // Fetch user data and calculate streaks and age
  const fetchUserData = async (userId) => {
    if (!userId) return;
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        const { longest, current } = calculateStreaks(data.streak);
        setUserData({
          ...data,
          age: calculateAge(data.date_of_birth),
          longestStreak: longest,
          currentStreak: current,
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch total yoga sessions from the "exercises" collection
  const fetchTotalYogaSessions = async () => {
    try {
      const exercisesCollection = collection(db, "exercises");
      const exercisesSnapshot = await getDocs(exercisesCollection);
      console.log("Total Yoga Sessions:", exercisesSnapshot.size);
      setStats((prevStats) => ({
        ...prevStats,
        totalSessions: exercisesSnapshot.size,
      }));
    } catch (error) {
      console.error("Error fetching yoga sessions:", error);
    }
  };

  // Fetch total number of users from the "users" collection
  const fetchTotalUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      console.log("Total Users:", usersSnapshot.size);
      setStats((prevStats) => ({
        ...prevStats,
        totalUsers: usersSnapshot.size,
      }));
    } catch (error) {
      console.error("Error fetching total users:", error);
    }
  };

  // Fetch public stats on component mount
  useEffect(() => {
    fetchTotalUsers();
    fetchTotalYogaSessions();
  }, []);

  // Listen for authentication state changes to fetch user data
  useEffect(() => {
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
      <div className="grid grid-cols-3" style={{ gridTemplateColumns: "43% 32% 25%" }}>
        <div className="flex flex-col items-center w-full ml-10">
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
            <StatBox number={stats.totalSessions} label="Total Sessions" emoji="🧘🏻‍♂️" />
            <StatBox number={stats.totalUsers} label="Total Users" emoji="🙋🏼‍♂️" />
            <StatBox number={userData?.longestStreak || 0} label="Longest streak" showFire={true} />
            <StatBox number={userData?.currentStreak || 0} label="Current streak" showFire={true} />
</div>

          </div>
        </div>

        <div className="flex flex-col items-center w-full">
          

          <div className="w-[320px] pb-5">
            <ExerciseTimeChart />
          </div>
          <div className="w-[70%] mt-[-40px] z-30">
            <StreakCalendar />
          </div>
        </div>

        {/* <PersonalInfo userData={userData} loading={loading} /> */}
        <div className="w-[90%]">
        <Badges userData={userData} loading={loading}/>
        </div>
      </div>

      {/* Chatbot Icon */}
      
      <ChatBotIcon />
    </div>
  );
}

export default ProfilePage;
