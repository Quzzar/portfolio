import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAtomValue } from "jotai";
import { ArrowUpRight } from "lucide-react";
import { themeAtom } from "../atoms/theme";
import { AsciiField } from "../components/AsciiField";
import { IdentityWords } from "../components/IdentityWords";
import type { TerminalHandle } from "../components/Terminal";
import { ThemeToggle } from "../components/ThemeToggle";
import type { ThemeToggleHandle } from "../components/ThemeToggle";
import * as styles from "../styles/home.css";
import { dark, light, LIGHT_PALETTE, DARK_PALETTE } from "../styles/theme.css";

const Terminal = lazy(() =>
  import("../components/Terminal").then((module) => ({
    default: module.Terminal,
  })),
);

export function Home() {
  const theme = useAtomValue(themeAtom);
  const [isPlaying, setIsPlaying] = useState(false);
  const terminal = useRef<TerminalHandle>(null);
  const themeToggle = useRef<ThemeToggleHandle>(null);
  const closePlay = useCallback(() => {
    setIsPlaying(false);
    requestAnimationFrame(() => terminal.current?.focus());
  }, []);

  useEffect(() => {
    document.documentElement.style.backgroundColor =
      theme === "light" ? LIGHT_PALETTE.paper : DARK_PALETTE.paper;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        theme === "light" ? LIGHT_PALETTE.paper : DARK_PALETTE.paper,
      );
    const handleKey = (event: KeyboardEvent): void => {
      if (
        event.key === "`" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !isPlaying
      ) {
        event.preventDefault();
        terminal.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [theme, isPlaying]);

  return (
    <div
      className={`${styles.page} ${theme === "light" ? light : dark}`}
      data-theme={theme}
    >
      {isPlaying && <AsciiField onClose={closePlay} />}
      <div className={styles.homeContent} hidden={isPlaying}>
        <main className={styles.main}>
          <header>
            <p className={styles.directory}>~/aaron</p>
            <h1 className={styles.name}>Aaron Cassar</h1>
            <IdentityWords />
          </header>
          <Suspense
            fallback={
              <p className={styles.terminal} role="status">
                Opening terminal…
              </p>
            }
          >
            <Terminal
              ref={terminal}
              onPlay={() => setIsPlaying(true)}
              onTheme={(origin) => themeToggle.current?.toggle(origin)}
            />
          </Suspense>
        </main>
        <footer className={styles.footer}>
          <div className={styles.social}>
            <a
              className={styles.socialLink}
              href="https://github.com/Quzzar"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a
              className={styles.socialLink}
              href="/resume/Resume.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Resume
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a
              className={styles.socialLink}
              href="https://www.linkedin.com/in/quzzar/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
          <ThemeToggle ref={themeToggle} />
        </footer>
      </div>
    </div>
  );
}
