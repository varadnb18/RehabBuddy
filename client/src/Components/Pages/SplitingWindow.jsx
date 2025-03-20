import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SplitPane from "split-pane-react";
import "split-pane-react/esm/themes/default.css";
import { auth, db } from "../FireBase/FireBase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import WebCam from "./WebCam";

function SplitingWindow() {
  const { name } = useParams();
  const userId = auth.currentUser?.uid;
  const startTimeRef = useRef(Date.now());
  const totalStartTimeRef = useRef(Date.now());
  const screenStartTimeRef = useRef(Date.now());
  const videoRef = useRef(null);

  const pointsAccumulationRef = useRef(0);
  const [sizes, setSizes] = useState(["50%", "50%"]);

  const handleSizeChange = (newSizes) => {
    console.log("New sizes:", newSizes);
    setSizes(newSizes);
  };

  // 🔹 Define S3 video URLs mapped to exercise names
  const videoURLs = {
    chair: "https://v5-coders-tfjs-models.s3.ap-south-1.amazonaws.com/finalchair.mp4",
    tree: "https://v5-coders-tfjs-models.s3.ap-south-1.amazonaws.com/treefinal.mp4",
    shoulder_stand: "https://v5-coders-tfjs-models.s3.ap-south-1.amazonaws.com/sholderfinal.mp4",
    plank: "https://v5-coders-tfjs-models.s3.ap-south-1.amazonaws.com/plankfinal.mp4",
  };

  // 🔹 Get the corresponding video URL for the selected exercise
  const videoSrc = videoURLs[name] || "";

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

          const updateData = {
            exerciseTime: updatedExerciseTime,
            totalTime: (userData.totalTime || 0) + durationInMinutes,
            screenTime: {
              ...(userData.screenTime || {}),
              [today]: ((userData.screenTime?.[today] || 0) + durationInMinutes),
            },
          };

          if (pointsToAward > 0) {
            updateData.points = (userData.points || 0) + pointsToAward;
          }

          await updateDoc(userRef, updateData);
          console.log("Exercise time updated in Firestore!");
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
              <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "contain" }} controls>
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
