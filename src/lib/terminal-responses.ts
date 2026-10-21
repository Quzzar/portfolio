import { PROJECTS } from "./commands";
import type { ContentView } from "./commands";

/** Plain terminal output: xterm handles wrapping, selection, and URL activation. */
export function terminalResponse(view: ContentView, message?: string): string {
  switch (view) {
    case "help":
      return [
        "work      Things I’ve put into the world.",
        "about     A little about me.",
        "contact   Start a conversation.",
        "resume    The more formal version.",
        "ls        Look around.",
        "theme     A change of light.",
        "clear     A clean slate.",
        "exit      Back to almost nothing.",
        "",
        "Tab completes commands and filenames.",
        "↑ ↓ history · ← → edit · Ctrl-C cancel · Ctrl-L clear",
        "Curious? Try ls -a.",
      ].join("\n");
    case "work":
      return PROJECTS.map(
        (project) => `${project.name}\n${project.detail}\n${project.url}`,
      ).join("\n\n");
    case "about":
      return "I’m Aaron. Founder, engineer, designer.\n\nI work across systems and products. I like taking an idea apart, figuring out what matters, and making it real.\n\nAlso into backpacking, skateboarding, and tabletop worlds.";
    case "contact":
      return "Good things tend to start with a conversation.\n\ncontact@aaroncassar.com\nmailto:contact@aaroncassar.com";
    case "resume":
      return `Read my resume\n${location.origin}/resume/Resume.pdf`;
    case "files":
      return "about.txt    work.txt    contact.txt";
    case "hidden":
      return "about.txt    work.txt    contact.txt\n\nOne executable: ./play\nEntirely unnecessary.";
    case "coffee":
      return "   ( (\n    ) )\n  .----.\n  |    |]\n  `----´\n\nOne dependency I can’t seem to remove.";
    case "sudo":
      return "Permission granted to make something unnecessary.\nTry play.";
    case "error":
      return message ?? "Command not found. Try help.";
  }
}
