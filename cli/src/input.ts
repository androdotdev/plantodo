import * as readline from "node:readline"

/** A relay API key shape: known prefix + base64url body. */
export const KEY_SHAPE = /^(post|ptd|mcp)_[A-Za-z0-9_-]{30,50}$/

/**
 * Collapse k-fold exact repetitions. Terminals sometimes deliver a pasted
 * buffer twice (or three times); a real key is random, so an exact
 * repetition can only be a paste artifact — never a legitimate key.
 */
export function dedupePaste(input: string): string {
  for (let n = 2; n <= input.length / 2; n++) {
    if (input.length % n !== 0) continue
    const part = input.slice(0, input.length / n)
    if (part.repeat(n) === input) return part
  }
  return input
}

/**
 * Read a line from stdin without echoing to the terminal.
 *
 * TTY path: raw mode with masked echo (`*` per char). Enter (\r or \n)
 * submits, backspace edits, Ctrl+C aborts, Ctrl+D cancels, escape sequences
 * (arrow keys etc.) are swallowed, other control chars are dropped, pastes
 * are deduped, and a non-empty value that doesn't look like a relay key is
 * rejected with a warning and re-prompted.
 *
 * Pipe path: plain readline (no echo risk), trimmed + deduped.
 */
export async function readSecret(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    })
    const answer = await new Promise<string>((res) => rl.question(prompt, res))
    rl.close()
    return dedupePaste(answer.trim())
  }

  return readSecretTTY(prompt)
}

async function readSecretTTY(prompt: string): Promise<string> {
  const stdin = process.stdin
  const stdout = process.stdout

  stdout.write(prompt)
  stdin.setRawMode(true)
  stdin.resume()

  try {
    while (true) {
      const input = await readMaskedLine(stdin, stdout)
      const cleaned = dedupePaste(input)
      if (cleaned !== "" && !KEY_SHAPE.test(cleaned)) {
        stdout.write(`\n${dimWarning(cleaned)}\n`)
        stdout.write(prompt)
        continue
      }
      return cleaned
    }
  } finally {
    stdin.setRawMode(false)
    stdin.pause()
  }
}

/**
 * Advance the ANSI escape-sequence state. When inEscape, returns whether the
 * sequence continues:
 *   - `[` is the CSI introducer (ESC [ …) — not a terminator, keep swallowing
 *   - 0x40–0x7E is a final byte (arrows etc.) — sequence ends
 *   - anything else is a parameter/intermediate byte — keep swallowing
 */
export function escapeStep(ch: string, inEscape: boolean): boolean {
  if (!inEscape) return false
  if (ch === "[") return true
  if (ch >= "@" && ch <= "~") return false
  return true
}

function readMaskedLine(stdin: NodeJS.ReadStream, stdout: NodeJS.WriteStream): Promise<string> {
  return new Promise((resolve) => {
    let input = ""
    let inEscape = false

    const finish = (value: string) => {
      stdin.removeListener("data", onData)
      stdout.write("\n")
      resolve(value)
    }

    const onData = (chunk: Buffer) => {
      for (const ch of chunk.toString()) {
        if (inEscape) {
          inEscape = escapeStep(ch, true)
          continue
        }
        if (ch === "\x1b") {
          inEscape = true
          continue
        }
        if (ch === "\r" || ch === "\n") {
          finish(input)
          return
        }
        if (ch === "\x7f" || ch === "\x08") {
          if (input.length > 0) {
            input = input.slice(0, -1)
            stdout.write("\b \b")
          }
          continue
        }
        if (ch === "\x03") {
          process.exit(1) // Ctrl+C — hard abort, like readline
        }
        if (ch === "\x04") {
          finish("") // Ctrl+D — cancel
          return
        }
        if (ch < " ") continue // drop other control chars
        input += ch
        stdout.write("*")
      }
    }

    stdin.on("data", onData)
  })
}

function dimWarning(value: string): string {
  const head = value.slice(0, 12)
  return `Warning: "${head}…" (${value.length} chars) doesn't look like a relay API key (expected post_/ptd_/mcp_ + ~39 chars). Press Ctrl+C to cancel, or try again:`
}
