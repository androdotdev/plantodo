#!/usr/bin/env node

// src/index.ts
var commands = ["upload", "delete", "list"];
async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  switch (cmd) {
    case "upload":
      console.log("upload \u2014 not implemented yet");
      break;
    case "delete":
      console.log("delete \u2014 not implemented yet");
      break;
    case "list":
      console.log("list \u2014 not implemented yet");
      break;
    default:
      console.log(`Usage: ptd <${commands.join("|")}> [options]`);
      process.exit(1);
  }
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
