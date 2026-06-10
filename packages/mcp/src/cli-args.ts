/**
 * Parsed `swatchbook-mcp` CLI arguments. Pure — kept out of `bin.ts` (which
 * self-executes on import) so the parsing is unit-testable. `--help` is
 * surfaced as a flag rather than printed here, leaving stdout side effects
 * and `process.exit` to the entry point.
 */
export interface CliArgs {
  config?: string;
  cwd?: string;
  watch: boolean;
  help: boolean;
}

export function parseArgs(argv: readonly string[]): CliArgs {
  const out: CliArgs = { watch: true, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if ((arg === '--config' || arg === '-c') && next) {
      out.config = next;
      i++;
    } else if (arg === '--cwd' && next) {
      out.cwd = next;
      i++;
    } else if (arg === '--no-watch') {
      out.watch = false;
    } else if (arg === '--help' || arg === '-h') {
      out.help = true;
    }
  }
  return out;
}
