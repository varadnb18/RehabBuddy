/* eslint-disable */
import React, { useEffect, useState, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "./WebCam.css";
import { useParams } from "react-router-dom";

function WebCam() {
  const { name } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedPose, setSelectedPose] = useState(name);
  const [accuracy, setAccuracy] = useState(0);
  const [isCorrectPose, setIsCorrectPose] = useState(false);
  const [timer, setTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(60); // 1 minute by default
  const [isActive, setIsActive] = useState(false);
  const [messageStatus, setMessageStatus] = useState("Take the correct pose");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [bestScore, setBestScore] = useState(0); // Added to track best score
  const timerIntervalRef = useRef(null); // Reference for the main timer interval
  const bestScoreRef = useRef(0); // Reference to track best score for current pose
  const poseClassifier = useRef(null);
  const tfModel = useRef(null);

  // Sync selectedPose with URL parameter when navigating between poses
  useEffect(() => {
    if (name && name !== selectedPose) {
      setSelectedPose(name);
      // Reset the accuracy and timers for the new pose
      setAccuracy(0);
      setIsCorrectPose(false);
      setBestScore(0);
      bestScoreRef.current = 0;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTimer(0);
      setIsActive(false);
    }
  }, [name, selectedPose]);

  // Updated pose classes to include tree and plank
  // Option 1: Update pose classes to match the model's 8 classes
  const poseClasses = [
    "chair",
    "cobra",
    "downdog",
    "shoulder_stand",
    "tree",
    "plank",
  ];

  const normalizeLandmarks = (landmarks) => {
    // Create a fixed-length array (66 elements for x,y of 33 landmarks)
    const normalizedLandmarks = new Array(66).fill(0);

    // Make sure we're getting valid landmarks
    if (!landmarks || landmarks.length === 0) {
      console.warn("No landmarks provided to normalize");
      return normalizedLandmarks;
    }

    // Calculate bounding box for normalization
    let minX = 1,
      minY = 1,
      maxX = 0,
      maxY = 0;
    for (let i = 0; i < landmarks.length; i++) {
      if (landmarks[i] && landmarks[i].visibility > 0.5) {
        minX = Math.min(minX, landmarks[i].x);
        minY = Math.min(minY, landmarks[i].y);
        maxX = Math.max(maxX, landmarks[i].x);
        maxY = Math.max(maxY, landmarks[i].y);
      }
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.max(width, height);

    // Extract only x and y coordinates and normalize to range [0,1]
    for (let i = 0; i < landmarks.length && i < 33; i++) {
      if (
        landmarks[i] &&
        typeof landmarks[i].x === "number" &&
        typeof landmarks[i].y === "number"
      ) {
        // Normalize coordinates to be centered and scaled
        normalizedLandmarks[i * 2] =
          (landmarks[i].x - minX) / Math.max(0.1, scale);
        normalizedLandmarks[i * 2 + 1] =
          (landmarks[i].y - minY) / Math.max(0.1, scale);
      }
    }

    return normalizedLandmarks;
  };

  // Add this function inside your App component
  const handlePoseSelection = (pose) => {
    setSelectedPose(pose);
    // Optionally reset related states when changing pose
    setAccuracy(0);
    setIsCorrectPose(false);
    setBestScore(0);
    bestScoreRef.current = 0;
  };

  useEffect(() => {
    // Initialize MediaPipe and TensorFlow model
    const initMediaPipe = async () => {
      try {
        // Load TensorFlow.js if not already loaded
        await tf.ready();

        try {
          console.log("Attempting to load TensorFlow model...");
          tfModel.current = await tf.loadLayersModel(
            "https://tejaskasture.github.io/pose-classification-model/model.json",
          );

          // Check if model output shape matches our expected classes
          const outputShape = tfModel.current.outputs[0].shape;
          const numClasses = outputShape[outputShape.length - 1];

          if (numClasses !== poseClasses.length) {
            console.warn(
              `Model expects ${numClasses} classes but we defined ${poseClasses.length}. Adjusting...`,
            );
            // Option: Adjust the poseClasses array (add placeholders if needed)
            while (poseClasses.length < numClasses) {
              poseClasses.push(`unknown_class_${poseClasses.length}`);
            }
          }

          // Warm up the model with a dummy prediction
          const dummyInput = tf.zeros([1, 66]);
          const warmupPrediction = tfModel.current.predict(dummyInput);
          warmupPrediction.dispose();

          console.log("Model loaded successfully");
          console.log("Model input shape:", tfModel.current.inputs[0].shape);
          console.log("Model output shape:", tfModel.current.outputs[0].shape);

          console.log("Model loaded successfully", tfModel.current);
          setModelLoaded(true);
          setMessageStatus("Model loaded. Ready to detect poses.");
        } catch (modelError) {
          console.error("Error loading pose classification model:", modelError);
          console.log("Switching to fallback classifier");
          setMessageStatus("Using simplified pose detection (fallback mode)");
          // Make sure fallback classifier is set up
          setupSimplePoseClassifier();
        }

        // Load the MediaPipe pose solution
        const { Pose } = await import("@mediapipe/pose");
        const { Camera } = await import("@mediapipe/camera_utils");
        const { drawConnectors, drawLandmarks } =
          await import("@mediapipe/drawing_utils");

        // Create a new pose instance
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        // Set up pose options
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        // Set up pose detection callback
        pose.onResults((results) => {
          if (!canvasRef.current) return;

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // If no pose detected
          if (!results.poseLandmarks) {
            setMessageStatus(
              "No person detected. Please stand in view of camera.",
            );
            setAccuracy(0); // Reset accuracy when no person detected
            return;
          }

          console.log("selectedPose", selectedPose);

          const result = calculatePoseAccuracy(
            results.poseLandmarks,
            selectedPose,
          );
          const isPoseCorrect = result.isCorrect;
          setAccuracy(result.accuracy);

          // Set color based on pose correctness
          ctx.strokeStyle = isPoseCorrect ? "#00FF00" : "#FF0000";
          ctx.fillStyle = isPoseCorrect ? "#00FF00" : "#FF0000";

          // Draw pose detection output on canvas
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw the video frame on the canvas
          if (videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          }

          // Draw connectors
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: isPoseCorrect ? "#00FF00" : "#FF0000",
            lineWidth: 4,
          });

          // Draw landmarks
          drawLandmarks(ctx, results.poseLandmarks, {
            color: isPoseCorrect ? "#00FF00" : "#FF0000",
            lineWidth: 2,
          });

          // Handle pose correctness - no delay for timer start
          handlePoseCorrectness(isPoseCorrect);

          // Add reference pose image
          addReferenceImage(ctx, selectedPose);

          ctx.restore();
        });

        // Initialize camera
        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) {
                await pose.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });

          camera
            .start()
            .then(() => {
              setMessageStatus(
                "Camera connected. Stand back to see your full body.",
              );
            })
            .catch((error) => {
              console.error("Error starting camera:", error);
              setMessageStatus(
                "Error accessing camera. Please allow camera access.",
              );
            });
        }

        // Set up pose classifier fallback (in case model fails)
        setupSimplePoseClassifier();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        setMessageStatus(
          "Failed to initialize pose detection. Please refresh the page.",
        );
      }
    };

    initMediaPipe();

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [modelLoaded, selectedPose]);

  // Get appropriate threshold based on pose difficulty
  const getThresholdForPose = (pose) => {
    switch (pose) {
      case "tree":
      case "shoulder_stand":
        return 65; // These are harder poses, so we give a bit more leeway
      case "plank":
        return 60; // Plank is hard to detect accurately
      default:
        return 70; // Default threshold
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Helper: compute the angle (°) at vertex B formed by A-B-C
  // ─────────────────────────────────────────────────────────────────
  const angleBetween = (A, B, C) => {
    const BA = { x: A.x - B.x, y: A.y - B.y };
    const BC = { x: C.x - B.x, y: C.y - B.y };
    const dot = BA.x * BC.x + BA.y * BC.y;
    const magBA = Math.sqrt(BA.x * BA.x + BA.y * BA.y);
    const magBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y);
    if (magBA < 1e-6 || magBC < 1e-6) return 180;
    return (
      Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC)))) *
      (180 / Math.PI)
    );
  };

  // ─────────────────────────────────────────────────────────────────
  // GEOMETRIC GATE: returns a score 0-100 based purely on body geometry.
  // If critical conditions are not met the gate returns 0, which will
  // suppress the TF model score entirely.
  // ─────────────────────────────────────────────────────────────────
  const geometricGate = (landmarks, targetPose) => {
    if (!landmarks || landmarks.length < 33) return 0;

    const gp = (i) => landmarks[i] || { x: 0, y: 0, z: 0, visibility: 0 };

    const nose = gp(0);
    const leftShoulder = gp(11);
    const rightShoulder = gp(12);
    const leftElbow = gp(13);
    const rightElbow = gp(14);
    const leftWrist = gp(15);
    const rightWrist = gp(16);
    const leftHip = gp(23);
    const rightHip = gp(24);
    const leftKnee = gp(25);
    const rightKnee = gp(26);
    const leftAnkle = gp(27);
    const rightAnkle = gp(28);
    const leftHeel = gp(29);
    const rightHeel = gp(30);
    const leftFootIdx = gp(31);
    const rightFootIdx = gp(32);

    switch (targetPose) {
      // ── TREE POSE ──────────────────────────────────────────────────
      // MUST: one ankle visibly raised (ankle.y < same-side hip.y – some margin)
      //       one leg clearly off the ground – use strict threshold
      case "tree": {
        // In MediaPipe, Y increases downward (0=top, 1=bottom)
        // A raised foot will have a LOWER y value than the standing knee/hip
        const leftFootRaised = leftAnkle.y < rightKnee.y - 0.05; // left ankle clearly above right knee
        const rightFootRaised = rightAnkle.y < leftKnee.y - 0.05; // right ankle clearly above left knee

        if (!leftFootRaised && !rightFootRaised) {
          // No foot is raised — hard gate fails, max 10%
          return 0;
        }

        // Arms raised above shoulders
        const armsUp =
          leftWrist.y < leftShoulder.y - 0.05 &&
          rightWrist.y < rightShoulder.y - 0.05;

        // Balance: nose X close to hip midpoint
        const midHipX = (leftHip.x + rightHip.x) / 2;
        const balanceScore = Math.max(0, 1 - Math.abs(nose.x - midHipX) * 8);

        // Arms joined / close together overhead
        const armsClose = Math.abs(leftWrist.x - rightWrist.x) < 0.25;

        let score = 40; // base for having one foot up
        if (armsUp) score += 30;
        if (armsClose) score += 10;
        score += balanceScore * 20;

        return Math.min(100, score);
      }

      // ── CHAIR POSE ────────────────────────────────────────────────
      // MUST: knee angle < 150° (actually bending, not just standing)
      case "chair": {
        const leftKneeAngleDeg = angleBetween(leftHip, leftKnee, leftAnkle);
        const rightKneeAngleDeg = angleBetween(rightHip, rightKnee, rightAnkle);
        const avgKneeBend = (leftKneeAngleDeg + rightKneeAngleDeg) / 2;

        // Standing straight ~ 170-180°. We need meaningful bend < 155°
        if (avgKneeBend > 158) {
          // Not bending — hard gate fails
          return 0;
        }

        // Arms overhead
        const armsUp =
          leftWrist.y < leftShoulder.y - 0.04 &&
          rightWrist.y < rightShoulder.y - 0.04;

        // Score: the more bent, the better (90° is perfect chair pose)
        const bendScore = Math.max(0, Math.min(1, (158 - avgKneeBend) / 68)); // 0 at 158°, 1 at 90°
        const midHipX = (leftHip.x + rightHip.x) / 2;
        const balanceScore = Math.max(0, 1 - Math.abs(nose.x - midHipX) * 8);

        let score = 30;
        score += bendScore * 40;
        score += (armsUp ? 1 : 0) * 20;
        score += balanceScore * 10;

        return Math.min(100, score);
      }

      // ── PLANK POSE ────────────────────────────────────────────────
      // MUST: body horizontal (shoulder, hip, ankle roughly same Y)
      //       AND body must be facing sideways (large X spread between shoulder and ankle)
      case "plank": {
        // Body horizontality: shoulder-hip and hip-ankle Y differences must be small
        const shoulderHipDiffL = Math.abs(leftShoulder.y - leftHip.y);
        const shoulderHipDiffR = Math.abs(rightShoulder.y - rightHip.y);
        const hipAnkleDiffL = Math.abs(leftHip.y - leftAnkle.y);
        const hipAnkleDiffR = Math.abs(rightHip.y - rightAnkle.y);

        const bodyIsHorizontal =
          shoulderHipDiffL < 0.13 && shoulderHipDiffR < 0.13;
        const legsExtended = hipAnkleDiffL > 0.05 && hipAnkleDiffR > 0.05;

        // The body must have meaningful horizontal extent (side-on to camera)
        // shoulders X should be significantly different from ankle X
        const bodyLength = Math.abs(
          (leftShoulder.x + rightShoulder.x) / 2 -
            (leftAnkle.x + rightAnkle.x) / 2,
        );
        const isSideOn = bodyLength > 0.2;

        if (!bodyIsHorizontal || !isSideOn) return 0;

        // Elbow / wrist support check
        const onForearms =
          leftElbow.y > leftShoulder.y && rightElbow.y > rightShoulder.y;
        const onHands =
          leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;
        const hasSupport = onForearms || onHands;

        const deviation = shoulderHipDiffL + shoulderHipDiffR;
        const alignScore = Math.max(0, 1 - deviation * 4);

        let score = 40;
        score += alignScore * 40;
        score += (hasSupport ? 1 : 0) * 10;
        score += (legsExtended ? 1 : 0) * 10;

        return Math.min(100, score);
      }

      // ── SHOULDER STAND ────────────────────────────────────────────
      // MUST: ankles above hips (inverted), hips above shoulders
      case "shoulder_stand": {
        const anklesAboveHips =
          leftAnkle.y < leftHip.y && rightAnkle.y < rightHip.y;
        const hipsAboveShoulders =
          leftHip.y < leftShoulder.y && rightHip.y < rightShoulder.y;

        if (!anklesAboveHips || !hipsAboveShoulders) return 0;

        const xDiff = Math.abs(leftAnkle.x - rightAnkle.x);
        const legAlignment = Math.max(0, 1 - xDiff * 3);
        const backSupport =
          leftElbow.y > leftShoulder.y && rightElbow.y > rightShoulder.y;

        let score = 50;
        score += legAlignment * 30;
        score += (backSupport ? 1 : 0) * 20;

        return Math.min(100, score);
      }

      // ── COBRA POSE ────────────────────────────────────────────────
      // MUST: shoulders clearly below hips in Y (lying down), chest lifted
      case "cobra": {
        // In cobra, person lies on stomach. Hips will be low on screen (high Y).
        // Shoulders should be lifted (lower Y than hips)
        const chestLifted =
          leftShoulder.y < leftHip.y && rightShoulder.y < rightHip.y;
        const armsPropping =
          leftElbow.y > leftShoulder.y && rightElbow.y > rightShoulder.y;

        if (!chestLifted) return 0;

        const torsoLen = Math.abs(leftShoulder.y - leftHip.y);
        const neckLen = Math.abs(nose.y - leftShoulder.y);
        const archScore = Math.min(1, neckLen / Math.max(0.05, torsoLen));

        let score = 40;
        score += archScore * 40;
        score += (armsPropping ? 1 : 0) * 20;

        return Math.min(100, score);
      }

      // ── DOWNDOG ───────────────────────────────────────────────────
      // MUST: hips highest point (inverted V shape)
      case "downdog": {
        const hipsUp =
          leftHip.y < leftShoulder.y && rightHip.y < rightShoulder.y;
        const handsDown =
          leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;
        const feetDown = leftAnkle.y > leftHip.y && rightAnkle.y > rightHip.y;

        if (!hipsUp || !handsDown || !feetDown) return 0;

        const hipHeight =
          Math.abs(leftHip.y - leftShoulder.y) /
          Math.max(0.05, Math.abs(leftHip.y - leftAnkle.y));
        const shapeScore = Math.min(1, hipHeight);

        let score = 40;
        score += shapeScore * 60;

        return Math.min(100, score);
      }

      default:
        return 0;
    }
  };

  // Improved simple pose classifier (used when TF model is unavailable)
  const setupSimplePoseClassifier = () => {
    poseClassifier.current = {
      classify: (landmarks, targetPose) => {
        const score = geometricGate(landmarks, targetPose);
        return {
          confidence: score,
          isCorrect: score > getThresholdForPose(targetPose),
        };
      },
    };
  };

  const calculatePoseAccuracy = (landmarks, targetPose) => {
    // Compute the geometric gate score (0-100) based on body geometry.
    // This MUST pass before we trust the TF model at all.
    const gateScore = geometricGate(landmarks, targetPose);

    if (tfModel.current && modelLoaded) {
      return tf.tidy(() => {
        const normalizedData = normalizeLandmarks(landmarks);
        const inputTensor = tf.tensor2d([normalizedData], [1, 66]);
        const predictions = tfModel.current.predict(inputTensor);
        const predArray = predictions.arraySync()[0];

        const targetIndex = poseClasses.indexOf(targetPose);
        if (targetIndex === -1) return { accuracy: 0, isCorrect: false };

        const modelConf = predArray[targetIndex] * 100; // 0-100

        // ── HYBRID SCORE ──────────────────────────────────────────
        // If geometric gate returns 0 (critical pose requirement not met),
        // the final score is capped at a low value regardless of what
        // the TF model says. This prevents false 100% readings.
        let finalAccuracy;
        if (gateScore === 0) {
          // Hard gate failed — show at most 15% so user sees they're wrong
          finalAccuracy = Math.min(15, Math.round(modelConf * 0.15));
        } else {
          // Weighted blend: 50% TF model + 50% geometric gate
          // Both must agree for a high score
          finalAccuracy = Math.round(modelConf * 0.5 + gateScore * 0.5);
        }

        finalAccuracy = Math.max(0, Math.min(100, finalAccuracy));

        console.log(
          `[${targetPose}] modelConf=${Math.round(modelConf)}% gateScore=${Math.round(gateScore)}% → final=${finalAccuracy}%`,
        );

        return {
          accuracy: finalAccuracy,
          isCorrect: finalAccuracy > getThresholdForPose(targetPose),
        };
      });
    } else {
      // TF model not loaded — use pure geometric gate
      if (!poseClassifier.current) return { accuracy: 0, isCorrect: false };
      const result = poseClassifier.current.classify(landmarks, targetPose);
      return {
        accuracy: Math.round(result.confidence),
        isCorrect: result.confidence > getThresholdForPose(targetPose),
      };
    }
  };

  // Start the main timer
  const startMainTimer = () => {
    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Reset timer and set active
    setTimer(0);
    setIsActive(true);

    // Start new timer interval - only runs when correct pose is maintained
    timerIntervalRef.current = setInterval(() => {
      // Only increment the timer if the pose is correct
      if (isCorrectPose) {
        setTimer((prev) => {
          const newValue = prev + 1;

          // Update best score if current timer exceeds it
          if (newValue > bestScoreRef.current) {
            bestScoreRef.current = newValue;
            setBestScore(newValue);
          }

          if (newValue >= totalTime) {
            // Stop timer when time is up
            clearInterval(timerIntervalRef.current);
            setIsActive(false);
            setMessageStatus(
              "Session completed! Your best time: " +
                formatTime(bestScoreRef.current),
            );
          }
          return newValue;
        });
      }
    }, 1000);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };

  // Replace the existing handlePoseCorrectness function with this:
  const handlePoseCorrectness = (isPoseCorrect) => {
    // Use consistent threshold logic
    const isPoseCorrectThreshold = getThresholdForPose(selectedPose);
    const isPoseCorrectByThreshold = accuracy > isPoseCorrectThreshold;

    if (isPoseCorrectByThreshold) {
      // If we weren't in correct pose before but now we are
      if (!isCorrectPose) {
        setIsCorrectPose(true);
        setMessageStatus("Perfect! Hold position");

        // Start the timer immediately when pose is correct
        // This is the key change - no delay/hold time required
        if (!isActive) {
          startMainTimer();
        }
      }
    } else {
      // If we were in correct pose before but now we aren't
      if (isCorrectPose) {
        setIsCorrectPose(false);
        setMessageStatus(
          `Keep trying! Get your ${selectedPose.replace("_", " ")} pose accuracy above ${isPoseCorrectThreshold}%`,
        );

        // We don't pause the timer, but it won't increment until pose is correct again
      }
    }
  };

  // Function to add reference pose image
  const addReferenceImage = (ctx, pose) => {
    // In a real app, you would load actual reference images
    // For this example, we'll just add text guidance
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(width - 150, 10, 140, 140);

    ctx.font = "12px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Reference Pose:", width - 140, 25);

    ctx.font = "14px Arial";
    ctx.fillStyle = "white";

    // Pose-specific guidance
    switch (pose) {
      case "chair":
        ctx.fillText("• Feet together", width - 140, 50);
        ctx.fillText("• Bend knees", width - 140, 70);
        ctx.fillText("• Arms overhead", width - 140, 90);
        ctx.fillText("• Back straight", width - 140, 110);
        break;
      case "cobra":
        ctx.fillText("• Lie on stomach", width - 140, 50);
        ctx.fillText("• Push up with arms", width - 140, 70);
        ctx.fillText("• Arch back", width - 140, 90);
        ctx.fillText("• Legs extended", width - 140, 110);
        break;
      case "downdog":
        ctx.fillText("• Hands & feet on floor", width - 140, 50);
        ctx.fillText("• Hips raised high", width - 140, 70);
        ctx.fillText("• Head down", width - 140, 90);
        ctx.fillText("• Arms & legs straight", width - 140, 110);
        break;
      case "shoulder_stand":
        ctx.fillText("• Lie on back", width - 140, 50);
        ctx.fillText("• Legs straight up", width - 140, 70);
        ctx.fillText("• Support lower back", width - 140, 90);
        ctx.fillText("• Chin to chest", width - 140, 110);
        break;
      case "tree":
        ctx.fillText("• Stand on one leg", width - 140, 50);
        ctx.fillText("• Other foot on inner thigh", width - 140, 70);
        ctx.fillText("• Arms above head", width - 140, 90);
        ctx.fillText("• Keep balance", width - 140, 110);
        break;
      case "plank":
        ctx.fillText("• Body straight & parallel", width - 140, 50);
        ctx.fillText("• Weight on forearms", width - 140, 70);
        ctx.fillText("• Engage core", width - 140, 90);
        ctx.fillText("• Don't drop hips", width - 140, 110);
        break;
      default:
        break;
    }
  };

  // Reset all timers and state when changing pose
  const resetPoseState = () => {
    // Clear all timers
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Reset state
    setTimer(0);
    setIsActive(false);
    setIsCorrectPose(false);
    setAccuracy(0); // Reset accuracy when changing poses

    // Reset best score for the new pose
    bestScoreRef.current = 0;
    setBestScore(0);
  };

  // MediaPipe pose connections
  const POSE_CONNECTIONS = [
    [11, 12], // shoulders
    [11, 13],
    [13, 15], // left arm
    [12, 14],
    [14, 16], // right arm
    [11, 23],
    [12, 24], // torso
    [23, 24], // hips
    [23, 25],
    [25, 27], // left leg
    [24, 26],
    [26, 28], // right leg
  ];

  console.log("Name: ", name);

  return (
    <div className="app-container" style={{ height: "50rem" }}>
      {/* <div className="pose-selection">
        <p>Debug: Current pose is {selectedPose}</p>
          {poseClasses.map((pose) => (
            <button 
              key={pose} 
              onClick={() => handlePoseSelection(pose)}
              className={selectedPose === pose ? 'selected' : ''}
                >
              {pose.charAt(0).toUpperCase() + pose.slice(1)}
            </button>
          ))}
        </div> */}

      {/* Your existing UI elements */}
      <div className="content">
        <div className="video-container">
          <div className="skeleton-view">
            {/* The video MUST have autoPlay, playsInline, and muted to work in modern browsers */}
            <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
            <canvas ref={canvasRef} width="640" height="480" />
            <div className="instruction-overlay">
              <div className="status-message">{messageStatus}</div>

              {isCorrectPose && (
                <div className="success-message">
                  <span className="checkmark">✓</span> Pose achieved!
                </div>
              )}
            </div>

            <div className="accuracy-meter">
              <div className="accuracy-label">
                {selectedPose.replace("_", " ")} Accuracy
              </div>
              <div className="accuracy-circle">
                <svg viewBox="0 0 36 36">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle"
                    strokeDasharray={`${accuracy}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{
                      stroke:
                        accuracy > 70
                          ? "#4CAF50"
                          : accuracy > 40
                            ? "#FFC107"
                            : "#F44336",
                    }}
                  />
                  <text x="18" y="20.35" className="percentage">
                    {accuracy}%
                  </text>
                </svg>
              </div>
            </div>

            {/* Best score display */}
            <div className="best-score">
              <div className="best-score-label">Best Score</div>
              <div className="best-score-value">{formatTime(bestScore)}</div>
            </div>
          </div>

          {/* <div className="camera-view">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width="640"
              height="480"
              style={{ transform: 'scaleX(-1)' }} // Mirror the video
            />
            <div className="timer">
              {formatTime(timer)}/{formatTime(totalTime)}
              {isActive && isCorrectPose && <span className="timer-active"> (Running)</span>}
              {isActive && !isCorrectPose && <span className="timer-paused"> (Paused)</span>}
            </div>
            <div className={`skeleton-status ${isCorrectPose ? 'correct' : 'incorrect'}`}>
            {selectedPose.replace('_', ' ')} Pose: {isCorrectPose ? 'Correct (Green)' : 'Incorrect (Red)'}
            </div>
          </div> */}
        </div>
      </div>

      {/* <div className="instructions">
        <p>Select a yoga pose from the buttons above. Strike the pose and maintain it.</p>
        <p>The accuracy meter shows how close you are to the correct {selectedPose.replace('_', ' ')} pose.</p>
        <p>The timer runs only when your accuracy is above 70%. Your best score is the longest time you've maintained the correct pose.</p>
        {modelLoaded ? (
          <p className="model-status success">TensorFlow model loaded successfully!</p>
        ) : (
          <p className="model-status warning">Using fallback pose detection. Model loading...</p>
        )}
      </div> */}

      {/* Add some CSS for the new elements */}
      {/* <style>{`
        .best-score {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.7);
          padding: 8px;
          border-radius: 4px;
          color: white;
        }
        
        .best-score-label {
          font-size: 12px;
          margin-bottom: 2px;
        }
        
        .best-score-value {
          font-size: 16px;
          font-weight: bold;
        }
        
        .timer-active {
          color: #4CAF50;
        }
        
        .timer-paused {
          color: #F44336;
        }
        
        .skeleton-status {
          position: absolute;
          bottom: 40px;
          left: 10px;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 14px;
          text-transform: capitalize;
        }
        
        .skeleton-status.correct {
          background-color: rgba(0, 255, 0, 0.2);
          border: 1px solid #4CAF50;
          color: white;
        }
        
        .skeleton-status.incorrect {
          background-color: rgba(255, 0, 0, 0.2);
          border: 1px solid #F44336;
          color: white;
        }
        
        .model-status {
          font-weight: bold;
          padding: 5px 10px;
          border-radius: 4px;
          display: inline-block;
        }
        
        .model-status.success {
          background-color: rgba(0, 255, 0, 0.1);
          border: 1px solid #4CAF50;
          color: #4CAF50;
        }
        
        .model-status.warning {
          background-color: rgba(255, 193, 7, 0.1);
          border: 1px solid #FFC107;
          color: #FFC107;
        }
        
        .accuracy-meter .accuracy-label {
          text-transform: capitalize;
        }
        
        .accuracy-circle .circle {
          transition: stroke-dasharray 0.3s ease, stroke 0.3s ease;
        }
        
        .status-message {
          font-size: 18px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }
        
        .success-message {
          background-color: rgba(0, 255, 0, 0.2);
          border: 1px solid #4CAF50;
          padding: 5px 10px;
          border-radius: 4px;
          margin-top: 10px;
          display: inline-block;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        .checkmark {
          color: #4CAF50;
          font-weight: bold;
          margin-right: 5px;
        }
      `}</style> */}
    </div>
  );
}

export default WebCam;

