import { COMMANDS } from "./commands";

const COMMAND_NAMES = [
  ...COMMANDS,
  "cat",
  "whoami",
  "projects",
  "email",
  "./play",
].sort();
const FILES = ["about.txt", "contact.txt", "work.txt"];
export type Completion = {
  before: string;
  after: string;
  choices: string[];
  index: number;
};

/** The shell layer completes the token at the caret, preserving the rest of the line. */
export function completeToken(line: string, cursor: number): Completion | null {
  const left = line.slice(0, cursor);
  const token = left.match(/\S*$/)?.[0] ?? "";
  const start = cursor - token.length;
  const right = line.slice(cursor).match(/^\S*/)?.[0] ?? "";
  const words = left.slice(0, start).trim().split(/\s+/).filter(Boolean);
  const pool =
    words.length === 0
      ? COMMAND_NAMES
      : words[0] === "cat"
        ? FILES
        : words[0] === "ls"
          ? ["-a", "-la"]
          : [];
  const choices = pool.filter((word) => word.startsWith(token));
  if (!choices.length) return null;
  return {
    before: line.slice(0, start),
    after: line.slice(cursor + right.length),
    choices,
    index: -1,
  };
}
