#!/usr/bin/env node

// Borrowed from: https://github.com/OnlineOrNot/onlineornot/blob/02894d76b04f524cbc2677510ee676145d420d53/packages/onlineornot/bin/onlineornot.js
const { spawn } = require("child_process");
const path = require("path");

const MIN_NODE_VERSION = "18.0.0";

let superflareProcess;

/**
 * Executes ../dist/cli.js
 */
function runSuperflare() {
  if (semiver(process.versions.node, MIN_NODE_VERSION) < 0) {
    // Note Volta and nvm are also recommended in the official docs:
    // https://developers.cloudflare.com/workers/get-started/guide#2-install-the-workers-cli
    console.error(
      `Superflare requires at least node.js v${MIN_NODE_VERSION}. You are using v${process.versions.node}. Please update your version of node.js.

Consider using a Node.js version manager such as https://volta.sh/ or https://github.com/nvm-sh/nvm.`
    );
    process.exitCode = 1;
    return;
  }

  return spawn(
    process.execPath,
    [
      "--no-warnings",
      "--experimental-vm-modules",
      ...process.execArgv,
      path.join(__dirname, "../dist/cli.js"),
      ...process.argv.slice(2),
    ],
    {
      stdio: ["inherit", "inherit", "inherit", "ipc"],
      env: {
        ...process.env,
      },
    }
  )
    .on("exit", (code) =>
      process.exit(code === undefined || code === null ? 0 : code)
    )
    .on("message", (message) => {
      if (process.send) {
        process.send(message);
      }
    });
}

async function main() {
  superflareProcess = runSuperflare();
}

process.on("SIGINT", () => {
  superflareProcess && superflareProcess.kill();
});
process.on("SIGTERM", () => {
  superflareProcess && superflareProcess.kill();
});

// semiver implementation via https://github.com/lukeed/semiver/blob/ae7eebe6053c96be63032b14fb0b68e2553fcac4/src/index.js

/**
MIT License

Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

var fn = new Intl.Collator(0, { numeric: 1 }).compare;

function semiver(a, b, bool) {
  a = a.split(".");
  b = b.split(".");

  return (
    fn(a[0], b[0]) ||
    fn(a[1], b[1]) ||
    ((b[2] = b.slice(2).join(".")),
    (bool = /[.-]/.test((a[2] = a.slice(2).join(".")))),
    bool == /[.-]/.test(b[2]) ? fn(a[2], b[2]) : bool ? -1 : 1)
  );
}

// end semiver implementation

void main();
