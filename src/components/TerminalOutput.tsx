import { ArrowUpRight } from "lucide-react";
import { PROJECTS } from "../lib/commands";
import type { ContentView } from "../lib/commands";
import * as styles from "../styles/home.css";

type Props = {
  view: ContentView;
  message?: string;
  onCommand: (command: string) => void;
};
const HELP = [
  ["work", "Things I’ve put into the world."],
  ["about", "A little about me."],
  ["contact", "Start a conversation."],
  ["resume", "The more formal version."],
  ["theme", "A change of light."],
  ["clear", "A clean slate."],
  ["exit", "Back to almost nothing."],
] as const;

/** Rendered responses are semantic HTML; destinations stay clickable on touch devices. */
export function TerminalOutput({ view, message, onCommand }: Props) {
  if (view === "help")
    return (
      <>
        <ul className={styles.outputList}>
          {HELP.map(([command, detail]) => (
            <li className={styles.commandRow} key={command}>
              <button
                className={styles.commandButton}
                onClick={() => onCommand(command)}
              >
                {command}
              </button>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
        <p className={styles.hint}>
          Tab completes. ↑ ↓ remembers. Curious? Try{" "}
          <button
            className={styles.commandButton}
            onClick={() => onCommand("ls -a")}
          >
            ls -a
          </button>
          .
        </p>
      </>
    );
  if (view === "work")
    return (
      <ul className={styles.outputList}>
        {PROJECTS.map((project) => (
          <li className={styles.projectRow} key={project.name}>
            <a
              className={styles.projectLink}
              href={project.url}
              target="_blank"
              rel="noreferrer"
            >
              {project.name}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <span>{project.detail}</span>
          </li>
        ))}
      </ul>
    );
  if (view === "about")
    return (
      <>
        <p className={styles.responseParagraph}>
          I’m Aaron. Founder, engineer, designer.
        </p>
        <p className={styles.responseParagraph}>
          I work across systems and products. I like taking an idea apart,
          figuring out what matters, and making it real.
        </p>
        <p>Also into backpacking, skateboarding, and tabletop worlds.</p>
      </>
    );
  if (view === "contact")
    return (
      <>
        <p className={styles.responseParagraph}>
          Good things tend to start with a conversation.
        </p>
        <a className={styles.projectLink} href="mailto:contact@aaroncassar.com">
          contact@aaroncassar.com
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </>
    );
  if (view === "resume")
    return (
      <a
        className={styles.projectLink}
        href="/resume/Resume.pdf"
        target="_blank"
        rel="noreferrer"
      >
        Read my résumé
        <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    );
  if (view === "files" || view === "hidden")
    return (
      <>
        <ul className={styles.outputList}>
          {["about.txt", "work.txt", "contact.txt"].map((file) => (
            <li key={file}>
              <button
                className={styles.commandButton}
                onClick={() => onCommand(`cat ${file}`)}
              >
                {file}
              </button>
            </li>
          ))}
        </ul>
        {view === "hidden" && (
          <p className={styles.hint}>
            One executable:{" "}
            <button
              className={styles.commandButton}
              onClick={() => onCommand("play")}
            >
              ./play
            </button>
            . Entirely unnecessary.
          </p>
        )}
      </>
    );
  if (view === "hello")
    return (
      <p>
        Hello, stranger. Glad you found this little corner.
        <br />
        Stay a while. Try{" "}
        <button
          className={styles.commandButton}
          onClick={() => onCommand("help")}
        >
          help
        </button>
        .
      </p>
    );
  if (view === "coffee")
    return (
      <>
        <pre aria-label="A small ASCII cup of coffee">
          {"   ( (\n    ) )\n  .----.\n  |    |]\n  `----´"}
        </pre>
        <p className={styles.hint}>One dependency I can’t seem to remove.</p>
      </>
    );
  if (view === "sudo")
    return (
      <p>
        Permission granted to make something unnecessary.
        <br />
        Try{" "}
        <button
          className={styles.commandButton}
          onClick={() => onCommand("play")}
        >
          play
        </button>
        .
      </p>
    );
  return <p role="status">{message}</p>;
}
