import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { themeAtom } from "../atoms/theme";
import { AsciiField } from "../components/AsciiField";
import { IdentityWords } from "../components/IdentityWords";
import { Terminal } from "../components/Terminal";
import type { TerminalHandle } from "../components/Terminal";
import * as styles from "../styles/home.css";
import { dark, light, LIGHT_PALETTE, DARK_PALETTE } from "../styles/theme.css";

export function Home() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [hasOutput, setHasOutput] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const terminal = useRef<TerminalHandle>(null);
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
        <main
          className={`${styles.main} ${hasOutput ? styles.expandedMain : ""}`}
        >
          <header>
            <p className={styles.directory}>~/aaron</p>
            <h1 className={styles.name}>Aaron Cassar</h1>
            <IdentityWords isInactive={hasOutput || isPlaying} />
          </header>
          <nav className={styles.navigation} aria-label="Explore">
            {["work", "about", "contact"].map((command) => (
              <button
                className={styles.textButton}
                key={command}
                onClick={() => terminal.current?.execute(command)}
              >
                {command}
              </button>
            ))}
          </nav>
          <Terminal
            ref={terminal}
            onExpanded={setHasOutput}
            onPlay={() => setIsPlaying(true)}
          />
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
              href="https://www.linkedin.com/in/quzzar/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a
              className={styles.socialLink}
              href="/resume/Resume.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Résumé
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
          <button
            className={styles.themeButton}
            aria-label={
              theme === "light" ? "Use dark theme" : "Use light theme"
            }
            onClick={() =>
              setTheme((value) => (value === "light" ? "dark" : "light"))
            }
          >
            {theme === "light" ? (
              <Sun size={22} strokeWidth={1.4} />
            ) : (
              <Moon size={22} strokeWidth={1.4} />
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
