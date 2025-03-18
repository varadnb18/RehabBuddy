import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";

const MODEL_URL = "https://v5-coders-tfjs-models.s3.ap-south-1.amazonaws.com/model.json";

const PoseClassifier = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [detector, setDetector] = useState(null);
  const [pose, setPose] = useState("Detecting...");
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    const loadModel = async () => {
        try {
          console.log("Loading model...");
          const loadedModel = await tf.loadLayersModel(MODEL_URL);
          
          // Manually define input shape (1, 99) since TFJS might not infer it correctly
          const input = tf.input({ shape: [99] }); // Input layer
          const output = loadedModel.apply(input); // Apply model to input
          const newModel = tf.model({ inputs: input, outputs: output }); // Create new model with defined input
      
          setModel(newModel);
          console.log("TFJS Model Loaded Successfully!");
          console.log(newModel.summary());
        } catch (error) {
          console.error("Error loading model:", error);
        }
      };      

    loadModel();
  }, []);

  const processFrame = async () => {
    if (!detector || !model || !webcamRef.current || !webcamRef.current.video) {
      return;
    }

    const video = webcamRef.current.video;
    const poseResult = await detector.estimatePoses(video);

    if (poseResult.length > 0) {
      const landmarks = poseResult[0].keypoints.map((kp) => [
        kp.x / video.videoWidth,
        kp.y / video.videoHeight,
        kp.score,
      ]);

      const flatLandmarks = landmarks.flat();

      // Ensure correct input shape
      if (flatLandmarks.length !== 99) {
        console.error(`Invalid input shape: Expected 99, got ${flatLandmarks.length}`);
        return;
      }

      // Create tensor of shape [1, 99]
      const inputTensor = tf.tensor2d([flatLandmarks], [1, 99]);

      // Get predictions
      const predictions = model.predict(inputTensor);
      const predictionArray = await predictions.array();
      
      // Cleanup tensors to prevent memory leaks
      tf.dispose(inputTensor);
      tf.dispose(predictions);

      const predictedIndex = predictionArray[0].indexOf(
        Math.max(...predictionArray[0])
      );

      const poseClasses = [
        "chair",
        "cobra",
        "dog",
        "shoulder_stand",
        "triangle",
        "tree",
        "warrior",
        "no_pose",
      ];
      setPose(poseClasses[predictedIndex]);
      setConfidence(Math.max(...predictionArray[0]).toFixed(2));

      drawSkeleton(poseResult[0]);
    }
  };

  const drawSkeleton = (pose) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    pose.keypoints.forEach((keypoint) => {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = keypoint.score > 0.5 ? "green" : "red";
      ctx.fill();
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      processFrame();
    }, 100);
    return () => clearInterval(interval);
  }, [detector, model]);

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Pose Detection</h2>
      <Webcam ref={webcamRef} width="640" height="480" />
      <canvas ref={canvasRef} width="640" height="480" style={{ position: "absolute", left: 0, top: 0 }} />
      <h3>Detected Pose: {pose}</h3>
      <h3>Confidence: {confidence}</h3>
    </div>
  );
};

export default PoseClassifier;
