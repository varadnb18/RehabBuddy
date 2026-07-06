import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import SplitPane from "split-pane-react";
import "split-pane-react/esm/themes/default.css";
import { auth, db } from "../FireBase/FireBase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import WebCam from "../WebCam/WebCam";

function SplitingWindow() {
  const { name } = useParams();
  const userId = auth.currentUser?.uid;

  const startTimeRef = useRef(Date.now());
  const totalStartTimeRef = useRef(Date.now());
  const screenStartTimeRef = useRef(Date.now());
  const videoRef = useRef(null);

  const pointsAccumulationRef = useRef(0);
  const [sizes, setSizes] = useState(["70%", "30%"]);

  const handleSizeChange = (newSizes) => {
    setSizes(newSizes);
  };

  // location removed due to ESLint warning

  // Set a flag in sessionStorage when the component unmounts.
  useEffect(() => {
    return () => {
      sessionStorage.setItem("reloadPrograms", "true");
    };
  }, []);

  const videoURLs = {
    chair: "https://v5-coders-tfjs-models.s3.ap-south-1.amazonaws.com/finalchair.mp4",
    tree: "https://v5-coders-tfjs-models.s3.ap-south-1.amazonaws.com/treefinal.mp4",
    shoulder_stand: "https://v5-coders-tfjs-models.s3.ap-south-1.amazonaws.com/sholderfinal.mp4",
    plank: "https://v5-coders-tfjs-models.s3.ap-south-1.amazonaws.com/plankfinal.mp4",
  };

  // Get the corresponding video URL for the selected exercise
  const videoSrc = videoURLs[name] || "";

  useEffect(() => {
    const storedAccumulation = localStorage.getItem("pointsAccumulation");
    if (storedAccumulation) {
      pointsAccumulationRef.current = Number(storedAccumulation);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const updateExerciseTime = async () => {
      if (!isMounted) return;
      
      const now = Date.now();

      // Calculate the elapsed time in minutes for each metric since its last update
      const exerciseDurationMs = now - startTimeRef.current;
      const totalDurationMs = now - totalStartTimeRef.current;
      const screenDurationMs = now - screenStartTimeRef.current;

      const exerciseMinutes = Math.floor(exerciseDurationMs / 60000);

      // Only update if at least one minute has passed (for exercise time)
      if (exerciseMinutes === 0) {
        setTimeout(updateExerciseTime, 10000);
        return;
      }

      // Update points accumulation based on exercise minutes
      pointsAccumulationRef.current += exerciseMinutes;
      localStorage.setItem("pointsAccumulation", pointsAccumulationRef.current);

      let pointsToAward = 0;
      if (pointsAccumulationRef.current >= 5) {
        const blocks = Math.floor(pointsAccumulationRef.current / 5);
        pointsToAward = blocks * 10;
        pointsAccumulationRef.current -= blocks * 5;
        localStorage.setItem("pointsAccumulation", pointsAccumulationRef.current);
      }

      const today = new Date().toISOString().split("T")[0];

      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentExerciseTime = userData.exerciseTime?.[name] || {};
          const updatedMinutes = (currentExerciseTime[today] || 0) + exerciseMinutes;

          const updatedExerciseTime = {
            ...userData.exerciseTime,
            [name]: {
              ...currentExerciseTime,
              [today]: updatedMinutes,
            },
          };

          // Calculate additional minutes for total and screen time
          const totalMinutes = Math.floor(totalDurationMs / 60000);
          const updatedTotalTime = (userData.totalTime || 0) + totalMinutes;

          const screenMinutes = Math.floor(screenDurationMs / 60000);
          const updatedScreenTimeForToday = (userData.screenTime?.[today] || 0) + screenMinutes;

          const updateData = {
            exerciseTime: updatedExerciseTime,
            totalTime: updatedTotalTime,
            screenTime: {
              ...userData.screenTime,
              [today]: updatedScreenTimeForToday,
            },
          };

          if (pointsToAward > 0) {
            const newTotalPoints = (userData.points || 0) + pointsToAward;
            updateData.points = newTotalPoints;

            const badgeImages = {
              "First Milestone": "https://tejaskasture.github.io/pose-classification-model/1_final.webp",
              "Second Milestone": "https://tejaskasture.github.io/pose-classification-model/2_final.webp",
              "Third Milestone": "https://tejaskasture.github.io/pose-classification-model/3_final.webp",
            };

            const userBadges = userData.badges || [];

            if (newTotalPoints >= 30 && !userBadges.includes(badgeImages["First Milestone"])) {
              userBadges.push(badgeImages["First Milestone"]);
              updateData.badges = userBadges;
            }
            if (newTotalPoints >= 50 && !userBadges.includes(badgeImages["Second Milestone"])) {
              userBadges.push(badgeImages["Second Milestone"]);
              updateData.badges = userBadges;
            }
            if (newTotalPoints >= 70 && !userBadges.includes(badgeImages["Third Milestone"])) {
              userBadges.push(badgeImages["Third Milestone"]);
              updateData.badges = userBadges;
            }
          }

          await updateDoc(userRef, updateData);
          console.log("Updated exercise time, total time, screen time, and points in Firestore!");

          // Reset time references for the next update cycle
          startTimeRef.current = now;
          totalStartTimeRef.current = now;
          screenStartTimeRef.current = now;
        } else {
          console.log("User document does not exist.");
        }
      } catch (error) {
        console.error("Firestore update error:", error);
      }

      setTimeout(updateExerciseTime, 10000);
    };

    updateExerciseTime();

    return () => {
      isMounted = false;
      localStorage.setItem("pointsAccumulation", pointsAccumulationRef.current);
    };
  }, [userId, name]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <SplitPane
        split="vertical"
        sizes={sizes} // 70% Webcam, 30% Video
        onChange={handleSizeChange}
        style={{ height: "100%" }}
      >
        {/* Left Pane: Webcam */}
        <div style={{ background: "#ddd", height: "100%" }}>
          <WebCam />
        </div>

        {/* Right Pane: Exercise Video */}
        <div
          style={{
            background: "#a1a5a9",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1>{name.charAt(0).toUpperCase() + name.slice(1)}</h1>
          <div style={{ width: "100%", height: "calc(100% - 60px)", position: "relative" }}>
            {videoSrc ? (
              <video
                ref={videoRef}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                controls
                loop
              >
                <source src={videoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <p>Video not available</p>
            )}
          </div>
        </div>
      </SplitPane>
    </div>
  );
}

export default SplitingWindow;
