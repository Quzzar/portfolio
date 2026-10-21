import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { useAtom } from "jotai";
import { motion, useReducedMotion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { themeAtom } from "../atoms/theme";
import { paintBrush } from "../lib/paint-brush";
import { DARK_PALETTE, LIGHT_PALETTE, tokens } from "../styles/theme.css";
import * as styles from "../styles/home.css";

export type ThemeToggleHandle = { toggle: () => void };

/** The button and terminal share one brush transition and one theme update. */
export const ThemeToggle = forwardRef<ThemeToggleHandle>(
  function ThemeToggle(_, ref) {
    const [theme, setTheme] = useAtom(themeAtom);
    const shouldReduceMotion = useReducedMotion();
    const [isChanging, setIsChanging] = useState(false);
    const [error, setError] = useState("");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frame = useRef(0);
    const isRunning = useRef(false);

    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    function toggle(): void {
      if (isRunning.current) return;
      const next = theme === "light" ? "dark" : "light";
      if (shouldReduceMotion) {
        setTheme(next);
        return;
      }
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        console.error("Theme brush could not initialize its canvas.");
        setError("The theme transition could not start.");
        return;
      }
      setError("");
      isRunning.current = true;
      setIsChanging(true);
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.opacity = "1";
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const pigment =
        next === "light" ? LIGHT_PALETTE.paper : DARK_PALETTE.paper;
      const started = performance.now();
      let hasCommitted = false;

      function draw(now: number): void {
        if (!canvas || !context) return;
        const elapsed = now - started;
        const progress = Math.min(1, elapsed / tokens.motion.brush);
        // A restrained acceleration/deceleration makes the stroke feel hand-driven.
        const eased = progress * progress * (3 - 2 * progress);
        paintBrush(context, width, height, eased, pigment);
        if (progress === 1 && !hasCommitted) {
          hasCommitted = true;
          flushSync(() => setTheme(next));
        }
        if (hasCommitted) {
          canvas.style.opacity = String(
            Math.max(
              0,
              1 - (elapsed - tokens.motion.brush) / tokens.motion.brushReveal,
            ),
          );
        }
        if (elapsed < tokens.motion.brush + tokens.motion.brushReveal)
          frame.current = requestAnimationFrame(draw);
        else {
          context.clearRect(0, 0, width, height);
          isRunning.current = false;
          setIsChanging(false);
        }
      }
      frame.current = requestAnimationFrame(draw);
    }

    useImperativeHandle(ref, () => ({ toggle }));

    return (
      <>
        <canvas
          ref={canvasRef}
          className={styles.themeBrush}
          hidden={!isChanging}
          aria-hidden="true"
        />
        <button
          className={styles.themeButton}
          disabled={isChanging}
          aria-label={theme === "light" ? "Use dark theme" : "Use light theme"}
          onClick={toggle}
        >
          <motion.span
            className={styles.themeIcon}
            initial={false}
            animate={{
              rotate: isChanging && !shouldReduceMotion ? 180 : 0,
              scale: isChanging && !shouldReduceMotion ? 0.75 : 1,
            }}
            transition={{
              duration: tokens.motion.word,
              ease: tokens.motion.ease,
            }}
          >
            {theme === "light" ? (
              <Sun size={22} strokeWidth={1.4} />
            ) : (
              <Moon size={22} strokeWidth={1.4} />
            )}
          </motion.span>
        </button>
        {error && (
          <span role="alert" className={styles.screenReader}>
            {error}
          </span>
        )}
      </>
    );
  },
);
