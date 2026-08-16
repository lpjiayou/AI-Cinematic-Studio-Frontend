import { spawn } from "node:child_process";
import { resolve } from "node:path";

const forwardedArgs = [];
const inputArgs = process.argv.slice(2);

for (let index = 0; index < inputArgs.length; index += 1) {
  const argument = inputArgs[index];

  if (argument === "--strictPort") continue;
  if (argument === "--host") {
    forwardedArgs.push("--hostname", inputArgs[index + 1] ?? "0.0.0.0");
    index += 1;
    continue;
  }
  if (argument.startsWith("--host=")) {
    forwardedArgs.push(`--hostname=${argument.slice("--host=".length)}`);
    continue;
  }

  forwardedArgs.push(argument);
}

const nextCli = resolve(process.cwd(), "node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [nextCli, "dev", ...forwardedArgs], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
