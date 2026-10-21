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
import { createTerritoryBattle } from "../lib/territory-renderer";
import type { Point } from "../lib/territory";
import { tokens } from "../styles/theme.css";
import * as styles from "../styles/home.css";

export type ThemeToggleHandle = { toggle: (origin?: Point) => void };

/** The button and terminal share one territory simulation and one theme update. */
export const ThemeToggle = forwardRef<ThemeToggleHandle>(
  function ThemeToggle(_, ref) {
    const [theme, setTheme] = useAtom(themeAtom);
    const shouldReduceMotion = useReducedMotion();
    const [isChanging, setIsChanging] = useState(false);
    const [hasBattleError, setHasBattleError] = useState(false);
    const battleRef = useRef<Awaited<
      ReturnType<typeof createTerritoryBattle>
    > | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const isRunning = useRef(false);
    const transitionRef = useRef<ViewTransition | null>(null);

    useEffect(
      () => () => {
        battleRef.current?.dispose();
        transitionRef.current?.skipTransition();
        document.documentElement.style.removeProperty("--theme-territory-mask");
      },
      [],
    );

    async function toggle(origin?: Point): Promise<void> {
      if (isRunning.current) return;
      const next = theme === "light" ? "dark" : "light";
      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !document.startViewTransition
      ) {
        setTheme(next);
        return;
      }
      isRunning.current = true;
      setIsChanging(true);
      const root = document.documentElement;
      setHasBattleError(false);
      try {
        const canvas = canvasRef.current;
        const button = buttonRef.current;
        if (!canvas || !button) throw new Error("Battle surface unavailable");
        const bounds = button.getBoundingClientRect();
        const seed = origin ?? {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        };
        canvas.dataset["originX"] = String(seed.x);
        canvas.dataset["originY"] = String(seed.y);
        const battle = createTerritoryBattle(canvas, seed, next);
        battleRef.current = battle;
        root.style.setProperty("--theme-territory-mask", battle.initialMask);
        const transition = document.startViewTransition(() => {
          flushSync(() => setTheme(next));
        });
        transitionRef.current = transition;
        await transition.ready;
        const winner = await battle.play((mask) => {
          root.style.setProperty("--theme-territory-mask", mask);
        });
        if (winner !== 1) flushSync(() => setTheme(theme));
        transition.skipTransition();
        await transition.finished;
      } catch (error) {
        console.error("Theme battle failed.", error);
        setHasBattleError(true);
        flushSync(() => setTheme(theme));
        transitionRef.current?.skipTransition();
      } finally {
        battleRef.current?.dispose();
        battleRef.current = null;
        root.style.removeProperty("--theme-territory-mask");
        transitionRef.current = null;
        isRunning.current = false;
        setIsChanging(false);
      }
    }

    useEffect(() => {
      if (!isChanging) return;
      // Interaction takes priority over watching the battle; cancellation preserves the current theme.
      const interrupt = () => battleRef.current?.dispose();
      const hidden = () => {
        if (document.hidden) interrupt();
      };
      window.addEventListener("keydown", interrupt, true);
      window.addEventListener("pointerdown", interrupt, true);
      window.addEventListener("resize", interrupt);
      document.addEventListener("visibilitychange", hidden);
      return () => {
        window.removeEventListener("keydown", interrupt, true);
        window.removeEventListener("pointerdown", interrupt, true);
        window.removeEventListener("resize", interrupt);
        document.removeEventListener("visibilitychange", hidden);
      };
    }, [isChanging]);

    useImperativeHandle(ref, () => ({ toggle }));

    return (
      <>
        <canvas
          ref={canvasRef}
          className={styles.territoryCanvas}
          aria-hidden="true"
          data-battle={isChanging}
        />
        {hasBattleError && (
          <span role="alert">Battle could not start. Try again.</span>
        )}
        <button
          ref={buttonRef}
          className={styles.themeButton}
          disabled={isChanging}
          data-battling={isChanging}
          aria-label={theme === "light" ? "Use dark theme" : "Use light theme"}
          onClick={() => void toggle()}
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
