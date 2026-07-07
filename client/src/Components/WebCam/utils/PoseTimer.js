import { useState, useRef, useEffect, useCallback } from "react";

export function usePoseTimer(isCorrectPose) {
  const [timer, setTimer] = useState(0);
  const [totalTime] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const bestScoreRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const isCorrectPoseRef = useRef(isCorrectPose);

  useEffect(() => {
    isCorrectPoseRef.current = isCorrectPose;
  }, [isCorrectPose]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const formatTime = useCallback((seconds) => {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }, []);

  const startMainTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setTimer(0);
    setIsActive(true);

    timerIntervalRef.current = setInterval(() => {
      if (isCorrectPoseRef.current) {
        setTimer((prev) => {
          const newValue = prev + 1;

          if (newValue > bestScoreRef.current) {
            bestScoreRef.current = newValue;
            setBestScore(newValue);
          }

          if (newValue >= 60) {
            clearInterval(timerIntervalRef.current);
            setIsActive(false);
          }

          return newValue;
        });
      }
    }, 1000);
  }, []);

  const resetPoseState = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    setTimer(0);
    setIsActive(false);
    bestScoreRef.current = 0;
    setBestScore(0);
  }, []);

  return {
    timer,
    totalTime,
    isActive,
    bestScore,
    bestScoreRef,
    timerIntervalRef,
    formatTime,
    startMainTimer,
    resetPoseState,
  };
}
