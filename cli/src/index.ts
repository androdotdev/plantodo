// planToDO CLI — upload / delete / list plans
// Usage: ptd <command> [options]

const commands = ["upload", "delete", "list"] as const;

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case "upload":
      console.log("upload — not implemented yet");
      break;
    case "delete":
      console.log("delete — not implemented yet");
      break;
    case "list":
      console.log("list — not implemented yet");
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
