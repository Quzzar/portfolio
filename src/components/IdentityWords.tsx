import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { Pause, Play } from "lucide-react";
import { tokens } from "../styles/theme.css";
import * as styles from "../styles/home.css";

const WORDS: readonly (readonly string[])[] = [
  ["founder", "builder", "creative"],
  ["engineer", "maker", "adventurer"],
  ["designer", "artist", "explorer"],
];

/** Three independent clipped lines, borrowing Prebreak’s masked phrase transition. */
export function IdentityWords({
  isInactive = false,
}: {
  isInactive?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [indices, setIndices] = useState([0, 0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const isVisible = useInView(container, { amount: 0.8 });

  useEffect(() => {
    if (shouldReduceMotion || isPaused || isInactive || !isVisible) return;
    const timers = WORDS.map((_, column) =>
      window.setInterval(
        () => {
          if (document.hidden) return;
          setIndices((previous) =>
            previous.map((value, index) =>
              index === column ? (value + 1) % 3 : value,
            ),
          );
        },
        tokens.motion.pause + column * tokens.motion.stagger,
      ),
    );
    return () => timers.forEach(window.clearInterval);
  }, [shouldReduceMotion, isPaused, isInactive, isVisible]);

  return (
    <div className={styles.identityWrap}>
      <div className={styles.identities} ref={container}>
        <span className={styles.screenReader}>
          Founder, engineer, designer.
        </span>
        {WORDS.map((words, column) => (
          <div className={styles.wordColumn} key={column} aria-hidden="true">
            <AnimatePresence initial={false}>
              <motion.span
                key={indices[column]}
                className={styles.word}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{
                  duration: tokens.motion.word,
                  ease: tokens.motion.ease,
                }}
              >
                {words[shouldReduceMotion ? 0 : (indices[column] ?? 0)]}.
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>
      {!shouldReduceMotion && (
        <button
          type="button"
          className={styles.pauseWords}
          onClick={() => setIsPaused((value) => !value)}
          aria-pressed={isPaused}
          aria-label={
            isPaused ? "Resume changing words" : "Pause changing words"
          }
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      )}
    </div>
  );
}
