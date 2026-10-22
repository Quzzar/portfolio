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
import { createTerritorySurface } from "../lib/territory-surface";
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
    const surfaceRef = useRef<ReturnType<typeof createTerritorySurface> | null>(
      null,
    );

    useEffect(
      () => () => {
        battleRef.current?.dispose();
        surfaceRef.current?.dispose();
        document.documentElement.style.removeProperty("--theme-territory-mask");
      },
      [],
    );

    async function toggle(origin?: Point): Promise<void> {
      if (isRunning.current) return;
      const next = theme === "light" ? "dark" : "light";
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
        const battle = createTerritoryBattle(canvas, seed);
        battleRef.current = battle;
        root.style.setProperty("--theme-territory-mask", battle.initialMask);
        const source = button.closest<HTMLElement>("[data-theme]");
        if (!source) throw new Error("Theme page unavailable");
        const surface = createTerritorySurface(source, next);
        surfaceRef.current = surface;
        surface.draw(battle.initialMask);
        const winner = await battle.play((mask) => {
          root.style.setProperty("--theme-territory-mask", mask);
          surface.draw(mask);
        });
        if (winner === 1) flushSync(() => setTheme(next));
      } catch (error) {
        console.error("Theme battle failed.", error);
        setHasBattleError(true);
        flushSync(() => setTheme(theme));
        surfaceRef.current?.dispose();
      } finally {
        battleRef.current?.dispose();
        battleRef.current = null;
        root.style.removeProperty("--theme-territory-mask");
        surfaceRef.current?.dispose();
        surfaceRef.current = null;
        isRunning.current = false;
        setIsChanging(false);
      }
    }

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
