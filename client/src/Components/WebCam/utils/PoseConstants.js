export const poseClasses = [
  "chair",
  "cobra",
  "downdog",
  "shoulder_stand",
  "tree",
  "plank",
];

export const POSE_CONNECTIONS = [
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
