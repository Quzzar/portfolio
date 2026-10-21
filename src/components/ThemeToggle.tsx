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
import { createBrushPainting } from "../lib/paint-brush";
import { tokens } from "../styles/theme.css";
import * as styles from "../styles/home.css";

export type ThemeToggleHandle = { toggle: () => void };

/** The button and terminal share one brush transition and one theme update. */
export const ThemeToggle = forwardRef<ThemeToggleHandle>(
  function ThemeToggle(_, ref) {
    const [theme, setTheme] = useAtom(themeAtom);
    const shouldReduceMotion = useReducedMotion();
    const [isChanging, setIsChanging] = useState(false);
    const [hasBrushError, setHasBrushError] = useState(false);
    const paintingRef = useRef<Awaited<
      ReturnType<typeof createBrushPainting>
    > | null>(null);
    const isRunning = useRef(false);
    const transitionRef = useRef<ViewTransition | null>(null);

    useEffect(
      () => () => {
        paintingRef.current?.dispose();
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
      setHasBrushError(false);
      try {
        const painting = await createBrushPainting();
        paintingRef.current = painting;
        root.style.setProperty("--theme-brush-mask", painting.initialMask);
        const transition = document.startViewTransition(() => {
          flushSync(() => setTheme(next));
        });
        transitionRef.current = transition;
        await transition.ready;
        await painting.play((mask) => {
          root.style.setProperty("--theme-brush-mask", mask);
        });
        transition.skipTransition();
        await transition.finished;
      } catch (error) {
        console.error("Theme painting failed.", error);
        if (!transitionRef.current) setHasBrushError(true);
        transitionRef.current?.skipTransition();
      } finally {
        paintingRef.current?.dispose();
        paintingRef.current = null;
        root.style.removeProperty("--theme-brush-mask");
        transitionRef.current = null;
        isRunning.current = false;
        setIsChanging(false);
      }
    }

    useImperativeHandle(ref, () => ({ toggle }));

    return (
      <>
        {hasBrushError && (
          <span role="alert">Brush could not load. Try again.</span>
        )}
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
