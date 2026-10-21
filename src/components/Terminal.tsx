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
import { Readline } from "xterm-readline";
import { completeToken } from "../lib/terminal-completion";
import type { Completion } from "../lib/terminal-completion";
import { useAtomValue } from "jotai";
import { themeAtom } from "../atoms/theme";
import { resolveCommand } from "../lib/commands";
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
      const echo = new Readline();
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.loadAddon(new WebLinksAddon());
      term.loadAddon(echo);
      term.open(element);
      term.textarea?.setAttribute("aria-label", "Terminal input");
      term.textarea?.setAttribute("aria-describedby", "terminal-hint");
      const expand = (value: boolean) => callbacks.current.onExpanded(value);
      let completion: Completion | null = null;
      let generation = 0;
      let completing = Promise.resolve();
      const resetCompletion = () => {
        completion = null;
        generation++;
      };
      const data = term.onData(resetCompletion);
      async function complete(direction: number): Promise<void> {
        const revision = generation;
        await echo.whenReady();
        if (disposed || revision !== generation) return;
        if (completion) {
          completion.index =
            (completion.index + direction + completion.choices.length) %
            completion.choices.length;
          const choice = completion.choices[completion.index] ?? "";
          const value = completion.before + choice;
          echo.updateLine(value + completion.after, value.length);
          return;
        }
        const next = completeToken(echo.getLine(), echo.getCursor());
        if (!next) return;
        if (next.choices.length === 1) {
          const value =
            next.before + next.common + (next.after.startsWith(" ") ? "" : " ");
          echo.updateLine(value + next.after, value.length);
        } else {
          completion = next;
          const value = next.before + next.common;
          echo.updateLine(value + next.after, value.length);
          await echo.showCompletions(next.choices);
        }
      }
      term.attachCustomKeyEventHandler((event) => {
        if (event.type !== "keydown") return true;
        if (
          [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End",
            "PageUp",
            "PageDown",
            "Backspace",
          ].includes(event.key)
        )
          event.preventDefault();
        if (event.key === "Escape") {
          resetCompletion();
          term.blur();
          return false;
        }
        if (event.key === "Tab") {
          if (event.shiftKey && !completion) {
            term.blur();
            return false;
          }
          event.preventDefault();
          const revision = generation;
          completing = completing
            .then(() => {
              if (generation !== revision || disposed) return;
              return complete(event.shiftKey ? -1 : 1);
            })
            .catch((reason: unknown) => {
              console.error("Terminal completion failed.", reason);
              setError("Completion could not finish. Try typing the command.");
            });
          return false;
        }
        if (event.metaKey && event.key.toLowerCase() === "a") {
          event.preventDefault();
          term.selectAll();
          return false;
        }
        if (
          (event.altKey || event.metaKey) &&
          (event.key === "ArrowLeft" || event.key === "ArrowRight")
        ) {
          event.preventDefault();
          resetCompletion();
          const line = echo.getLine();
          const cursor = echo.getCursor();
          const next = event.metaKey
            ? event.key === "ArrowLeft"
              ? 0
              : line.length
            : event.key === "ArrowLeft"
              ? line.slice(0, cursor).replace(/\S+\s*$/, "").length
              : cursor + (line.slice(cursor).match(/^\s*\S+/)?.[0].length ?? 0);
          echo.updateLine(line, next);
          return false;
        }
        if (
          event.ctrlKey &&
          ["b", "f", "p", "n"].includes(event.key.toLowerCase())
        ) {
          event.preventDefault();
          resetCompletion();
          const sequence: Record<string, string> = {
            b: "\x1b[D",
            f: "\x1b[C",
            p: "\x1b[A",
            n: "\x1b[B",
          };
          term.input(sequence[event.key.toLowerCase()] ?? "", true);
          return false;
        }
        if (
          (event.ctrlKey && event.key.toLowerCase() === "w") ||
          (event.altKey && event.key === "Backspace")
        ) {
          event.preventDefault();
          resetCompletion();
          const line = echo.getLine();
          const cursor = echo.getCursor();
          const cut = line.slice(0, cursor).replace(/\S+\s*$/, "").length;
          echo.updateLine(line.slice(0, cut) + line.slice(cursor), cut);
          return false;
        }
        if (
          event.key !== "Shift" &&
          event.key !== "Control" &&
          event.key !== "Alt" &&
          event.key !== "Meta"
        )
          resetCompletion();
        return true;
      });
      const resize = () => {
        if (!element.clientWidth || !element.clientHeight) return;
        const fontSize = window.innerWidth <= 520 ? 15 : 18;
        if (term.options.fontSize !== fontSize)
          term.options.fontSize = fontSize;
        const size = fit.proposeDimensions();
        if (size && (size.cols !== term.cols || size.rows !== term.rows))
          term.resize(size.cols, size.rows);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      async function read(): Promise<void> {
        while (!disposed) {
          try {
            const command = await echo.read(PROMPT);
            resetCompletion();
            if (disposed) return;
            if (!command.trim()) continue;
            const result = resolveCommand(command);
            if (result.kind === "clear" || result.kind === "exit") {
              term.reset();
              expand(false);
            } else if (result.kind === "theme") callbacks.current.onTheme();
            else if (result.kind === "play") callbacks.current.onPlay();
            else if (result.kind === "content") {
              expand(true);
              echo.println("");
              echo.println(terminalResponse(result.view, result.message));
              echo.println("");
            }
          } catch (reason) {
            if (disposed) return;
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
        data.dispose();
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
        <div ref={host} className={styles.terminalEmulator} />
        <p id="terminal-hint" className={styles.hint}>
          try “help” · Tab completes · Esc leaves the terminal
        </p>
        {error && <p role="alert">{error}</p>}
      </section>
    );
  },
);
