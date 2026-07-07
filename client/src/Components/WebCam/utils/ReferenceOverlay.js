export function addReferenceImage(ctx, pose) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(width - 150, 10, 140, 140);

  ctx.font = "12px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Reference Pose:", width - 140, 25);

  ctx.font = "14px Arial";
  ctx.fillStyle = "white";

  switch (pose) {
    case "chair":
      ctx.fillText("• Feet together", width - 140, 50);
      ctx.fillText("• Bend knees", width - 140, 70);
      ctx.fillText("• Arms overhead", width - 140, 90);
      ctx.fillText("• Back straight", width - 140, 110);
      break;
    case "cobra":
      ctx.fillText("• Lie on stomach", width - 140, 50);
      ctx.fillText("• Push up with arms", width - 140, 70);
      ctx.fillText("• Arch back", width - 140, 90);
      ctx.fillText("• Legs extended", width - 140, 110);
      break;
    case "downdog":
      ctx.fillText("• Hands & feet on floor", width - 140, 50);
      ctx.fillText("• Hips raised high", width - 140, 70);
      ctx.fillText("• Head down", width - 140, 90);
      ctx.fillText("• Arms & legs straight", width - 140, 110);
      break;
    case "shoulder_stand":
      ctx.fillText("• Lie on back", width - 140, 50);
      ctx.fillText("• Legs straight up", width - 140, 70);
      ctx.fillText("• Support lower back", width - 140, 90);
      ctx.fillText("• Chin to chest", width - 140, 110);
      break;
    case "tree":
      ctx.fillText("• Stand on one leg", width - 140, 50);
      ctx.fillText("• Other foot on inner thigh", width - 140, 70);
      ctx.fillText("• Arms above head", width - 140, 90);
      ctx.fillText("• Keep balance", width - 140, 110);
      break;
    case "plank":
      ctx.fillText("• Body straight & parallel", width - 140, 50);
      ctx.fillText("• Weight on forearms", width - 140, 70);
      ctx.fillText("• Engage core", width - 140, 90);
      ctx.fillText("• Don't drop hips", width - 140, 110);
      break;
    default:
      break;
  }
}
