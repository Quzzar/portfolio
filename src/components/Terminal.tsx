import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { COMPLETIONS, resolveCommand } from "../lib/commands";
import type { ContentView } from "../lib/commands";
import { TerminalOutput } from "./TerminalOutput";
import * as styles from "../styles/home.css";

export type TerminalHandle = {
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
  const [isFocused, setIsFocused] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [cycle, setCycle] = useState<{
    matches: readonly string[];
    index: number;
  } | null>(null);
  const prefix = input.trimStart().toLowerCase();
  const matches =
    cycle?.matches ??
    COMPLETIONS.filter((command) => command.startsWith(prefix));
  const candidate = matches[cycle?.index ?? 0];
  const ghost =
    input && candidate?.startsWith(input) ? candidate.slice(input.length) : "";
  const hasSuggestions =
    isFocused &&
    (Boolean(input.trim()) || showOptions) &&
    matches.some((command) => command !== input);

  function fill(command: string): void {
    setInput(command);
    setHistoryIndex(null);
    setCycle(null);
    setShowOptions(false);
    inputRef.current?.focus({ preventScroll: true });
    requestAnimationFrame(() =>
      inputRef.current?.setSelectionRange(command.length, command.length),
    );
  }

  function execute(command: string): void {
    if (!command.trim()) return;
    const result = resolveCommand(command);
    setInput("");
    setCycle(null);
    setShowOptions(false);
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
    focus: () => inputRef.current?.focus(),
  }));

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    execute(input);
  }
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Tab" && !event.ctrlKey && !event.metaKey) {
      if (event.shiftKey && !cycle) return;
      if (!input && !showOptions && !event.shiftKey) {
        event.preventDefault();
        setShowOptions(true);
        return;
      }
      if (matches.length === 1 && matches[0] === input) {
        setCycle(null);
        setShowOptions(false);
        return;
      }
      if (matches.length > 0 && (input || showOptions || cycle)) {
        event.preventDefault();
        const next = cycle
          ? (cycle.index + (event.shiftKey ? -1 : 1) + matches.length) %
            matches.length
          : 0;
        setCycle({ matches, index: next });
        setInput(matches[next] ?? input);
        setShowOptions(true);
        setHistoryIndex(null);
      }
      return;
    }
    if (
      event.key === "ArrowRight" &&
      ghost &&
      event.currentTarget.selectionStart === input.length &&
      event.currentTarget.selectionEnd === input.length
    ) {
      event.preventDefault();
      fill(candidate ?? input);
      return;
    }
    if (event.ctrlKey && !event.altKey && !event.metaKey) {
      const field = event.currentTarget;
      const start = field.selectionStart ?? input.length;
      const end = field.selectionEnd ?? start;
      const key = event.key.toLowerCase();
      if (key === "a" || key === "e") {
        event.preventDefault();
        const position = key === "a" ? 0 : input.length;
        field.setSelectionRange(position, position);
        return;
      }
      if (key === "u" || key === "k" || key === "w") {
        event.preventDefault();
        const cut =
          key === "u"
            ? 0
            : key === "w"
              ? input.slice(0, start).replace(/\S+\s*$/, "").length
              : start;
        const value =
          key === "k"
            ? input.slice(0, start)
            : input.slice(0, cut) + input.slice(end);
        setInput(value);
        setCycle(null);
        setHistoryIndex(null);
        requestAnimationFrame(() => field.setSelectionRange(cut, cut));
        return;
      }
      if (key === "c" && start === end) {
        event.preventDefault();
        fill("");
        return;
      }
    }
    if (event.key === "ArrowUp" && history.length > 0) {
      event.preventDefault();
      if (historyIndex === null) setDraft(input);
      const next = Math.max(
        0,
        historyIndex === null ? history.length - 1 : historyIndex - 1,
      );
      setCycle(null);
      setHistoryIndex(next);
      setInput(history[next] ?? "");
    }
    if (event.key === "ArrowDown" && historyIndex !== null) {
      event.preventDefault();
      const next = historyIndex + 1;
      setCycle(null);
      setHistoryIndex(next < history.length ? next : null);
      setInput(next < history.length ? (history[next] ?? "") : draft);
    }
    if (event.key === "Escape") {
      setCycle(null);
      setShowOptions(false);
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
                  onCommand={fill}
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
          {ghost && (
            <span className={styles.ghost} aria-hidden="true">
              <span className={styles.ghostPrefix}>{input}</span>
              {ghost}
            </span>
          )}
          <input
            ref={inputRef}
            id="command-input"
            className={styles.input}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setHistoryIndex(null);
              setCycle(null);
              setShowOptions(false);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setShowOptions(false);
              setCycle(null);
            }}
            onKeyDown={handleKeyDown}
            maxLength={160}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-describedby={
              hasSuggestions
                ? "terminal-hint terminal-options"
                : "terminal-hint"
            }
          />
          {input.length === 0 && (
            <span className={styles.cursor} aria-hidden="true" />
          )}
        </div>
      </form>
      {hasSuggestions && (
        <div
          id="terminal-options"
          className={styles.completions}
          role="group"
          aria-label="Command completions"
        >
          {matches.slice(0, 16).map((command) => (
            <button
              key={command}
              type="button"
              className={styles.commandButton}
              tabIndex={-1}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => fill(command)}
            >
              {command}
            </button>
          ))}
        </div>
      )}
      <p id="terminal-hint" className={styles.hint}>
        {hasSuggestions
          ? "Tab completes · Enter runs · Esc dismisses"
          : "try “help”, or just say hello."}
      </p>
    </section>
  );
});
