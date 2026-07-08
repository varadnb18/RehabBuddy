# type below to run the model
# python app.py --model pose_classifier_model.joblib --camera 0

import cv2
import mediapipe as mp
import numpy as np
import joblib
import time
import argparse
import os
import pygame

pygame.mixer.init()

class PoseDetector:
    """Real-time pose detection and classification using MediaPipe."""

    def __init__(self, model_path, min_detection_confidence=0.5):
        """Initialize the pose detector with a trained model."""
        self.beep_wave = pygame.mixer.Sound("beep.wav")  # Moved inside __init__
        self.beep_wave.set_volume(1.0)  # Full Volume
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

        self.red_drawing_spec = self.mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2)
        self.green_drawing_spec = self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2)

        # Load the trained classifier
        self.classifier = joblib.load(model_path)

        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=0.5
        )

    def process_frame(self, frame):
        """Process a video frame and return pose estimation results."""
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)
        return results

    def extract_landmarks(self, results, frame_height, frame_width):
        if not results.pose_landmarks:
            return None
        landmarks = []
        for landmark in results.pose_landmarks.landmark:
            x = landmark.x
            y = landmark.y
            visibility = landmark.visibility
            landmarks.extend([x, y, visibility])
        return landmarks

    def classify_pose(self, landmarks):
        if landmarks is None:
            return "No pose detected", 0.0
        landmarks_array = np.array(landmarks).reshape(1, -1)
        prediction = self.classifier.predict(landmarks_array)[0]
        probabilities = self.classifier.predict_proba(landmarks_array)[0]
        confidence = np.max(probabilities)
        return prediction, confidence

    def run_detection(self, camera_id=0, display=True):
        cap = cv2.VideoCapture(camera_id)
        if not cap.isOpened():
            print(f"Error: Could not open camera {camera_id}")
            return

        cv2.namedWindow('MediaPipe Pose Detection', cv2.WND_PROP_FULLSCREEN)
        cv2.setWindowProperty('MediaPipe Pose Detection', cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

        pose_classes = ['chair', 'cobra', 'dog', 'shoulder_stand', 'triangle', 'tree', 'warrior', 'no_pose']
        selected_pose_index = 0
        selected_pose = pose_classes[selected_pose_index]
        correct_pose_detected = False
        timer_start = 0
        hold_time = 3

        red_drawing_spec = self.red_drawing_spec
        green_drawing_spec = self.green_drawing_spec

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                print("Error: Failed to capture video frame.")
                break

            start_time = time.time()
            results = self.process_frame(frame)
            landmarks = self.extract_landmarks(results, frame.shape[0], frame.shape[1])
            pose_class = "No pose detected"
            confidence = 0.0
            drawing_spec = red_drawing_spec
            status_message = "Take the correct pose"

            if landmarks is not None:
                pose_class, confidence = self.classify_pose(landmarks)
                if pose_class == selected_pose and confidence > 0.65:
                    if not correct_pose_detected:
                        correct_pose_detected = True
                        timer_start = time.time()
                        self.beep_wave.play()
                    elapsed_time = time.time() - timer_start
                    remaining_time = max(0, hold_time - elapsed_time)
                    if elapsed_time >= hold_time:
                        drawing_spec = green_drawing_spec
                        status_message = "Perfect! Hold position"
                    else:
                        status_message = f"Hold for {remaining_time:.1f}s"
                else:
                    correct_pose_detected = False

            fps = 1.0 / (time.time() - start_time)

            if display:
                if results.pose_landmarks:
                    self.mp_drawing.draw_landmarks(
                        frame,
                        results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS,
                        landmark_drawing_spec=drawing_spec,
                        connection_drawing_spec=drawing_spec
                    )
                for i, text in enumerate([f"Selected Pose: {selected_pose}",
                                         f"Detected Pose: {pose_class}",
                                         f"Confidence: {confidence:.2f}",
                                         f"FPS: {fps:.2f}",
                                         status_message]):
                    cv2.putText(frame, text, (10, 30 + i * 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
                cv2.imshow('MediaPipe Pose Detection', frame)

                key = cv2.waitKey(1) & 0xFF
                if key == ord('n'):
                    selected_pose_index = (selected_pose_index + 1) % len(pose_classes)
                    selected_pose = pose_classes[selected_pose_index]
                    print(f"Next Pose Selected: {selected_pose}")
                elif key == ord('p'):
                    selected_pose_index = (selected_pose_index - 1) % len(pose_classes)
                    selected_pose = pose_classes[selected_pose_index]
                    print(f"Previous Pose Selected: {selected_pose}")
                elif key in (ord('q'), 27):
                    break

        cap.release()
        cv2.destroyAllWindows()

    def __del__(self):
        if hasattr(self, 'pose'):
            self.pose.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run real-time pose detection and classification')
    parser.add_argument('--model', type=str, default='pose_classifier_model.joblib', help='Path to trained model file')
    parser.add_argument('--camera', type=int, default=0, help='Camera device ID')
    args = parser.parse_args()

    if not os.path.exists(args.model):
        print(f"Error: Trained model file '{args.model}' not found.")
    else:
        print(f"Loading trained model from '{args.model}'.")
        detector = PoseDetector(args.model)
        detector.run_detection(camera_id=args.camera)
