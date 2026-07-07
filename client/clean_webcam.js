const fs = require('fs');

const webcamPath = 'src/Components/WebCam/WebCam.jsx';
let lines = fs.readFileSync(webcamPath, 'utf8').split('\n');

const getRange = (startStr, bracesType = '{}') => {
  const start = lines.findIndex(l => l.includes(startStr));
  if(start === -1) return null;
  let braces = 0;
  let end = -1;
  const open = bracesType[0];
  const close = bracesType[1];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    // using split instead of regex to count safely
    if (line.includes(open)) braces += line.split(open).length - 1;
    if (line.includes(close)) braces -= line.split(close).length - 1;
    if (braces === 0 && (line.includes(close) || line.includes(';'))) { 
      end = i;
      break; 
    }
  }
  return { start, end };
};

const normRange = getRange('const normalizeLandmarks = (landmarks) => {');
const threshRange = getRange('const getThresholdForPose = (pose) => {');
const calcRange = getRange('const calculatePoseAccuracy = (landmarks, targetPose) => {');
const angleRange = getRange('const angleBetween = (A, B, C) => {');
const gateRange = getRange('const geometricGate = (landmarks, targetPose) => {');
const setupRange = getRange('const setupSimplePoseClassifier = () => {');
const classesRange = getRange('const poseClasses = [', '[]');
const connRange = getRange('const POSE_CONNECTIONS = [', '[]');

const rangesToRemove = [
  normRange, threshRange, calcRange, angleRange, gateRange, setupRange, classesRange, connRange
].filter(Boolean).sort((a, b) => b.start - a.start);

let newLines = [...lines];
for (const r of rangesToRemove) {
  newLines.splice(r.start, r.end - r.start + 1);
}

let code = newLines.join('\n');
code = code.replace('import { useParams } from "react-router-dom";', 'import { useParams } from "react-router-dom";\nimport { poseClasses, POSE_CONNECTIONS } from "./utils/PoseConstants";\nimport { angleBetween, geometricGate } from "./utils/PoseGeometry";\nimport { normalizeLandmarks, getThresholdForPose, setupSimplePoseClassifier, calculatePoseAccuracy } from "./utils/PoseClassifier";');

code = code.replace(/setupSimplePoseClassifier\(\);/g, 'poseClassifier.current = setupSimplePoseClassifier();');

const oldCall = `          const result = calculatePoseAccuracy(
            results.poseLandmarks,
            selectedPose,
          );`;
const newCall = 'const result = calculatePoseAccuracy(results.poseLandmarks, selectedPose, tfModel.current, poseClassifier.current);';
code = code.replace(oldCall, newCall);
code = code.replace(/const result = calculatePoseAccuracy\([\s\S]*?selectedPose,[\s\S]*?\);/, newCall);

fs.writeFileSync(webcamPath, code);
