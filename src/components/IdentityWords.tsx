import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { tokens } from "../styles/theme.css";
import * as styles from "../styles/home.css";

const WORDS = [
  "founder",
  "engineer",
  "designer",
  "builder",
  "creative",
  "maker",
  "adventurer",
  "artist",
  "explorer",
] as const;
const INITIAL_WORDS = ["founder", "engineer", "designer"];

/** Three independent clipped lines, borrowing Prebreak’s masked phrase transition. */
export function IdentityWords() {
  const shouldReduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(INITIAL_WORDS);
  const displayedRef = useRef(INITIAL_WORDS);
  const departing = useRef(new Map<string, number>());
  const container = useRef<HTMLDivElement>(null);
  const isVisible = useInView(container, { amount: 0.8 });

  useEffect(() => {
    if (shouldReduceMotion || !isVisible) return;
    const timers: number[] = [];
    const schedule = (column: number): void => {
      timers[column] = window.setTimeout(
        () => {
          if (!document.hidden) {
            const previous = displayedRef.current;
            const now = performance.now();
            const available = WORDS.filter(
              (word) =>
                !previous.includes(word) &&
                (departing.current.get(word) ?? 0) <= now,
            );
            const next =
              available[Math.floor(Math.random() * available.length)];
            const current = previous[column];
            if (next && current) {
              // An outgoing word remains visible briefly; reserve it until its exit ends.
              departing.current.set(
                current,
                now + tokens.motion.word * 1000 + 50,
              );
              const words = previous.map((word, index) =>
                index === column ? next : word,
              );
              displayedRef.current = words;
              setDisplayed(words);
            }
          }
          schedule(column);
        },
        tokens.motion.wordMin +
          Math.random() * (tokens.motion.wordMax - tokens.motion.wordMin),
      );
    };
    INITIAL_WORDS.forEach((_, column) => schedule(column));
    return () => timers.forEach(window.clearTimeout);
  }, [shouldReduceMotion, isVisible]);

  return (
    <div className={styles.identityWrap}>
      <div className={styles.identities} ref={container}>
        <span className={styles.screenReader}>
          Founder, engineer, designer.
        </span>
        {(shouldReduceMotion ? INITIAL_WORDS : displayed).map(
          (word, column) => (
            <div
              className={styles.wordColumn}
              key={column}
              aria-hidden="true"
              data-identity-column={column}
              data-word={word}
            >
              <AnimatePresence initial={false}>
                <motion.span
                  key={word}
                  className={styles.word}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{
                    duration: tokens.motion.word,
                    ease: tokens.motion.ease,
                  }}
                >
                  {word}.
                </motion.span>
              </AnimatePresence>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
