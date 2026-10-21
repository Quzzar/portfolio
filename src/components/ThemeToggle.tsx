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
import { brushMask, createBrushStrokes } from "../lib/paint-brush";
import { tokens } from "../styles/theme.css";
import * as styles from "../styles/home.css";

export type ThemeToggleHandle = { toggle: () => void };

/** The button and terminal share one brush transition and one theme update. */
export const ThemeToggle = forwardRef<ThemeToggleHandle>(
  function ThemeToggle(_, ref) {
    const [theme, setTheme] = useAtom(themeAtom);
    const shouldReduceMotion = useReducedMotion();
    const [isChanging, setIsChanging] = useState(false);
    const frame = useRef(0);
    const isRunning = useRef(false);
    const transitionRef = useRef<ViewTransition | null>(null);

    useEffect(
      () => () => {
        cancelAnimationFrame(frame.current);
        transitionRef.current?.skipTransition();
        document.documentElement.style.removeProperty("--theme-brush-mask");
      },
      [],
    );

    async function toggle(): Promise<void> {
      if (isRunning.current) return;
      const next = theme === "light" ? "dark" : "light";
      if (shouldReduceMotion || !document.startViewTransition) {
        setTheme(next);
        return;
      }
      isRunning.current = true;
      setIsChanging(true);
      const root = document.documentElement;
      const painting = createBrushStrokes(
        window.innerWidth,
        window.innerHeight,
      );
      root.style.setProperty("--theme-brush-mask", brushMask(painting, 0));
      const transition = document.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });
      transitionRef.current = transition;
      try {
        await transition.ready;
        const started = performance.now();
        function draw(now: number): void {
          const progress = Math.min(1, (now - started) / tokens.motion.brush);
          root.style.setProperty(
            "--theme-brush-mask",
            brushMask(painting, progress),
          );
          if (progress < 1) frame.current = requestAnimationFrame(draw);
          else transition.skipTransition();
        }
        frame.current = requestAnimationFrame(draw);
        await transition.finished;
      } catch (error) {
        // Hidden documents can skip snapshot capture; the theme update still completes.
        console.info("Theme painting skipped by the browser.", error);
        transition.skipTransition();
      } finally {
        cancelAnimationFrame(frame.current);
        root.style.removeProperty("--theme-brush-mask");
        transitionRef.current = null;
        isRunning.current = false;
        setIsChanging(false);
      }
    }

    useImperativeHandle(ref, () => ({ toggle }));

    return (
      <>
        <button
          className={styles.themeButton}
          disabled={isChanging}
          data-painting={isChanging}
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
      </>
    );
  },
);
