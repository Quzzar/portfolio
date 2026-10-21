import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useAtomValue } from "jotai";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { themeAtom } from "../atoms/theme";
import { color, tokens } from "../styles/theme.css";
import * as styles from "../styles/home.css";

type Props = { onClose: () => void };
type Point = { x: number; y: number; born: number };
const CHARACTERS = " .,:;+=xX#@";

/** A text-only wave surface. One text draw per row keeps the canvas inexpensive. */
export function AsciiField({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const theme = useAtomValue(themeAtom);
  const shouldReduceMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    backRef.current?.focus();
    const handleKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let animation = 0;
    let lastFrame = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const ripples: Point[] = [];
    const pointer = { x: width / 2, y: height / 2 };
    const computed = getComputedStyle(canvas);
    const ink = computed.getPropertyValue(color.ink.slice(4, -1)).trim();
    const paper = computed.getPropertyValue(color.paper.slice(4, -1)).trim();
    const fontSize = width < 600 ? 11 : 13;
    const cellWidth = fontSize * 0.6;
    const rowHeight = fontSize * 1.35;
    const isStill = shouldReduceMotion || isPaused;

    function draw(now: number): void {
      if (!context || !canvas) return;
      if (now - lastFrame < 40 && !isStill) {
        animation = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;
      context.fillStyle = paper;
      context.fillRect(0, 0, width, height);
      context.fillStyle = ink;
      context.globalAlpha = 0.58;
      context.font = `${fontSize}px ${tokens.font}`;
      const time = isStill ? 2 : now / 1900;
      const columns = Math.ceil(width / cellWidth);
      const rows = Math.ceil(height / rowHeight);
      for (let row = 0; row < rows; row++) {
        let line = "";
        for (let column = 0; column < columns; column++) {
          const x = column * cellWidth;
          const y = row * rowHeight;
          const distance = Math.hypot(
            (x - pointer.x) / width,
            (y - pointer.y) / height,
          );
          const wave =
            Math.sin(column / 10 + time) * Math.cos(row / 8 - time * 0.7) +
            Math.sin(distance * 17 - time * 2) * 0.65;
          let disturbance = 0;
          for (const ripple of ripples) {
            const age = (now - ripple.born) / 1000;
            const radius = Math.hypot(x - ripple.x, y - ripple.y);
            disturbance +=
              Math.sin(radius / 18 - age * 6) *
              Math.exp(-Math.abs(radius - age * 160) / 75) *
              Math.max(0, 1 - age / 4);
          }
          const edge = Math.min(
            1,
            Math.max(0, (height - Math.abs(y - height / 2) * 1.4) / height),
          );
          const intensity = Math.max(
            0,
            Math.min(0.999, ((wave + disturbance + 1.4) / 4) * edge),
          );
          line += CHARACTERS[Math.floor(intensity * CHARACTERS.length)] ?? " ";
        }
        context.fillText(line, 0, row * rowHeight);
      }
      context.globalAlpha = 1;
      while (ripples[0] && now - ripples[0].born > 4000) ripples.shift();
      if (!isStill && !document.hidden) animation = requestAnimationFrame(draw);
    }
    function resize(): void {
      if (!canvas || !context) return;
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (isStill) draw(performance.now());
    }
    const handlePointer = (event: PointerEvent): void => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (isStill) draw(performance.now());
    };
    const handleDown = (event: PointerEvent): void => {
      ripples.push({
        x: event.clientX,
        y: event.clientY,
        born: performance.now(),
      });
      if (ripples.length > 8) ripples.shift();
      if (isStill) draw(performance.now());
    };
    const handleVisibility = (): void => {
      cancelAnimationFrame(animation);
      if (!document.hidden) draw(performance.now());
    };
    resize();
    draw(performance.now());
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", handlePointer);
    canvas.addEventListener("pointerdown", handleDown);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointer);
      canvas.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [theme, shouldReduceMotion, isPaused]);

  return (
    <main
      className={styles.playScreen}
      aria-label="Interactive ASCII playground"
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Interactive ASCII waves."
        role="img"
      />
      <div className={styles.playTop}>
        <button ref={backRef} onClick={onClose} className={styles.textButton}>
          <ArrowLeft size={16} aria-hidden="true" />
          &nbsp; Back
        </button>
        {!shouldReduceMotion && (
          <button
            className={styles.themeButton}
            aria-label={isPaused ? "Resume waves" : "Pause waves"}
            onClick={() => setIsPaused((value) => !value)}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        )}
      </div>
    </main>
  );
}
