const fs = require('fs');
const path = require('path');

const webcamPath = 'src/Components/WebCam/WebCam.jsx';
const utilsDir = 'src/Components/WebCam/utils';

if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir);
}

let lines = fs.readFileSync(webcamPath, 'utf8').split('\n');

const getRange = (startStr) => {
  const start = lines.findIndex(l => l.includes(startStr));
  if (start === -1) return null;
  let braces = 0;
  let end = -1;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('{') || line.includes('[')) braces += (line.match(/\{|\[/g) || []).length;
    if (line.includes('}') || line.includes(']')) braces -= (line.match(/\}|\]/g) || []).length;
    if (braces === 0 && (line.includes('}') || line.includes(']') || line.includes(';'))) { 
      end = i;
      break; 
    }
  }
  return { start, end };
};

const extract = (range) => {
  if (!range) return [];
  return lines.slice(range.start, range.end + 1);
};

const pClasses = getRange('const poseClasses = [');
const pNorm = getRange('const normalizeLandmarks = (landmarks) => {');
const pThresh = getRange('const getThresholdForPose = (pose) => {');
const pAngle = getRange('const angleBetween = (A, B, C) => {');
const pGate = getRange('const geometricGate = (landmarks, targetPose) => {');
const pSetup = getRange('const setupSimplePoseClassifier = () => {');
const pCalc = getRange('const calculatePoseAccuracy = (landmarks, targetPose) => {');
const pConn = getRange('const POSE_CONNECTIONS = [');

// Create PoseConstants.js
const constantsContent = `
export ${extract(pClasses).join('\\n').replace('const poseClasses', 'const poseClasses')}

export ${extract(pConn).join('\\n').replace('const POSE_CONNECTIONS', 'const POSE_CONNECTIONS')}
`;
fs.writeFileSync(path.join(utilsDir, 'PoseConstants.js'), constantsContent.trim());

// Create PoseGeometry.js
const geometryContent = `
export ${extract(pAngle).join('\\n').replace('const angleBetween', 'const angleBetween').trim()}

export ${extract(pGate).join('\\n').replace('const geometricGate', 'const geometricGate').trim()}
`;
fs.writeFileSync(path.join(utilsDir, 'PoseGeometry.js'), geometryContent.trim());

// Create PoseClassifier.js
let calcFunc = extract(pCalc).join('\\n').replace('const calculatePoseAccuracy = (landmarks, targetPose) => {', 'export const calculatePoseAccuracy = (landmarks, targetPose, tfModelCurrent, poseClassifierCurrent) => {');
calcFunc = calcFunc.replace(/tfModel\.current/g, 'tfModelCurrent');
calcFunc = calcFunc.replace(/poseClassifier\.current/g, 'poseClassifierCurrent');

const setupFunc = \`
export const setupSimplePoseClassifier = () => {
  return {
    classify: (landmarks, targetPose) => {
      const score = geometricGate(landmarks, targetPose);
      return {
        confidence: score,
        isCorrect: score > getThresholdForPose(targetPose),
      };
    },
  };
};
\`;

const classifierContent = \`
import * as tf from "@tensorflow/tfjs";
import { geometricGate } from "./PoseGeometry";
import { poseClasses } from "./PoseConstants";

export \${extract(pNorm).join('\\n').replace('const normalizeLandmarks', 'const normalizeLandmarks').trim()}

export \${extract(pThresh).join('\\n').replace('const getThresholdForPose', 'const getThresholdForPose').trim()}

\${setupFunc.trim()}

\${calcFunc.trim()}
\`;
fs.writeFileSync(path.join(utilsDir, 'PoseClassifier.js'), classifierContent.trim());

// Now remove all these ranges from WebCam.jsx
const rangesToRemove = [pClasses, pNorm, pThresh, pAngle, pGate, pSetup, pCalc, pConn].filter(Boolean).sort((a, b) => b.start - a.start);

let newLines = [...lines];
for (const r of rangesToRemove) {
  newLines.splice(r.start, r.end - r.start + 1);
}

let webcamCode = newLines.join('\\n');
webcamCode = webcamCode.replace('import { useParams } from "react-router-dom";', 'import { useParams } from "react-router-dom";\\nimport { poseClasses, POSE_CONNECTIONS } from "./utils/PoseConstants";\\nimport { normalizeLandmarks, getThresholdForPose, setupSimplePoseClassifier, calculatePoseAccuracy } from "./utils/PoseClassifier";');

// Fix calls
webcamCode = webcamCode.replace('setupSimplePoseClassifier();', 'poseClassifier.current = setupSimplePoseClassifier();');
webcamCode = webcamCode.replace('const result = calculatePoseAccuracy(', 'const result = calculatePoseAccuracy(\\n            results.poseLandmarks,\\n            selectedPose,\\n            tfModel.current,\\n            poseClassifier.current\\n          );\\n          /*');
webcamCode = webcamCode.replace('            results.poseLandmarks,\\n            selectedPose,\\n          );', '*/');

fs.writeFileSync(webcamPath, webcamCode);
