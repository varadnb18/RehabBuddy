# InC (Techfiesta) - AI-Powered Yoga Pose Classifier 🧘‍♂️🧘‍♀️

An interactive web application that uses Artificial Intelligence to analyze your yoga poses in real-time through your webcam. Built with React, TensorFlow.js, and MediaPipe, the app acts as a digital yoga instructor, providing live feedback and accuracy scores to help you perfect your form.

## 🌟 Features

- **Real-Time Pose Detection**: Uses your webcam to instantly track body landmarks.
- **Accuracy Scoring**: Compares your posture against a pre-trained TensorFlow model and geometric constraints, giving you a live accuracy score (0-100%).
- **Multiple Poses Supported**: Practice a variety of poses including:
  - Chair Pose
  - Cobra Pose
  - Downward Dog
  - Shoulder Stand
  - Tree Pose
  - Plank Pose
- **Interactive Timer & Best Score Tracking**: The timer only runs when you hold the correct pose (accuracy > threshold). Challenge yourself to beat your longest hold time!
- **Visual Feedback**: The skeleton overlay turns green when you successfully achieve a pose, and red when you need to adjust.
- **Reference Overlays**: Displays on-screen instructions (e.g., "Feet together", "Bend knees") so you know exactly what to fix.
- **Fallback Classification**: A robust geometric fallback system ensures the app works smoothly even if the TensorFlow model takes a moment to load.

## 🛠️ Tech Stack

### Frontend
- **React.js** (Bootstrapped with Create React App / Vite)
- **TensorFlow.js** (`@tensorflow/tfjs`) for running the classification model directly in the browser.
- **Google MediaPipe** (`@mediapipe/pose`) for highly accurate, lightweight human body landmark detection.
- **Chakra UI & Tailwind CSS** for beautiful, responsive styling.
- **Framer Motion** for smooth UI animations.
- **Chart.js & React Chartjs 2** for data visualization.
- **Firebase** for backend services (Auth/Database).

### Backend
- **Python** backend providing API services (`app.py`).

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+ (for backend services)
- A working webcam

### 1. Clone the repository
```bash
git clone https://github.com/varadnb18/Techfiesta.git
cd InC
```

### 2. Setup the Frontend
```bash
cd client
npm install
npm start
```
*The app will launch at `http://localhost:3000`.*

### 3. Setup the Backend (Optional/If required)
```bash
cd server
python -m venv .venv
# Activate the virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt # (if available)
python app.py
```

## 🧠 How it Works

1. **Landmark Detection**: MediaPipe tracks 33 3D landmarks on your body.
2. **Normalization**: The app extracts the landmarks and normalizes them into a format the AI understands.
3. **Classification**: 
   - A custom **TensorFlow Layers Model** predicts which pose you are doing.
   - A **Geometric Gate** acts as a safety net, physically checking joint angles (e.g., verifying your knees are actually bent for Chair Pose).
4. **Scoring**: The results are blended to give you a highly accurate percentage score. If you cross the pose's difficulty threshold, the timer starts ticking!

## 📝 License

This project is open-source and available under the MIT License.
