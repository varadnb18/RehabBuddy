import React, { useEffect, useState, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "./WebCam.css";
import { useParams } from "react-router-dom";
import { poseClasses, POSE_CONNECTIONS } from "./utils/PoseConstants";
import {
  calculatePoseAccuracy,
  setupSimplePoseClassifier,
  getThresholdForPose,
} from "./utils/PoseClassifier";
import { usePoseTimer } from "./utils/PoseTimer";
import { addReferenceImage } from "./utils/ReferenceOverlay";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

function WebCam() {
  const { name } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [selectedPose, setSelectedPose] = useState(name);
  const [accuracy, setAccuracy] = useState(0);
  const [isCorrectPose, setIsCorrectPose] = useState(false);
  const [messageStatus, setMessageStatus] = useState("Take the correct pose");
  const [modelLoaded, setModelLoaded] = useState(false);

  const poseClassifier = useRef(null);
  const tfModel = useRef(null);

  const {
    timer,
    totalTime,
    isActive,
    bestScore,
    formatTime,
    startMainTimer,
    resetPoseState,
  } = usePoseTimer(isCorrectPose);

  useEffect(() => {
    if (name && name !== selectedPose) {
      setSelectedPose(name);
      setAccuracy(0);
      setIsCorrectPose(false);
      resetPoseState();
    }
  }, [name, selectedPose, resetPoseState]);

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        await tf.ready();

        try {
          console.log("Attempting to load TensorFlow model...");
          tfModel.current = await tf.loadLayersModel(
            "https://tejaskasture.github.io/pose-classification-model/model.json",
          );

          const outputShape = tfModel.current.outputs[0].shape;
          const numClasses = outputShape[outputShape.length - 1];

          if (numClasses !== poseClasses.length) {
            console.warn(
              `Model expects ${numClasses} classes but we defined ${poseClasses.length}. Adjusting...`,
            );
            while (poseClasses.length < numClasses) {
              poseClasses.push(`unknown_class_${poseClasses.length}`);
            }
          }

          const dummyInput = tf.zeros([1, 66]);
          const warmupPrediction = tfModel.current.predict(dummyInput);
          warmupPrediction.dispose();

          console.log("Model loaded successfully");
          setModelLoaded(true);
          setMessageStatus("Model loaded. Ready to detect poses.");
        } catch (modelError) {
          console.error("Error loading pose classification model:", modelError);
          console.log("Switching to fallback classifier");
          setMessageStatus("Using simplified pose detection (fallback mode)");
          poseClassifier.current = setupSimplePoseClassifier();
        }

        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results) => {
          if (!canvasRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (!results.poseLandmarks) {
            setMessageStatus("No person detected. Please stand in view of camera.");
            setAccuracy(0);
            return;
          }

          const result = calculatePoseAccuracy(
            results.poseLandmarks,
            selectedPose,
            tfModel.current,
            poseClassifier.current
          );
          
          const isPoseCorrectResult = result.isCorrect;
          setAccuracy(result.accuracy);

          ctx.strokeStyle = isPoseCorrectResult ? "#00FF00" : "#FF0000";
          ctx.fillStyle = isPoseCorrectResult ? "#00FF00" : "#FF0000";

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          }

          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: isPoseCorrectResult ? "#00FF00" : "#FF0000",
            lineWidth: 4,
          });

          drawLandmarks(ctx, results.poseLandmarks, {
            color: isPoseCorrectResult ? "#00FF00" : "#FF0000",
            lineWidth: 2,
          });

          handlePoseCorrectness(isPoseCorrectResult, result.accuracy, selectedPose);
          addReferenceImage(ctx, selectedPose);

          ctx.restore();
        });

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
              setMessageStatus("Camera connected. Stand back to see your full body.");
            })
            .catch((error) => {
              console.error("Error starting camera:", error);
              setMessageStatus("Error accessing camera. Please allow camera access.");
            });
        }

        poseClassifier.current = setupSimplePoseClassifier();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        setMessageStatus("Failed to initialize pose detection. Please refresh the page.");
      }
    };

    initMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelLoaded, selectedPose]);

  const handlePoseCorrectness = (isPoseCorrectResult, currentAccuracy, currentPose) => {
    const threshold = getThresholdForPose(currentPose);
    const isPoseCorrectByThreshold = currentAccuracy > threshold;

    if (isPoseCorrectByThreshold) {
      if (!isCorrectPose) {
        setIsCorrectPose(true);
        setMessageStatus("Perfect! Hold position");
        if (!isActive) {
          startMainTimer();
        }
      }
    } else {
      if (isCorrectPose) {
        setIsCorrectPose(false);
        setMessageStatus(
          `Keep trying! Get your ${currentPose.replace("_", " ")} pose accuracy above ${threshold}%`,
        );
      }
    }
  };

  return (
    <div className="app-container" style={{ height: "50rem" }}>
      <div className="content">
        <div className="video-container">
          <div className="skeleton-view">
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

            <div className="best-score">
              <div className="best-score-label">Best Score</div>
              <div className="best-score-value">{formatTime(bestScore)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebCam;
