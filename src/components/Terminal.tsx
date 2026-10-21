import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Terminal as Xterm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { LocalEchoAddon } from "@gytx/xterm-local-echo";
import { useAtomValue } from "jotai";
import { themeAtom } from "../atoms/theme";
import { COMMANDS, resolveCommand } from "../lib/commands";
import { terminalResponse } from "../lib/terminal-responses";
import { DARK_PALETTE, LIGHT_PALETTE, tokens } from "../styles/theme.css";
import * as styles from "../styles/home.css";
import "@xterm/xterm/css/xterm.css";

export type TerminalHandle = { focus: () => void };
type Props = {
  onExpanded: (expanded: boolean) => void;
  onPlay: () => void;
  onTheme: () => void;
};
const PROMPT = "visitor@aaron ~ % ";

/** A VT terminal emulator and local shell controller, with a site command vocabulary. */
export const Terminal = forwardRef<TerminalHandle, Props>(
  function Terminal(props, ref) {
    const host = useRef<HTMLDivElement>(null);
    const terminal = useRef<Xterm | null>(null);
    const callbacks = useRef(props);
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState("");
    const theme = useAtomValue(themeAtom);
    const palette = theme === "light" ? LIGHT_PALETTE : DARK_PALETTE;
    useEffect(() => {
      callbacks.current = props;
    });
    useImperativeHandle(ref, () => ({
      focus: () => terminal.current?.focus(),
    }));

    useEffect(() => {
      const element = host.current;
      if (!element) return;
      let disposed = false;
      const term = new Xterm({
        fontFamily: tokens.font,
        fontSize: window.innerWidth <= 520 ? 15 : 18,
        lineHeight: 1.3,
        cursorStyle: "block",
        cursorInactiveStyle: "block",
        cursorBlink: false,
        scrollback: 1000,
        screenReaderMode: true,
        convertEol: true,
        allowProposedApi: false,
      });
      terminal.current = term;
      const echo = new LocalEchoAddon({
        historySize: 100,
        enableIncompleteInput: false,
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.loadAddon(new WebLinksAddon());
      term.loadAddon(echo);
      term.open(element);
      term.textarea?.setAttribute("aria-label", "Terminal input");
      term.textarea?.setAttribute("aria-describedby", "terminal-hint");
      echo.addAutocompleteHandler((index: number, words: string[]) => {
        if (index === 0)
          return [...COMMANDS, "cat", "whoami", "projects", "email", "./play"];
        if (words[0] === "cat") return ["about.txt", "work.txt", "contact.txt"];
        if (words[0] === "ls") return ["-a", "-la"];
        return [];
      });
      let highestRow = 0;
      const expand = (value: boolean) => {
        setExpanded(value);
        callbacks.current.onExpanded(value);
      };
      term.attachCustomKeyEventHandler((event) => {
        if (event.type !== "keydown") return true;
        if (event.key === "Escape") {
          term.blur();
          return false;
        }
        if (event.key === "Tab" && event.shiftKey) {
          term.blur();
          return false;
        }
        if (event.ctrlKey && event.key.toLowerCase() === "a") {
          event.preventDefault();
          term.input("\x1b[H", true);
          return false;
        }
        if (event.ctrlKey && event.key.toLowerCase() === "e") {
          event.preventDefault();
          term.input("\x1b[F", true);
          return false;
        }
        if (event.ctrlKey && event.key.toLowerCase() === "l") {
          event.preventDefault();
          echo.abortRead("clear");
          term.reset();
          expand(false);
          return false;
        }
        if (event.key === "Tab") expand(true);
        return true;
      });
      const resize = () => {
        if (!element.clientWidth || !element.clientHeight) return;
        term.options.fontSize = window.innerWidth <= 520 ? 15 : 18;
        fit.fit();
      };
      const written = term.onWriteParsed(() => {
        highestRow = Math.max(
          highestRow,
          term.buffer.active.baseY + term.buffer.active.cursorY,
        );
        const rowHeight =
          (element.querySelector(".xterm-screen")?.clientHeight ?? 0) /
          term.rows;
        if (!rowHeight) return;
        const height = Math.ceil(
          Math.min(
            Math.max(2, highestRow + 2) * rowHeight,
            Math.min(520, window.innerHeight * 0.5),
          ),
        );
        if (element.style.height !== `${height}px`)
          element.style.height = `${height}px`;
      });
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      async function read(): Promise<void> {
        while (!disposed) {
          try {
            const command = await echo.read(PROMPT);
            if (disposed) return;
            if (!command.trim()) continue;
            const result = resolveCommand(command);
            if (result.kind === "clear" || result.kind === "exit") {
              term.reset();
              highestRow = 0;
              expand(false);
            } else if (result.kind === "theme") callbacks.current.onTheme();
            else if (result.kind === "play") callbacks.current.onPlay();
            else if (result.kind === "content") {
              expand(true);
              await echo.println("");
              await echo.println(terminalResponse(result.view, result.message));
              await echo.println("");
            }
          } catch (reason) {
            if (disposed) return;
            if (reason === "clear" || reason === "aborted") continue;
            console.error("Terminal session stopped.", reason);
            setError(
              "The terminal session stopped. Reload to start a new session.",
            );
            return;
          }
        }
      }
      void document.fonts.ready.then(() => {
        if (disposed) return;
        resize();
        element.dataset["ready"] = "true";
        void read();
      });
      return () => {
        disposed = true;
        observer.disconnect();
        written.dispose();
        echo.abortRead("disposed");
        term.dispose();
        terminal.current = null;
      };
    }, []);

    useEffect(() => {
      if (!terminal.current) return;
      terminal.current.options.theme = {
        background: palette.paper,
        foreground: palette.ink,
        cursor: palette.ink,
        cursorAccent: palette.paper,
        selectionBackground: palette.selection,
      };
    }, [palette]);

    return (
      <section className={styles.terminal} aria-label="Interactive terminal">
        <div
          ref={host}
          className={styles.terminalEmulator}
          data-expanded={expanded}
        />
        <p id="terminal-hint" className={styles.hint}>
          try “help” · Tab completes · Esc leaves the terminal
        </p>
        {error && <p role="alert">{error}</p>}
      </section>
    );
  },
);
