import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { COMMANDS, resolveCommand } from "../lib/commands";
import type { ContentView } from "../lib/commands";
import { TerminalOutput } from "./TerminalOutput";
import * as styles from "../styles/home.css";

export type TerminalHandle = {
  execute: (command: string) => void;
  fill: (command: string) => void;
  focus: () => void;
};
type Entry = {
  id: number;
  command: string;
  view: ContentView;
  message?: string;
};
type Props = {
  onExpanded: (isExpanded: boolean) => void;
  onPlay: () => void;
  onTheme: () => void;
};

/** A bounded transcript with shell-style history and allowlisted completion. */
export const Terminal = forwardRef<TerminalHandle, Props>(function Terminal(
  { onExpanded, onPlay, onTheme },
  ref,
) {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const sequence = useRef(0);

  function execute(command: string): void {
    if (!command.trim()) return;
    const result = resolveCommand(command);
    setInput("");
    setHistory((previous) => [...previous, command].slice(-100));
    setHistoryIndex(null);
    if (result.kind === "content") {
      const entry: Entry = {
        id: sequence.current++,
        command,
        view: result.view,
        ...(result.message === undefined ? {} : { message: result.message }),
      };
      setEntries((previous) => [...previous, entry].slice(-30));
      onExpanded(true);
    } else if (result.kind === "clear" || result.kind === "exit") {
      setEntries([]);
      onExpanded(false);
    } else if (result.kind === "theme") onTheme();
    else if (result.kind === "play") onPlay();
    inputRef.current?.focus({ preventScroll: true });
    if (result.kind !== "play")
      window.requestAnimationFrame(() =>
        inputRef.current?.scrollIntoView({
          block: "nearest",
          behavior: "instant",
        }),
      );
  }

  useImperativeHandle(ref, () => ({
    execute,
    fill: (command: string) => {
      setInput(command);
      setHistoryIndex(null);
      inputRef.current?.focus({ preventScroll: true });
      requestAnimationFrame(() =>
        inputRef.current?.setSelectionRange(command.length, command.length),
      );
    },
    focus: () => inputRef.current?.focus(),
  }));

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    execute(input);
  }
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Tab" && input.trim() && !event.shiftKey) {
      const matches = COMMANDS.filter((command) =>
        command.startsWith(input.trim().toLowerCase()),
      );
      if (matches.length === 1 && matches[0] !== input) {
        event.preventDefault();
        setInput(matches[0] ?? input);
      }
    }
    if (event.key === "ArrowUp" && history.length > 0) {
      event.preventDefault();
      if (historyIndex === null) setDraft(input);
      const next = Math.max(
        0,
        historyIndex === null ? history.length - 1 : historyIndex - 1,
      );
      setHistoryIndex(next);
      setInput(history[next] ?? "");
    }
    if (event.key === "ArrowDown" && historyIndex !== null) {
      event.preventDefault();
      const next = historyIndex + 1;
      setHistoryIndex(next < history.length ? next : null);
      setInput(next < history.length ? (history[next] ?? "") : draft);
    }
    if (event.key === "Escape") {
      setInput("");
      setHistoryIndex(null);
      inputRef.current?.blur();
    }
    if (event.key === "l" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      execute("clear");
    }
  }

  return (
    <section className={styles.terminal} aria-label="Interactive terminal">
      {entries.length > 0 && (
        <div
          className={styles.transcript}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Command output"
        >
          {entries.map((entry) => (
            <div key={entry.id}>
              <p className={styles.historyCommand}>
                <span aria-hidden="true">%</span>
                <span>{entry.command}</span>
              </p>
              <div className={styles.response}>
                <TerminalOutput
                  view={entry.view}
                  {...(entry.message === undefined
                    ? {}
                    : { message: entry.message })}
                  onCommand={execute}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={styles.form}
        onClick={() => inputRef.current?.focus()}
      >
        <label className={styles.prompt} htmlFor="command-input">
          <span aria-hidden="true">visitor@aaron ~ %</span>
          <span className={styles.screenReader}>Terminal command</span>
        </label>
        <div className={styles.inputWrap}>
          <input
            ref={inputRef}
            id="command-input"
            className={styles.input}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setHistoryIndex(null);
            }}
            onKeyDown={handleKeyDown}
            maxLength={160}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-describedby="terminal-hint"
          />
          {input.length === 0 && (
            <span className={styles.cursor} aria-hidden="true" />
          )}
        </div>
      </form>
      <p id="terminal-hint" className={styles.hint}>
        try “help”, or just say hello.
      </p>
    </section>
  );
});
