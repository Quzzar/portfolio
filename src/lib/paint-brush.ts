/** Paint a broad diagonal stroke with an irregular, fine-bristled leading edge. */
export function paintBrush(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  pigment: string,
): void {
  const diagonal = Math.hypot(width, height);
  const travel = -100 + progress * (diagonal + 220);
  const bristleWidth = 5;
  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(width, height);
  context.rotate(Math.atan2(-height, -width));
  context.fillStyle = pigment;
  context.beginPath();
  context.moveTo(-diagonal, -diagonal);
  for (let offset = -diagonal; offset < diagonal; offset += bristleWidth) {
    const edge =
      travel + Math.sin(offset * 0.024) * 23 + Math.sin(offset * 0.13) * 8;
    context.lineTo(edge, offset);
  }
  context.lineTo(-diagonal, diagonal);
  context.closePath();
  context.fill();
  // Short translucent tips soften the stroke without seams across its body.
  for (let offset = -diagonal; offset < diagonal; offset += bristleWidth) {
    const edge =
      travel + Math.sin(offset * 0.024) * 23 + Math.sin(offset * 0.13) * 8;
    context.globalAlpha = 0.35;
    context.fillRect(edge, offset + 1, 12 + Math.sin(offset * 0.8) * 8, 1);
  }
  context.restore();
}
