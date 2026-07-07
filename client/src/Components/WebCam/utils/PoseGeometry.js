export   const angleBetween = (A, B, C) => {
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

export   const geometricGate = (landmarks, targetPose) => {
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
      // MUST: one ankle visibly raised (ankle.y < same-side hip.y – some margin)
      //       one leg clearly off the ground – use strict threshold
      case "tree": {
        // In MediaPipe, Y increases downward (0=top, 1=bottom)
        // A raised foot will have a LOWER y value than the standing knee/hip
        const leftFootRaised = leftAnkle.y < rightKnee.y - 0.05; // left ankle clearly above right knee
        const rightFootRaised = rightAnkle.y < leftKnee.y - 0.05; // right ankle clearly above left knee

        if (!leftFootRaised && !rightFootRaised) {
          // No foot is raised — hard gate fails, max 10%
          return 0;
        }

        // Arms raised above shoulders
        const armsUp =
          leftWrist.y < leftShoulder.y - 0.05 &&
          rightWrist.y < rightShoulder.y - 0.05;

        // Balance: nose X close to hip midpoint
        const midHipX = (leftHip.x + rightHip.x) / 2;
        const balanceScore = Math.max(0, 1 - Math.abs(nose.x - midHipX) * 8);

        // Arms joined / close together overhead
        const armsClose = Math.abs(leftWrist.x - rightWrist.x) < 0.25;

        let score = 40; // base for having one foot up
        if (armsUp) score += 30;
        if (armsClose) score += 10;
        score += balanceScore * 20;

        return Math.min(100, score);
      }

      // ── CHAIR POSE ────────────────────────────────────────────────
      // MUST: knee angle < 150° (actually bending, not just standing)
      case "chair": {
        const leftKneeAngleDeg = angleBetween(leftHip, leftKnee, leftAnkle);
        const rightKneeAngleDeg = angleBetween(rightHip, rightKnee, rightAnkle);
        const avgKneeBend = (leftKneeAngleDeg + rightKneeAngleDeg) / 2;

        // Standing straight ~ 170-180°. We need meaningful bend < 155°
        if (avgKneeBend > 158) {
          // Not bending — hard gate fails
          return 0;
        }

        // Arms overhead
        const armsUp =
          leftWrist.y < leftShoulder.y - 0.04 &&
          rightWrist.y < rightShoulder.y - 0.04;

        // Score: the more bent, the better (90° is perfect chair pose)
        const bendScore = Math.max(0, Math.min(1, (158 - avgKneeBend) / 68)); // 0 at 158°, 1 at 90°
        const midHipX = (leftHip.x + rightHip.x) / 2;
        const balanceScore = Math.max(0, 1 - Math.abs(nose.x - midHipX) * 8);

        let score = 30;
        score += bendScore * 40;
        score += (armsUp ? 1 : 0) * 20;
        score += balanceScore * 10;

        return Math.min(100, score);
      }

      // ── PLANK POSE ────────────────────────────────────────────────
      // MUST: body roughly horizontal
      case "plank": {
        const shoulderHipDiffL = Math.abs(leftShoulder.y - leftHip.y);
        const shoulderHipDiffR = Math.abs(rightShoulder.y - rightHip.y);
        
        // Loosened horizontality check significantly (was 0.13, now 0.3)
        const bodyIsHorizontal = shoulderHipDiffL < 0.3 && shoulderHipDiffR < 0.3;
        
        // Loosened side-on check (was 0.2, now 0.05)
        const bodyLength = Math.abs((leftShoulder.x + rightShoulder.x) / 2 - (leftAnkle.x + rightAnkle.x) / 2);
        const isSideOn = bodyLength > 0.05;

        if (!bodyIsHorizontal || !isSideOn) return 0;

        const onForearms = leftElbow.y > leftShoulder.y && rightElbow.y > rightShoulder.y;
        const onHands = leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;
        const hasSupport = onForearms || onHands;

        let score = 50;
        // Base score bumped, penalty for deviation reduced
        const deviation = shoulderHipDiffL + shoulderHipDiffR;
        score += Math.max(0, 30 - deviation * 20); 
        score += hasSupport ? 20 : 0;

        return Math.min(100, score);
      }

      // ── SHOULDER STAND ────────────────────────────────────────────
      case "shoulder_stand": {
        // Just need feet roughly higher than shoulders
        const anklesAboveShoulders = leftAnkle.y < leftShoulder.y + 0.1 || rightAnkle.y < rightShoulder.y + 0.1;

        if (!anklesAboveShoulders) return 0;

        const backSupport = leftElbow.y > leftShoulder.y - 0.1 || rightElbow.y > rightShoulder.y - 0.1;

        let score = 70; // Highly forgiving base score
        score += backSupport ? 30 : 0;

        return Math.min(100, score);
      }

      // ── COBRA POSE ────────────────────────────────────────────────
      case "cobra": {
        // Shoulders should be roughly above or equal to hips
        const chestLifted = leftShoulder.y < leftHip.y + 0.15 || rightShoulder.y < rightHip.y + 0.15;
        const armsPropping = leftElbow.y > leftShoulder.y - 0.1;

        if (!chestLifted) return 0;

        let score = 70; // Highly forgiving base score
        score += armsPropping ? 30 : 0;

        return Math.min(100, score);
      }

      // ── DOWNDOG ───────────────────────────────────────────────────
      // MUST: hips highest point (inverted V shape)
      case "downdog": {
        const hipsUp =
          leftHip.y < leftShoulder.y && rightHip.y < rightShoulder.y;
        const handsDown =
          leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;
        const feetDown = leftAnkle.y > leftHip.y && rightAnkle.y > rightHip.y;

        if (!hipsUp || !handsDown || !feetDown) return 0;

        const hipHeight =
          Math.abs(leftHip.y - leftShoulder.y) /
          Math.max(0.05, Math.abs(leftHip.y - leftAnkle.y));
        const shapeScore = Math.min(1, hipHeight);

        let score = 40;
        score += shapeScore * 60;

        return Math.min(100, score);
      }

      default:
        return 0;
    }
  };