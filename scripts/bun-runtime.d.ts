type BunReadableProcess = {
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  exited: Promise<number>;
};

type BunRuntime = {
  argv: string[];
  cwd: string;
  env: Record<string, string | undefined>;
  spawn(
    command: string[],
    options: {
      cwd: string;
      env: Record<string, string | undefined>;
      stdout: "pipe";
      stderr: "pipe";
    },
  ): BunReadableProcess;
  write(path: string, content: string): Promise<number>;
};

declare const Bun: BunRuntime;
