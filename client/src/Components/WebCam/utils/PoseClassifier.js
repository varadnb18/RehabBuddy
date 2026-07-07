import * as tf from "@tensorflow/tfjs";
import { poseClasses } from "./PoseConstants";
import { geometricGate } from "./PoseGeometry";

export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 33) return null;

  const coords = [];
  for (let i = 0; i < 33; i++) {
    const lm = landmarks[i] || { x: 0, y: 0 };
    coords.push(lm.x, lm.y);
  }
  return coords;
}

export function getThresholdForPose(poseName) {
  const thresholds = {
    tree: 45,
    chair: 55,
    cobra: 50,
    downdog: 50,
    shoulder_stand: 45,
    plank: 45,
  };
  return thresholds[poseName] || 50;
}

export function setupSimplePoseClassifier() {
  return {
    classify: (landmarks, targetPose) => {
      const geoScore = geometricGate(landmarks, targetPose);
      return {
        pose: targetPose,
        confidence: geoScore / 100,
        accuracy: geoScore,
      };
    },
  };
}

export function calculatePoseAccuracy(
  landmarks,
  targetPose,
  tfModel,
  fallbackClassifier,
) {
  if (!landmarks || landmarks.length < 33) {
    return { accuracy: 0, isCorrect: false };
  }

  const geoScore = geometricGate(landmarks, targetPose);

  if (geoScore === 0) {
    return { accuracy: 0, isCorrect: false };
  }

  let modelConfidence = 0;

  if (tfModel) {
    try {
      const normalized = normalizeLandmarks(landmarks);
      if (normalized) {
        const inputTensor = tf.tensor2d([normalized], [1, 66]);
        const prediction = tfModel.predict(inputTensor);
        const probabilities = prediction.dataSync();

        const poseIndex = poseClasses.indexOf(targetPose);
        if (poseIndex !== -1 && poseIndex < probabilities.length) {
          modelConfidence = probabilities[poseIndex] * 100;
        }

        inputTensor.dispose();
        prediction.dispose();
      }
    } catch (err) {
      console.warn("TF model prediction failed, using fallback:", err.message);
      if (fallbackClassifier) {
        const result = fallbackClassifier.classify(landmarks, targetPose);
        modelConfidence = result.accuracy;
      }
    }
  } else if (fallbackClassifier) {
    const result = fallbackClassifier.classify(landmarks, targetPose);
    modelConfidence = result.accuracy;
  }

  const blendedAccuracy = Math.round(modelConfidence * 0.6 + geoScore * 0.4);
  const finalAccuracy = Math.max(0, Math.min(100, blendedAccuracy));
  const threshold = getThresholdForPose(targetPose);

  return {
    accuracy: finalAccuracy,
    isCorrect: finalAccuracy > threshold,
  };
}
