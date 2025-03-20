import React, { useEffect, useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import toast from "react-hot-toast";
import "./WebCam.css"

function WebCam() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedPose, setSelectedPose] = useState('tree');
  const [accuracy, setAccuracy] = useState(0);
  const [isCorrectPose, setIsCorrectPose] = useState(false);
  const [timer, setTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(60); // 1 minute by default
  const [isActive, setIsActive] = useState(false);
  const [messageStatus, setMessageStatus] = useState('Take the correct pose');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [bestScore, setBestScore] = useState(0); // Added to track best score
  const timerIntervalRef = useRef(null); // Reference for the main timer interval
  const bestScoreRef = useRef(0); // Reference to track best score for current pose
  const poseClassifier = useRef(null);
  const tfModel = useRef(null);


  const poseClasses = ['chair', 'cobra', 'downdog', 'shoulder_stand', 'tree', 'plank'];


  const normalizeLandmarks = (landmarks) => {
 
    const normalizedLandmarks = new Array(66).fill(0);
    

    if (!landmarks || landmarks.length === 0) {
      console.warn('No landmarks provided to normalize');
      return normalizedLandmarks;
    }
    
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
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
    

    for (let i = 0; i < landmarks.length && i < 33; i++) {
      if (landmarks[i] && typeof landmarks[i].x === 'number' && typeof landmarks[i].y === 'number') {
        // Normalize coordinates to be centered and scaled
        normalizedLandmarks[i*2] = (landmarks[i].x - minX) / Math.max(0.1, scale);
        normalizedLandmarks[i*2+1] = (landmarks[i].y - minY) / Math.max(0.1, scale);
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
          console.log('Attempting to load TensorFlow model...');
          tfModel.current = await tf.loadLayersModel('https://tejaskasture.github.io/pose-classification-model/model.json');
          
          // Check if model output shape matches our expected classes
          const outputShape = tfModel.current.outputs[0].shape;
          const numClasses = outputShape[outputShape.length - 1];
          
          if (numClasses !== poseClasses.length) {
            console.warn(`Model expects ${numClasses} classes but we defined ${poseClasses.length}. Adjusting...`);
            // Option: Adjust the poseClasses array (add placeholders if needed)
            while (poseClasses.length < numClasses) {
              poseClasses.push(`unknown_class_${poseClasses.length}`);
            }
          }

          // Warm up the model with a dummy prediction
          const dummyInput = tf.zeros([1, 66]);
          const warmupPrediction = tfModel.current.predict(dummyInput);
          warmupPrediction.dispose();
          
          console.log('Model loaded successfully');
          console.log('Model input shape:', tfModel.current.inputs[0].shape);
          console.log('Model output shape:', tfModel.current.outputs[0].shape);
          
          console.log('Model loaded successfully', tfModel.current);
          setModelLoaded(true);
          setMessageStatus('Model loaded. Ready to detect poses.');
        } catch (modelError) {
          console.error('Error loading pose classification model:', modelError);
          console.log('Switching to fallback classifier');
          setMessageStatus('Using simplified pose detection (fallback mode)');
          // Make sure fallback classifier is set up
          setupSimplePoseClassifier();
        }
        
        // Load the MediaPipe pose solution
        const { Pose } = await import('@mediapipe/pose');
        const { Camera } = await import('@mediapipe/camera_utils');
        const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');
        
        // Create a new pose instance
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          }
        });

        // Set up pose options
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // Set up pose detection callback
        pose.onResults((results) => {
          if (!canvasRef.current) return;
          
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // If no pose detected
          if (!results.poseLandmarks) {
            setMessageStatus('No person detected. Please stand in view of camera.');
            setAccuracy(0); // Reset accuracy when no person detected
            return;
          }
          
          console.log('selectedPose', selectedPose);
          
          const result = calculatePoseAccuracy(results.poseLandmarks, selectedPose);
          const isPoseCorrect = result.isCorrect;
          setAccuracy(result.accuracy);
          
          // Set color based on pose correctness
          ctx.strokeStyle = isPoseCorrect ? '#00FF00' : '#FF0000';
          ctx.fillStyle = isPoseCorrect ? '#00FF00' : '#FF0000';
          
          // Draw pose detection output on canvas
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw the video frame on the canvas
          if (videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          }
          
          // Draw connectors
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: isPoseCorrect ? '#00FF00' : '#FF0000',
            lineWidth: 4
          });
          
          // Draw landmarks
          drawLandmarks(ctx, results.poseLandmarks, {
            color: isPoseCorrect ? '#00FF00' : '#FF0000',
            lineWidth: 2
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
            height: 480
          });
          
          camera.start()
            .then(() => {
              setMessageStatus('Camera connected. Stand back to see your full body.');
            })
            .catch(error => {
              console.error('Error starting camera:', error);
              toast.error("Error accessing camera. Please allow camera access.", { duration: 3000 });
            });
        }
        
        // Set up pose classifier fallback (in case model fails)
        setupSimplePoseClassifier();
        
      } catch (error) {
        console.error('Error initializing MediaPipe:', error);
        setMessageStatus('Failed to initialize pose detection. Please refresh the page.');
        toast.error("Failed to initialize pose detection. Please refresh the page.", { duration: 3000 });
      }
    };

    initMediaPipe();

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [modelLoaded, selectedPose]);



  // Get appropriate threshold based on pose difficulty
  const getThresholdForPose = (pose) => {
    switch(pose) {
      case 'tree':
      case 'shoulder_stand':
        return 65; // These are harder poses, so we give a bit more leeway
      case 'plank':
        return 60;// Plank is hard to detect accurately
      default:
        return 70; // Default threshold
    }
  };

  // Improved simple pose classifier setup
  const setupSimplePoseClassifier = () => {
    poseClassifier.current = {
      classify: (landmarks, targetPose) => {
        // Make sure we have valid landmarks
        if (!landmarks || landmarks.length < 33) {
          return { confidence: 0, isCorrect: false };
        }
        
        // Extract key points for easier reference - with safety checks
        const getPoint = (index) => {
          return landmarks[index] || { x: 0, y: 0, z: 0, visibility: 0 };
        };
        
        const leftShoulder = getPoint(11);
        const rightShoulder = getPoint(12);
        const leftHip = getPoint(23);
        const rightHip = getPoint(24);
        const leftKnee = getPoint(25);
        const rightKnee = getPoint(26);
        const leftAnkle = getPoint(27);
        const rightAnkle = getPoint(28);
        const leftElbow = getPoint(13);
        const rightElbow = getPoint(14);
        const leftWrist = getPoint(15);
        const rightWrist = getPoint(16);
        const nose = getPoint(0);
        
        let confidence = 0;
        
        // Calculate confidence for the target pose only
        switch(targetPose) {
          case 'tree':
            // Improved tree pose detection
            const leftFootUp = Math.abs(leftAnkle.y - rightKnee.y) < 0.15;
            const rightFootUp = Math.abs(rightAnkle.y - leftKnee.y) < 0.15;
            const oneFootUp = leftFootUp || rightFootUp;
      
            // Check if arms are raised AND proper position (shoulder width)
            const armsRaised = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
            const armsProperPosition = Math.abs(leftWrist.x - rightWrist.x) < 0.2; // Arms close together
      
            // Check if body is balanced - make this stricter
            const noseX = nose.x;
            const centerHipX = (leftHip.x + rightHip.x) / 2;
            const balance = 1 - Math.min(1, Math.abs(noseX - centerHipX) * 10); // More sensitive
      
            if (oneFootUp && armsRaised && armsProperPosition) {
              // Full tree pose with proper arm position
              confidence = Math.min(100, 50 + balance * 50);
            } else if (oneFootUp && armsRaised) {
              // Tree pose with arms up but not perfect
              confidence = Math.min(100, 40 + balance * 40);
            } else {
              // Partial tree pose
              let partialScore = 0;
              if (oneFootUp) partialScore += 40;
              if (armsRaised) partialScore += 30;
              if (armsProperPosition) partialScore += 10;
              confidence = Math.min(partialScore, 80); // Cap partial at 80
            }
            break;
          // Chair pose functionality
          case 'chair':
            // Check if knees are bent
            const kneesBent = leftKnee.y < leftHip.y && rightKnee.y < rightHip.y;
      
            // Check if arms are raised
            const armsInChair = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
      
            // Calculate knee angle for better scoring
            const leftKneeAngle = Math.max(0, Math.min(1, (leftHip.y - leftKnee.y) / 
                                Math.max(0.1, leftAnkle.y - leftHip.y)));
            const rightKneeAngle = Math.max(0, Math.min(1, (rightHip.y - rightKnee.y) / 
                                Math.max(0.1, rightAnkle.y - rightHip.y)));
            const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
      
            // Calculate arm position score
            const armScore = armsInChair ? 
                            (1 - Math.min(leftWrist.y, rightWrist.y) / 
                            Math.min(leftShoulder.y, rightShoulder.y)) * 30 : 0;
      
            // Check if body is balanced
            const centerX = (leftHip.x + rightHip.x) / 2;
            const balance1 = 1 - Math.min(1, Math.abs(nose.x - centerX) * 10);
      
            if (kneesBent && armsInChair) {
              // Full chair pose with proper arm position
              confidence = Math.min(100, 40 + kneeAngle * 30 + armScore + balance1 * 20);
            } else {
              // Partial chair pose
              let partialScore = 0;
              if (kneesBent) partialScore += 40;
              if (armsInChair) partialScore += 40;
              confidence = Math.min(partialScore, 80); // Cap partial at 80
            }
            break;
          
          case 'cobra':
            // Improved cobra pose detection logic
            const chestUp = leftShoulder.y < leftHip.y && rightShoulder.y < rightHip.y;
            const propsOnForearms = leftElbow.y > leftShoulder.y && rightElbow.y > rightShoulder.y;
            
            if (chestUp && propsOnForearms) {
              // Calculate back arch more accurately
              const spineLength = Math.abs(nose.y - leftShoulder.y);
              const torsoLength = Math.abs(leftShoulder.y - leftHip.y);
              const backArch = Math.min(1.5, spineLength / Math.max(0.1, torsoLength));
              
              confidence = Math.min(100, 50 + backArch * 35);
            } else {
              let partialScore = 0;
              if (chestUp) partialScore += 50;
              if (propsOnForearms) partialScore += 30;
              confidence = partialScore;
            }
            break;
          
          case 'plank':
            // Detect if body is in a horizontal line (plank)
            const bodyIsFlat = Math.abs(leftShoulder.y - leftHip.y) < 0.12 && 
                              Math.abs(rightShoulder.y - rightHip.y) < 0.12 && 
                              Math.abs(leftHip.y - leftAnkle.y) > 0.15 && 
                              Math.abs(rightHip.y - rightAnkle.y) > 0.15;
          
            // Detect if elbows are under shoulders (forearm plank style)
            const forearmPlank = Math.abs(leftElbow.x - leftShoulder.x) < 0.1 && 
                                Math.abs(rightElbow.x - rightShoulder.x) < 0.1 && 
                                leftElbow.y > leftShoulder.y && 
                                rightElbow.y > rightShoulder.y;
          
            // Legs extended back (ankles behind hips)
            const legsBack = leftAnkle.x > leftHip.x && rightAnkle.x > rightHip.x;
          
            // Alignment penalty calculation
            const totalDeviation = Math.abs(leftShoulder.y - leftHip.y) + Math.abs(rightShoulder.y - rightHip.y);
            const alignmentScore = Math.max(0, 1 - totalDeviation * 3);
          
            if (bodyIsFlat && forearmPlank && legsBack) {
              confidence = Math.min(100, 50 + alignmentScore * 50);
            } else {
              let partialScore = 0;
              if (bodyIsFlat) partialScore += 40;
              if (forearmPlank) partialScore += 30;
              if (legsBack) partialScore += 20;
              confidence = Math.min(partialScore, 85); // Cap partial at 85
            }
            break;
          
          // Add cases for other poses as needed
          case 'downdog':
            // Improved downdog detection with better triangular shape detection
            const hipsUp = leftHip.y < leftShoulder.y && rightHip.y < rightShoulder.y;
            const legsDown = leftHip.y < leftAnkle.y && rightHip.y < rightAnkle.y;
            const handsOnGround = leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;
            
            if (hipsUp && legsDown && handsOnGround) {
              // Calculate triangle shape score
              const hipHeight = Math.abs(leftHip.y - leftShoulder.y) / 
                              Math.max(0.1, leftHip.y - leftAnkle.y);
              const triangleShape = Math.min(1, hipHeight);
              
              confidence = Math.min(100, 40 + triangleShape * 60);
            } else {
              let partialScore = 0;
              if (hipsUp) partialScore += 30;
              if (legsDown) partialScore += 30;
              if (handsOnGround) partialScore += 20;
              confidence = partialScore;
            }
            break;
            
          case 'shoulder_stand':
            // Improved shoulder stand detection
            const legsUp = leftAnkle.y < leftHip.y && rightAnkle.y < rightHip.y;
            const hipsOverShoulders = leftHip.y < leftShoulder.y && rightHip.y < rightShoulder.y;
            const backSupported = leftElbow.y > leftShoulder.y && rightElbow.y > rightShoulder.y;
            
            if (legsUp && hipsOverShoulders) {
              // Calculate leg alignment
              const xDiff = Math.abs(leftAnkle.x - rightAnkle.x);
              const legAlignment = Math.max(0, 1 - xDiff * 3);
              
              // Extra points for back support
              const supportScore = backSupported ? 20 : 0;
              
              confidence = Math.min(100, 40 + legAlignment * 40 + supportScore);
            } else {
              let partialScore = 0;
              if (legsUp) partialScore += 40;
              if (hipsOverShoulders) partialScore += 30;
              if (backSupported) partialScore += 20;
              confidence = partialScore;
            }
            break;
            
          default:
            confidence = 0;
            break;
        }
        
        // Log confidence for debugging
        console.log(`Fallback classifier confidence for ${targetPose}: ${confidence}`);
        
        return {
          confidence: confidence,
          isCorrect: confidence > getThresholdForPose(targetPose)
        };
      }
    };
  };

  const calculatePoseAccuracy = (landmarks, targetPose) => {
    // Try to use TensorFlow model first
    console.log('targetPose Outside if', targetPose);
  
    if (tfModel.current && modelLoaded) {
      return tf.tidy(() => {
        // Create tensor from normalized landmarks
        const normalizedData = normalizeLandmarks(landmarks);
        
        // Create a tensor with proper shape [1, 66]
        const inputTensor = tf.tensor2d([normalizedData], [1, 66]);
        
        // Run the model
        const predictions = tfModel.current.predict(inputTensor);
        const predictionArray = predictions.arraySync()[0];
        
        // Get index of target pose
        const targetIndex = poseClasses.indexOf(targetPose);
        if (targetIndex === -1) return { accuracy: 0, isCorrect: false };
        
        // Get confidence for the target pose only
        const confidence = Math.round(predictionArray[targetIndex] * 100);
        console.log('Confidence ', confidence);
        
        // Add debugging logs here
        console.log(`Target pose: ${targetPose}`);
        console.log(`Model confidence: ${confidence}`);
        console.log(`Using model? ${confidence >= 60 ? 'Yes' : 'No'}`);
        console.log(`IsCorrect: ${confidence > getThresholdForPose(targetPose)}`);
        
        // For tree and plank poses, we might need fallback detection
        if ((targetPose === 'tree' || targetPose === 'plank') && confidence < 60) {
          // Use our fallback detection for the new poses
          const fallbackResult = poseClassifier.current.classify(landmarks, targetPose);
          return {
            accuracy: Math.round(fallbackResult.confidence),
            isCorrect: fallbackResult.isCorrect
          };
        }
        
        return {
          accuracy: confidence,
          isCorrect: confidence > getThresholdForPose(targetPose)
        };
      });
    } else {
      // Fall back to simple classifier if model not available
      if (!poseClassifier.current) return { accuracy: 0, isCorrect: false };
      
      const result = poseClassifier.current.classify(landmarks, targetPose);
      
      return {
        accuracy: Math.round(result.confidence),
        isCorrect: result.confidence > 70
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
        setTimer(prev => {
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
            setMessageStatus('Session completed! Your best time: ' + formatTime(bestScoreRef.current));
          }
          return newValue;
        });
      }
    }, 1000);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
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
        setMessageStatus('Perfect! Hold position');
        
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
        setMessageStatus(`Keep trying! Get your ${selectedPose.replace('_', ' ')} pose accuracy above ${isPoseCorrectThreshold}%`);
        
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
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(width - 150, 10, 140, 140);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Reference Pose:', width - 140, 25);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    
    // Pose-specific guidance
    switch(pose) {
      case 'chair':
        ctx.fillText('• Feet together', width - 140, 50);
        ctx.fillText('• Bend knees', width - 140, 70);
        ctx.fillText('• Arms overhead', width - 140, 90);
        ctx.fillText('• Back straight', width - 140, 110);
        break;
      case 'cobra':
        ctx.fillText('• Lie on stomach', width - 140, 50);
        ctx.fillText('• Push up with arms', width - 140, 70);
        ctx.fillText('• Arch back', width - 140, 90);
        ctx.fillText('• Legs extended', width - 140, 110);
        break;
      case 'downdog':
        ctx.fillText('• Hands & feet on floor', width - 140, 50);
        ctx.fillText('• Hips raised high', width - 140, 70);
        ctx.fillText('• Head down', width - 140, 90);
        ctx.fillText('• Arms & legs straight', width - 140, 110);
        break;
      case 'shoulder_stand':
        ctx.fillText('• Lie on back', width - 140, 50);
        ctx.fillText('• Legs straight up', width - 140, 70);
        ctx.fillText('• Support lower back', width - 140, 90);
        ctx.fillText('• Chin to chest', width - 140, 110);
        break;
      case 'tree':
        ctx.fillText('• Stand on one leg', width - 140, 50);
        ctx.fillText('• Other foot on inner thigh', width - 140, 70);
        ctx.fillText('• Arms above head', width - 140, 90);
        ctx.fillText('• Keep balance', width - 140, 110);
        break;
      case 'plank':
        ctx.fillText('• Body straight & parallel', width - 140, 50);
        ctx.fillText('• Weight on forearms', width - 140, 70);
        ctx.fillText('• Engage core', width - 140, 90);
        ctx.fillText('• Don\'t drop hips', width - 140, 110);
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
    [11, 13], [13, 15], // left arm
    [12, 14], [14, 16], // right arm
    [11, 23], [12, 24], // torso
    [23, 24], // hips
    [23, 25], [25, 27], // left leg
    [24, 26], [26, 28]  // right leg
  ];

  return (
    <div className="app-container" style={{height:"50rem"}}>
    
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
        <div className="video-container" style={{display:"none"}}>
          <video ref={videoRef} style={{ display: 'none' }} />
          <canvas ref={canvasRef}/>
          <div className="status-message">{messageStatus}</div>
          <div className="accuracy-display">Accuracy: {accuracy}%</div>
        </div>
      
      <div className="content" >
        <div className="video-container">
          <div className="skeleton-view">
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
              <div className="accuracy-label">{selectedPose.replace('_', ' ')} Accuracy</div>
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
                      stroke: accuracy > 70 ? '#4CAF50' : 
                              accuracy > 40 ? '#FFC107' : '#F44336'
                    }}
                  />
                  <text x="18" y="20.35" className="percentage">{accuracy}%</text>
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

export default WebCam;
