#!/usr/bin/env node
// Encrypt lists.local.json (plaintext, gitignored) -> lists.enc.json (ciphertext, committed).
//
//   node encrypt.mjs                    re-encrypt with the current passphrase (prompts; must match)
//   node encrypt.mjs --new-passphrase   set or change the passphrase (every device re-enters it)
//
// FXGRID_PASS env var skips the prompt (for scripts). Never pass the passphrase as an argument.
//
// Crypto: key = PBKDF2-SHA256(passphrase, salt, ITER) -> AES-256-GCM, fresh 12-byte IV per run.
// The salt is kept across runs so keys already stored on devices keep working; only
// --new-passphrase draws a new salt (which the page detects and asks for the passphrase again).
// Must stay in sync with decrypt code in index.html.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";

const { subtle } = globalThis.crypto;
const getRandomValues = (a) => globalThis.crypto.getRandomValues(a);
const ITER = 600_000;
const SRC = new URL("lists.local.json", import.meta.url), OUT = new URL("lists.enc.json", import.meta.url);
const b64 = (u8) => Buffer.from(u8).toString("base64");
const unb64 = (s) => new Uint8Array(Buffer.from(s, "base64"));
const enc = new TextEncoder(), dec = new TextDecoder();

function ask(q) {
  if (!process.stdin.isTTY) throw new Error("no TTY: set FXGRID_PASS or run in a terminal");
  return new Promise((res) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.startsWith(q)) rl.output.write(q); };  // hide typed chars
    rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); res(a); });
  });
}

async function deriveKey(pass, salt, iter) {
  const base = await subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function decryptFile(file, pass) {
  const key = await deriveKey(pass, unb64(file.salt), file.iter);
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: unb64(file.iv) }, key, unb64(file.ct));
  return dec.decode(pt);
}

const newPass = process.argv.includes("--new-passphrase");
const tabs = JSON.parse(readFileSync(SRC, "utf8"));  // throws on bad JSON before we touch anything
for (const [name, t] of Object.entries(tabs)) {
  if (!Array.isArray(t?.symbols)) throw new Error(`tab "${name}": "symbols" must be an array of strings`);
}
const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;

let pass = process.env.FXGRID_PASS ?? await ask(newPass || !old ? "New passphrase: " : "Passphrase: ");
let salt;
if (newPass || !old) {
  // Ciphertext is public forever, so guessing is offline and unlimited. 4-5 random words resist that.
  if (pass.length < 8) throw new Error("passphrase under 8 chars");
  if (pass.length < 16) console.warn("warning: under 16 chars is guessable offline; 4-5 random words is safer");
  if (!process.env.FXGRID_PASS && pass !== await ask("Repeat passphrase: ")) throw new Error("passphrases differ");
  salt = getRandomValues(new Uint8Array(16));
} else {
  try { await decryptFile(old, pass); }
  catch { throw new Error(`passphrase does not open the existing lists.enc.json. Typo? To change it: --new-passphrase`); }
  salt = unb64(old.salt);
}

const iv = getRandomValues(new Uint8Array(12));
const key = await deriveKey(pass, salt, ITER);
const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(tabs))));
const out = { v: 1, kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };

// Round-trip check before writing.
if (await decryptFile(out, pass) !== JSON.stringify(tabs)) throw new Error("round-trip check failed");
writeFileSync(OUT, JSON.stringify(out) + "\n");
const n = Object.values(tabs).reduce((s, t) => s + t.symbols.length, 0);
console.log(`lists.enc.json: ${Object.keys(tabs).length} tabs, ${n} symbols${newPass || !old ? " (new passphrase)" : ""}`);
