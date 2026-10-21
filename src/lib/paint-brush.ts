/** Replay the downloaded diagonal paint matte as the destination theme's alpha mask. */
export async function createBrushPainting() {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = "/brushes/diagonal-matte.mp4";
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => finish(new Error("Brush video timed out")),
      10000,
    );
    const loaded = () => finish();
    const failed = () => finish(new Error("Brush video could not load"));
    function finish(error?: Error): void {
      clearTimeout(timeout);
      video.removeEventListener("loadeddata", loaded);
      video.removeEventListener("error", failed);
      if (error) reject(error);
      else resolve();
    }
    video.addEventListener("loadeddata", loaded, { once: true });
    video.addEventListener("error", failed, { once: true });
    video.load();
  });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Brush mask canvas unavailable");
  let frame = 0;
  let cancelPlayback: (() => void) | undefined;

  const draw = (): string => {
    context.drawImage(video, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      // Turn recorded white paint into alpha, removing small codec-level black/white noise.
      const value = pixels.data[index] ?? 0;
      pixels.data[index + 3] =
        value < 4 ? 0 : Math.min(255, value * (255 / 250));
    }
    context.putImageData(pixels, 0, 0);
    return `url("${canvas.toDataURL()}")`;
  };

  return {
    initialMask: draw(),
    play(onFrame: (mask: string) => void): Promise<void> {
      return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(
          () => finish(new Error("Brush playback timed out")),
          6000,
        );
        const ended = () => {
          onFrame(draw());
          finish();
        };
        const failed = () => finish(new Error("Brush playback failed"));
        function finish(error?: Error): void {
          clearTimeout(timeout);
          video.cancelVideoFrameCallback(frame);
          video.removeEventListener("ended", ended);
          video.removeEventListener("error", failed);
          cancelPlayback = undefined;
          video.pause();
          if (error) reject(error);
          else resolve();
        }
        const update = () => {
          onFrame(draw());
          frame = video.requestVideoFrameCallback(update);
        };
        cancelPlayback = () => finish();
        video.addEventListener("ended", ended, { once: true });
        video.addEventListener("error", failed, { once: true });
        frame = video.requestVideoFrameCallback(update);
        void video.play().catch(finish);
      });
    },
    dispose(): void {
      cancelPlayback?.();
      video.pause();
      video.removeAttribute("src");
      video.load();
    },
  };
}
