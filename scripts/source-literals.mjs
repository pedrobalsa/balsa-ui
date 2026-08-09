/**
 * Extract string literals from source.
 *
 * Pairing quotes with a regular expression looks simple and is subtly wrong: a
 * character class has to exclude newlines and escapes correctly, and when it
 * does not, the scanner pairs the closing quote of one literal with the opening
 * quote of the next and returns the code between them as though it were a
 * string. That failure is silent -- it yields plausible-looking results -- so
 * literals are scanned explicitly instead.
 */

const quotes = new Set(['"', "'", "`"]);

/**
 * Every quoted literal in `content`, with its quote character, skipping
 * comments so a commented-out class list is never patched.
 */
export function stringLiterals(content, { minLength = 1, maxLength = Infinity, depth = 2 } = {}) {
  const literals = [];
  let index = 0;

  /**
   * A Vue binding nests one quote style inside another: `:class="cn('...')"`.
   * The outer attribute captures the whole expression, so the class list itself
   * is only reachable by scanning inside it.
   */
  const recurse = (value) => {
    if (depth <= 0 || !/["'`]/.test(value)) return;
    literals.push(...stringLiterals(value, { minLength, maxLength, depth: depth - 1 }));
  };

  while (index < content.length) {
    const character = content[index];

    // Skip comments: a class list inside one is not live code.
    if (character === "/" && content[index + 1] === "/") {
      const end = content.indexOf("\n", index);
      index = end < 0 ? content.length : end + 1;
      continue;
    }
    if (character === "/" && content[index + 1] === "*") {
      const end = content.indexOf("*/", index + 2);
      index = end < 0 ? content.length : end + 2;
      continue;
    }

    if (!quotes.has(character)) {
      index += 1;
      continue;
    }

    const quote = character;
    let cursor = index + 1;
    let value = "";
    let terminated = false;

    while (cursor < content.length) {
      const current = content[cursor];
      if (current === "\\") {
        value += content.slice(cursor, cursor + 2);
        cursor += 2;
        continue;
      }
      // A single- or double-quoted literal cannot span a line; a template can,
      // but a class list that does is not safely patchable either way.
      if ((current === "\n" || current === "\r") && quote !== "`") break;
      if (current === quote) {
        terminated = true;
        break;
      }
      value += current;
      cursor += 1;
    }

    if (!terminated) {
      index += 1;
      continue;
    }

    if (value.length >= minLength && value.length <= maxLength) {
      literals.push({ quote, value, raw: `${quote}${value}${quote}` });
    }
    recurse(value);
    index = cursor + 1;
  }

  return literals;
}
