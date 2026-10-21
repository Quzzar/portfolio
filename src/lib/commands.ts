export type ContentView =
  | "help"
  | "work"
  | "about"
  | "contact"
  | "resume"
  | "files"
  | "hidden"
  | "hello"
  | "coffee"
  | "sudo"
  | "error";

export type CommandResult =
  | { kind: "content"; view: ContentView; message?: string }
  | { kind: "clear" | "exit" | "theme" | "play" };

export const COMMANDS = [
  "help",
  "work",
  "about",
  "contact",
  "resume",
  "hello",
  "ls",
  "clear",
  "theme",
  "exit",
  "play",
  "coffee",
  "sudo",
] as const;

/** This is an allowlisted browser interaction, never an executable shell. */
export function resolveCommand(input: string): CommandResult {
  const command = input.trim().toLowerCase().replace(/\s+/g, " ");
  switch (command) {
    case "help":
    case "?":
      return { kind: "content", view: "help" };
    case "work":
    case "projects":
    case "cat work.txt":
      return { kind: "content", view: "work" };
    case "about":
    case "whoami":
    case "cat about.txt":
      return { kind: "content", view: "about" };
    case "contact":
    case "email":
    case "cat contact.txt":
      return { kind: "content", view: "contact" };
    case "resume":
    case "résumé":
      return { kind: "content", view: "resume" };
    case "ls":
      return { kind: "content", view: "files" };
    case "ls -a":
    case "ls -la":
      return { kind: "content", view: "hidden" };
    case "hello":
    case "hi":
      return { kind: "content", view: "hello" };
    case "coffee":
      return { kind: "content", view: "coffee" };
    case "sudo":
    case "sudo make something cool":
      return { kind: "content", view: "sudo" };
    case "clear":
      return { kind: "clear" };
    case "exit":
    case "quit":
      return { kind: "exit" };
    case "theme":
      return { kind: "theme" };
    case "play":
    case "./play":
      return { kind: "play" };
    default:
      return {
        kind: "content",
        view: "error",
        message: `Command not found: ${input.trim()}. Try “help”.`,
      };
  }
}

export type Project = { name: string; detail: string; url: string };

export const PROJECTS: readonly Project[] = [
  {
    name: "Wanderer’s Guide",
    detail: "A character builder for Pathfinder.",
    url: "https://wanderersguide.app/",
  },
  {
    name: "FantasyGen",
    detail: "AI-generated fantasy names.",
    url: "https://github.com/Quzzar/fantasy-gen",
  },
  {
    name: "TalesTerrain",
    detail: "Procedural terrain, one tile at a time.",
    url: "https://github.com/Quzzar/TalesTerrain",
  },
  {
    name: "Echolink",
    detail: "Proximity chat and radio-like communication for Minecraft.",
    url: "https://github.com/Quzzar/echolink",
  },
  {
    name: "FableBrain",
    detail: "An experiment in memory through AI-generated fables.",
    url: "https://github.com/Quzzar/fablebrain",
  },
  {
    name: "More on GitHub",
    detail: "The rest of the rabbit hole.",
    url: "https://github.com/Quzzar",
  },
];
