import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SplitPane from "split-pane-react";
import "split-pane-react/esm/themes/default.css";
import { auth, db } from "../FireBase/FireBase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

function SplitingWindow() {
  const { name } = useParams();
  const userId = auth.currentUser?.uid;
  const startTimeRef = useRef(Date.now());
  const totalStartTimeRef = useRef(Date.now());
  const screenStartTimeRef = useRef(Date.now());

  const pointsAccumulationRef = useRef(0);
  const [sizes, setSizes] = useState(["50%", "50%"]);

  const handleSizeChange = (newSizes) => {
    console.log("New sizes:", newSizes);
    setSizes(newSizes);
  };

  useEffect(() => {
    if (!userId) return;

    const updateExerciseTime = async () => {
      const endTime = Date.now();
      const durationInMs = endTime - startTimeRef.current;
      const durationInMinutes = Math.floor(durationInMs / 60000);
      if (durationInMinutes === 0) return;

      pointsAccumulationRef.current += durationInMinutes;
      let pointsToAward = 0;
      if (pointsAccumulationRef.current >= 5) {
        const blocks = Math.floor(pointsAccumulationRef.current / 5);
        pointsToAward = blocks * 10;

        pointsAccumulationRef.current -= blocks * 5;
      }

      const today = new Date().toISOString().split("T")[0];

      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentExerciseTime = userData.exerciseTime?.[name] || {};
          const updatedMinutes = (currentExerciseTime[today] || 0) + durationInMinutes;

          const updatedExerciseTime = {
            ...userData.exerciseTime,
            [name]: {
              ...currentExerciseTime,
              [today]: updatedMinutes,
            },
          };

          const totalTimeInMs = Date.now() - totalStartTimeRef.current;
          const totalTimeInMinutes = Math.floor(totalTimeInMs / 60000);
          const updatedTotalTime = userData.totalTime || 0;
          const updatedTotalTimeInMinutes = updatedTotalTime + totalTimeInMinutes;

          const screenTimeInMs = Date.now() - screenStartTimeRef.current;
          const screenTimeInMinutes = Math.floor(screenTimeInMs / 60000);
          const updatedScreenTime = userData.screenTime || {};
          const updatedScreenTimeForToday = (updatedScreenTime[today] || 0) + screenTimeInMinutes;
          const updatedScreenTimeData = {
            ...updatedScreenTime,
            [today]: updatedScreenTimeForToday,
          };

          const updateData = {
            exerciseTime: updatedExerciseTime,
            totalTime: updatedTotalTimeInMinutes,
            screenTime: updatedScreenTimeData,
          };

          if (pointsToAward > 0) {
            const newTotalPoints = (userData.points || 0) + pointsToAward;
            updateData.points = newTotalPoints;
            console.log(`Awarded ${pointsToAward} points. Total points: ${newTotalPoints}`);

            const userBadges = userData.badges || [];
            if (newTotalPoints >= 30 && !userBadges.includes("First Milestone")) {
              userBadges.push("First Milestone");
              updateData.badges = userBadges;
              console.log("User awarded a badge: First Milestone");
            }
          }

          await updateDoc(userRef, updateData);
          console.log("Exercise time, total time, screen time, and points updated in Firestore!");

          startTimeRef.current = Date.now();
          totalStartTimeRef.current = Date.now();
          screenStartTimeRef.current = Date.now();
        } else {
          console.log("User document does not exist.");
        }
      } catch (error) {
        console.error("Firestore update error:", error);
      }
    };

    const interval = setInterval(updateExerciseTime, 10000);

    return () => {
      updateExerciseTime();
      clearInterval(interval);
    };
  }, [userId, name]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <SplitPane
        split="vertical"
        sizes={sizes}
        onChange={handleSizeChange}
        style={{ height: "100%" }}
      >
        <div style={{ background: "#ddd", height: "100%" }}>Pane 1</div>
        <div style={{ background: "#a1a5a9", height: "100%" }}>Pane 2</div>
      </SplitPane>
    </div>
  );
}

export default SplitingWindow;
