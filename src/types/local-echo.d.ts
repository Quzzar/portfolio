// The package ships declarations but omits them from its exports map.
declare module "@gytx/xterm-local-echo" {
  import type { ITerminalAddon, Terminal } from "@xterm/xterm";
  export class LocalEchoAddon implements ITerminalAddon {
    constructor(options?: {
      historySize?: number;
      enableIncompleteInput?: boolean;
    });
    activate(terminal: Terminal): void;
    dispose(): void;
    addAutocompleteHandler(
      handler: (index: number, words: string[]) => string[],
    ): void;
    read(prompt: string): Promise<string>;
    println(message: string): Promise<void>;
    abortRead(reason?: string): void;
  }
}
