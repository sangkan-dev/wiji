import { readFileSync } from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

/** Repo root `WIJI_SPEC.md` (parent of `site/`). Build must run with cwd = `site/`. */
function specAbsolutePath(): string {
	return path.resolve(process.cwd(), '..', 'WIJI_SPEC.md');
}

export const prerender = true;

export function load() {
	const md = readFileSync(specAbsolutePath(), 'utf8');
	const html = marked.parse(md, { async: false });
	return { html };
}
