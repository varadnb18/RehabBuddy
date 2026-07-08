export const angleBetween = (A, B, C) => {
    const BA = { x: A.x - B.x, y: A.y - B.y };
    const BC = { x: C.x - B.x, y: C.y - B.y };
    const dot = BA.x * BC.x + BA.y * BC.y;
    const magBA = Math.sqrt(BA.x * BA.x + BA.y * BA.y);
    const magBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y);
    if (magBA < 1e-6 || magBC < 1e-6) return 180;
    return (
      Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC)))) *
      (180 / Math.PI)
    );
  };

export const geometricGate = (landmarks, targetPose) => {
    if (!landmarks || landmarks.length < 33) return 0;

    const gp = (i) => landmarks[i] || { x: 0, y: 0, z: 0, visibility: 0 };

    const nose = gp(0);
    const leftShoulder = gp(11);
    const rightShoulder = gp(12);
    const leftElbow = gp(13);
    const rightElbow = gp(14);
    const leftWrist = gp(15);
    const rightWrist = gp(16);
    const leftHip = gp(23);
    const rightHip = gp(24);
    const leftKnee = gp(25);
    const rightKnee = gp(26);
    const leftAnkle = gp(27);
    const rightAnkle = gp(28);
    const leftHeel = gp(29);
    const rightHeel = gp(30);
    const leftFootIdx = gp(31);
    const rightFootIdx = gp(32);

    switch (targetPose) {
      // ── TREE POSE ──────────────────────────────────────────────────
      case "tree": {
        // A raised foot will have a LOWER y value than the standing knee
        const leftFootRaised = leftAnkle.y < rightKnee.y + 0.02;
        const rightFootRaised = rightAnkle.y < leftKnee.y + 0.02;

        if (!leftFootRaised && !rightFootRaised) {
          return 0;
        }

        // How high is the raised foot? Higher = better
        const raisedHeight = leftFootRaised
          ? (rightKnee.y - leftAnkle.y)
          : (leftKnee.y - rightAnkle.y);
        const heightScore = Math.max(0, Math.min(1, raisedHeight * 5));

        // Arms raised above shoulders
        const leftArmUp = leftWrist.y < leftShoulder.y;
        const rightArmUp = rightWrist.y < rightShoulder.y;
        const armsUp = leftArmUp && rightArmUp;
        const oneArmUp = leftArmUp || rightArmUp;

        // Balance: nose X close to hip midpoint
        const midHipX = (leftHip.x + rightHip.x) / 2;
        const balanceScore = Math.max(0, 1 - Math.abs(nose.x - midHipX) * 5);

        // Arms joined / close together overhead
        const armsClose = Math.abs(leftWrist.x - rightWrist.x) < 0.3;

        let score = 45; // base for having one foot up
        score += heightScore * 15;
        if (armsUp) score += 25;
        else if (oneArmUp) score += 15;
        if (armsClose && armsUp) score += 5;
        score += balanceScore * 10;

        return Math.min(100, Math.round(score));
      }

      // ── CHAIR POSE ────────────────────────────────────────────────
      case "chair": {
        const leftKneeAngleDeg = angleBetween(leftHip, leftKnee, leftAnkle);
        const rightKneeAngleDeg = angleBetween(rightHip, rightKnee, rightAnkle);
        const avgKneeBend = (leftKneeAngleDeg + rightKneeAngleDeg) / 2;

        // Standing straight ~ 170-180. Need some bend < 170
        if (avgKneeBend > 172) {
          return 0;
        }

        // Arms overhead
        const leftArmUp = leftWrist.y < leftShoulder.y;
        const rightArmUp = rightWrist.y < rightShoulder.y;
        const armsUp = leftArmUp && rightArmUp;
        const oneArmUp = leftArmUp || rightArmUp;

        // Score: the more bent, the better (90 is perfect chair pose)
        // Range: 172 -> 0 score, 90 -> max score
        const bendScore = Math.max(0, Math.min(1, (172 - avgKneeBend) / 82));

        // Torso upright check (shoulders above hips)
        const torsoUpright = (leftShoulder.y < leftHip.y) && (rightShoulder.y < rightHip.y);

        const midHipX = (leftHip.x + rightHip.x) / 2;
        const balanceScore = Math.max(0, 1 - Math.abs(nose.x - midHipX) * 5);

        let score = 40; // base for bending knees
        score += bendScore * 30;
        if (armsUp) score += 15;
        else if (oneArmUp) score += 8;
        if (torsoUpright) score += 5;
        score += balanceScore * 10;

        return Math.min(100, Math.round(score));
      }

      // ── PLANK POSE ────────────────────────────────────────────────
      case "plank": {
        const shoulderHipDiffL = Math.abs(leftShoulder.y - leftHip.y);
        const shoulderHipDiffR = Math.abs(rightShoulder.y - rightHip.y);
        const avgShoulderHipDiff = (shoulderHipDiffL + shoulderHipDiffR) / 2;
        
        // Body should be somewhat horizontal (very forgiving)
        const bodyIsHorizontal = avgShoulderHipDiff < 0.45;
        
        // Body should have some length on screen
        const bodyLength = Math.abs((leftShoulder.x + rightShoulder.x) / 2 - (leftAnkle.x + rightAnkle.x) / 2);
        const isSideOn = bodyLength > 0.01;

        if (!bodyIsHorizontal || !isSideOn) return 0;

        // Support: arms below shoulders
        const onForearms = leftElbow.y > leftShoulder.y - 0.05 && rightElbow.y > rightShoulder.y - 0.05;
        const onHands = leftWrist.y > leftShoulder.y - 0.05 && rightWrist.y > rightShoulder.y - 0.05;
        const hasSupport = onForearms || onHands;

        // Hip alignment (hips shouldn't sag or pike too much)
        const hipAngleL = angleBetween(leftShoulder, leftHip, leftAnkle);
        const hipAngleR = angleBetween(rightShoulder, rightHip, rightAnkle);
        const avgHipAngle = (hipAngleL + hipAngleR) / 2;
        // Perfect plank = ~180 degrees straight line
        const straightnessScore = Math.max(0, Math.min(1, 1 - Math.abs(180 - avgHipAngle) / 90));

        let score = 50; // base for being horizontal
        score += straightnessScore * 20;
        score += hasSupport ? 20 : 0;
        // Bonus for flatness
        const flatnessScore = Math.max(0, 1 - avgShoulderHipDiff * 3);
        score += flatnessScore * 10;

        return Math.min(100, Math.round(score));
      }

      // ── SHOULDER STAND ────────────────────────────────────────────
      case "shoulder_stand": {
        // Feet should be roughly higher than hips (very forgiving)
        const anklesAboveHips = leftAnkle.y < leftHip.y + 0.15 || rightAnkle.y < rightHip.y + 0.15;
        // Or at least ankles near shoulder level
        const anklesNearShoulders = leftAnkle.y < leftShoulder.y + 0.35 || rightAnkle.y < rightShoulder.y + 0.35;

        if (!anklesAboveHips && !anklesNearShoulders) return 0;

        // How vertical are the legs? (ankles above hips = good)
        const legVerticality = Math.max(0,
          Math.max(leftHip.y - leftAnkle.y, rightHip.y - rightAnkle.y)
        );
        const verticalScore = Math.min(1, legVerticality * 4);

        // Back support (elbows near or below shoulders)
        const backSupport = leftElbow.y > leftShoulder.y - 0.15 || rightElbow.y > rightShoulder.y - 0.15;

        // Legs relatively straight
        const leftLegAngle = angleBetween(leftHip, leftKnee, leftAnkle);
        const rightLegAngle = angleBetween(rightHip, rightKnee, rightAnkle);
        const legsStraight = (leftLegAngle + rightLegAngle) / 2 > 140;

        let score = 50; // base for getting inverted
        score += verticalScore * 20;
        score += backSupport ? 15 : 0;
        score += legsStraight ? 15 : 5;

        return Math.min(100, Math.round(score));
      }

      // ── COBRA POSE ────────────────────────────────────────────────
      case "cobra": {
        // Shoulders should be roughly above or near hips (very forgiving)
        const chestLifted = leftShoulder.y < leftHip.y + 0.35 || rightShoulder.y < rightHip.y + 0.35;

        if (!chestLifted) return 0;

        // How much is the chest lifted above hips
        const liftAmount = Math.max(
          leftHip.y - leftShoulder.y,
          rightHip.y - rightShoulder.y
        );
        const liftScore = Math.max(0, Math.min(1, liftAmount * 4));

        // Arms propping (elbows near or below shoulders)
        const armsPropping = leftElbow.y > leftShoulder.y - 0.15 || rightElbow.y > rightShoulder.y - 0.15;

        // Hips should be on/near the ground (hips below or near knees)
        const hipsLow = leftHip.y > leftKnee.y - 0.2 || rightHip.y > rightKnee.y - 0.2;

        // Back arch: spine extension (shoulder-hip-ankle angle)
        const spineAngleL = angleBetween(leftShoulder, leftHip, leftAnkle);
        const spineAngleR = angleBetween(rightShoulder, rightHip, rightAnkle);
        const avgSpineAngle = (spineAngleL + spineAngleR) / 2;
        // Good cobra has a noticeable arch (angle < 160)
        const archScore = Math.max(0, Math.min(1, (180 - avgSpineAngle) / 60));

        let score = 45; // base for chest being lifted
        score += liftScore * 20;
        score += armsPropping ? 15 : 0;
        score += hipsLow ? 5 : 0;
        score += archScore * 15;

        return Math.min(100, Math.round(score));
      }

      // ── DOWNDOG ───────────────────────────────────────────────────
      case "downdog": {
        // Hips should be the highest point (inverted V shape)
        // Very forgiving: hips just need to be near or above shoulders
        const avgHipY = (leftHip.y + rightHip.y) / 2;
        const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
        const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
        const avgWristY = (leftWrist.y + rightWrist.y) / 2;

        const hipsUp = avgHipY < avgShoulderY + 0.15;
        const handsDown = avgWristY > avgShoulderY - 0.15;
        const feetDown = avgAnkleY > avgHipY - 0.15;

        if (!hipsUp || !handsDown || !feetDown) return 0;

        // V-shape score: how high are hips relative to hands and feet
        const hipElevation = Math.max(0,
          ((avgShoulderY - avgHipY) + (avgAnkleY - avgHipY)) / 2
        );
        const vShapeScore = Math.min(1, hipElevation * 5);

        // Arm straightness
        const leftArmAngle = angleBetween(leftShoulder, leftElbow, leftWrist);
        const rightArmAngle = angleBetween(rightShoulder, rightElbow, rightWrist);
        const armsStraight = (leftArmAngle + rightArmAngle) / 2 > 150;

        // Leg straightness
        const leftLegAngle = angleBetween(leftHip, leftKnee, leftAnkle);
        const rightLegAngle = angleBetween(rightHip, rightKnee, rightAnkle);
        const legsStraight = (leftLegAngle + rightLegAngle) / 2 > 150;

        let score = 45; // base for being in V shape
        score += vShapeScore * 25;
        score += armsStraight ? 15 : 5;
        score += legsStraight ? 15 : 5;

        return Math.min(100, Math.round(score));
      }

      default:
        return 0;
    }
  };