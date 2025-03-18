import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { auth, db } from "../FireBase/FireBase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const YogaScreenTimeChart = () => {
  const [screenTimeData, setScreenTimeData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [labels, setLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        // Listen for realtime updates using onSnapshot
        const unsubscribe = onSnapshot(
          userRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              const screenTime = userData.screenTime || {};

              // Compute last 7 days dates in YYYY-MM-DD format
              const last7Days = [...Array(7)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return date.toISOString().split("T")[0];
              });

              // Generate weekday labels for the chart
              const weekLabels = last7Days.map((day) => {
                const date = new Date(day);
                return date.toLocaleDateString("en-US", { weekday: "short" });
              });

              // Get screen time data for each day (or default to 0)
              const orderedData = last7Days.map((day) => screenTime[day] || 0);

              // Optionally update the document with the latest computed screenTime data
              try {
                await updateDoc(userRef, {
                  screenTime: {
                    ...screenTime,
                    ...last7Days.reduce((acc, day, index) => {
                      acc[day] = orderedData[index];
                      return acc;
                    }, {}),
                  },
                });
              } catch (error) {
                console.error("Error updating screen time:", error);
              }

              setLabels(weekLabels);
              setScreenTimeData(orderedData);
            } else {
              console.log("User document does not exist.");
            }
            setIsLoading(false);
          },
          (error) => {
            console.error("Error listening to screen time:", error);
            setIsLoading(false);
          }
        );
        return () => unsubscribe();
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-2 p-6 w-full max-w-2xl mx-auto animate-pulse">
        <div className="h-7 bg-gray-300 rounded w-1/3"></div>
        <div className="h-48 bg-gray-300 rounded-md"></div>
        <div className="flex space-x-2 mt-2">
          {Array(7)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-4 w-8 bg-gray-300 rounded"></div>
            ))}
        </div>
      </div>
    );
  }

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Screen Time (minutes)",
        data: screenTimeData,
        backgroundColor: "rgba(50, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        scales: { y: { beginAtZero: true } },
      }}
    />
  );
};

export default YogaScreenTimeChart;
