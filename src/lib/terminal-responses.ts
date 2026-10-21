import { PROJECTS } from "./commands";
import type { ContentView } from "./commands";

/** Plain terminal output: xterm handles wrapping, selection, and URL activation. */
export function terminalResponse(view: ContentView, message?: string): string {
  switch (view) {
    case "help":
      return "work\nabout\ncontact\nresume\nls\ntheme\nclear\nexit";
    case "work":
      return PROJECTS.map((project) =>
        [project.name, project.detail, project.url].filter(Boolean).join("\n"),
      ).join("\n\n");
    case "about":
      return "Aaron Cassar\nFounder, engineer, designer.\nSystem design. Product design.";
    case "contact":
      return "contact@aaroncassar.com";
    case "resume":
      return `${location.origin}/resume/Resume.pdf`;
    case "files":
      return "about.txt    work.txt    contact.txt";
    case "hidden":
      return "about.txt    work.txt    contact.txt    ./play";
    case "coffee":
      return "   ( (\n    ) )\n  .----.\n  |    |]\n  `----´";
    case "sudo":
      return "Permission denied.";
    case "error":
      return message ?? "Command not found. Try help.";
  }
}
