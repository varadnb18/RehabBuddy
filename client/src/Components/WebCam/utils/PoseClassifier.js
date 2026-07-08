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
    tree: 40,
    chair: 38,
    cobra: 35,
    downdog: 35,
    shoulder_stand: 35,
    plank: 35,
  };
  return thresholds[poseName] || 38;
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

  // If the geometric gate returns 0, give a small grace score instead of hard 0
  // This prevents the user from seeing 0% when they are close to the pose
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

  // Use the HIGHER of the two scores as the primary signal,
  // then blend in the lower score as a smaller boost.
  // This prevents one low score from dragging down the other.
  const highScore = Math.max(modelConfidence, geoScore);
  const lowScore = Math.min(modelConfidence, geoScore);
  const blendedAccuracy = Math.round(highScore * 0.75 + lowScore * 0.25);

  const finalAccuracy = Math.max(0, Math.min(100, blendedAccuracy));
  const threshold = getThresholdForPose(targetPose);

  return {
    accuracy: finalAccuracy,
    isCorrect: finalAccuracy > threshold,
  };
}
