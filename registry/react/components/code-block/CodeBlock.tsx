import { Check, Copy } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { Button } from "./Button";
import { mergeClasses } from "./classes";
import type { Shadow, ThemeInput } from "./theme";
import {
  BalsaThemeContext,
  useResolvedThemeProps,
} from "./theme-context";
import type { Rounded } from "./types";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

const languageAliases: Readonly<Record<string, string>> = {
  bash: "bash",
  css: "css",
  html: "xml",
  javascript: "typescript",
  js: "typescript",
  json: "json",
  plaintext: "plaintext",
  prompt: "plaintext",
  shell: "bash",
  sh: "bash",
  text: "plaintext",
  ts: "typescript",
  typescript: "typescript",
  vue: "xml",
  xml: "xml",
};

export type CodeBlockSize = "sm" | "md" | "lg";
/**
 * `block` is the full anatomy: a header carrying the caption and actions above
 * the source. `inline` is the one-line form for a single command — the source
 * and the copy action share one row, and the caption belongs outside the block.
 */
export type CodeBlockLayout = "block" | "inline";

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  code: string;
  language?: string;
  label?: string;
  layout?: CodeBlockLayout;
  copyable?: boolean;
  wrap?: boolean;
  lineNumbers?: boolean;
  collapsedLines?: number;
  size?: CodeBlockSize;
  rounded?: Rounded;
  shadow?: Shadow;
  theme?: ThemeInput;
  actions?: ReactNode;
}

const sizeClasses: Readonly<Record<CodeBlockSize, { code: string; header: string; pre: string }>> = {
  sm: { code: "text-xs leading-5", header: "min-h-9 px-balsa-md", pre: "p-balsa-md" },
  md: { code: "text-sm leading-6", header: "min-h-10 px-balsa-md", pre: "p-balsa-lg" },
  lg: { code: "text-base leading-7", header: "min-h-12 px-balsa-lg", pre: "p-balsa-xl" },
};
const roundedClasses: Readonly<Record<Rounded, string>> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
  xl: "rounded-xl", "2xl": "rounded-2xl", "3xl": "rounded-3xl", full: "rounded-full",
};
const lineHeightBySize: Readonly<Record<CodeBlockSize, number>> = {
  sm: 20,
  md: 24,
  lg: 28,
};
const verticalPaddingBySize: Readonly<Record<CodeBlockSize, number>> = {
  sm: 24,
  md: 32,
  lg: 40,
};

export function CodeBlock(rawProps: CodeBlockProps) {
  const { props, theme } = useResolvedThemeProps("code-block", "surfaces", rawProps, {
    size: "md",
    rounded: "lg",
    shadow: "auto",
  } as const);
  const {
    code,
    language = "text",
    label,
    layout = "block",
    copyable = true,
    wrap = false,
    lineNumbers = false,
    collapsedLines,
    size,
    rounded,
    shadow,
    theme: _themeInput,
    actions,
    className,
    style,
    ...domProps
  } = props;
  void _themeInput;

  const [copied, setCopied] = useState(false);
  const [copyUnavailable, setCopyUnavailable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const collapseKey = `${code}\0${collapsedLines ?? ""}`;
  const [seenCollapseKey, setSeenCollapseKey] = useState(collapseKey);
  if (seenCollapseKey !== collapseKey) {
    setSeenCollapseKey(collapseKey);
    setExpanded(false);
  }
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const copyLabel = copied ? "Copied" : copyUnavailable ? "Copy unavailable" : "Copy";
  const copyIcon = copied ? Check : Copy;
  const codeClasses = mergeClasses(
    "hljs block bg-transparent p-0 text-balsa-code-foreground",
    sizeClasses[size].code,
    wrap ? "min-w-0 whitespace-pre-wrap break-words" : "min-w-max whitespace-pre",
  );
  const rootClasses = mergeClasses(
    "w-full min-w-0 max-w-full overflow-hidden border-balsa-code-foreground/10 bg-balsa-code text-balsa-code-foreground",
    roundedClasses[rounded],
    className,
  );
  const headerClasses = mergeClasses(
    "flex items-center justify-between gap-balsa-md border-b border-balsa-code-foreground/10",
    sizeClasses[size].header,
  );
  const textActionClasses =
    "h-7 shrink-0 gap-balsa-3xs border-transparent bg-transparent px-balsa-2xs text-xs text-balsa-code-foreground hover:bg-transparent hover:underline focus-visible:outline-balsa-code-foreground";
  const iconActionClasses =
    "h-7 w-7 shrink-0 border-transparent bg-transparent p-0 text-balsa-code-foreground hover:bg-transparent focus-visible:outline-balsa-code-foreground";
  const preClasses = mergeClasses("overflow-x-auto", sizeClasses[size].pre);
  const inlineRowClasses = mergeClasses(
    "flex items-center gap-balsa-md",
    sizeClasses[size].header,
  );
  const numberedLineClasses = mergeClasses(
    "min-w-0 flex-1",
    wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
  );
  const numberedRowClasses = mergeClasses(
    "flex",
    wrap ? "min-w-0" : "min-w-max",
  );
  const normalizedCollapsedLines = collapsedLines === undefined || !Number.isFinite(collapsedLines)
    ? undefined
    : Math.max(1, Math.floor(collapsedLines));
  const canExpand = normalizedCollapsedLines !== undefined
    && code.split("\n").length > normalizedCollapsedLines;
  const isCollapsed = canExpand && !expanded;
  const previewStyle: CSSProperties | undefined = isCollapsed && normalizedCollapsedLines !== undefined
    ? {
        maxHeight: `${verticalPaddingBySize[size] + lineHeightBySize[size] * normalizedCollapsedLines}px`,
        overflowY: "hidden",
      }
    : undefined;
  const highlightLanguage = languageAliases[language.toLowerCase()] ?? "plaintext";
  const highlightedCode = hljs.highlight(code, {
    language: highlightLanguage,
    ignoreIllegals: true,
  }).value;
  const highlightedLines = highlightedCode.split("\n");
  const showHeader = Boolean(label || copyable || actions || (canExpand && expanded));

  async function copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyUnavailable(false);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setCopied(false);
        resetTimer.current = undefined;
      }, 1800);
    } catch {
      setCopyUnavailable(true);
    }
  }

  const copyButton = copyable ? (
    <Button
      variant="outline"
      color="primary"
      size={null}
      prefixIcon={copyIcon}
      aria-label={`${copyLabel} code`}
      className={iconActionClasses}
      onClick={() => copyCode()}
    />
  ) : null;

  return (
    <BalsaThemeContext.Provider value={theme}>
      <div
        {...domProps}
        data-balsa="code-block"
        data-theme={theme.explicitPresentation?.id}
        data-theme-base={theme.explicitPresentation?.base}
        data-size={size}
        data-layout={layout}
        data-rounded={rounded}
        data-shadow={shadow}
        className={rootClasses}
        style={
          {
            ...style,
            ...theme.explicitPresentation?.style,
          } as CSSProperties
        }
      >
        {layout === "inline" ? (
          <div className={inlineRowClasses}>
            <pre className="min-w-0 flex-1 overflow-x-auto">
              <code
                className={codeClasses}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
            {actions}
            {copyButton}
          </div>
        ) : (
          <>
            {showHeader ? (
              <div className={headerClasses}>
                <span data-balsa-code-label="" className="min-w-0 truncate font-mono text-xs">
                  {label ?? language}
                </span>
                <div data-balsa-code-actions="" className="flex shrink-0 items-center gap-balsa-xs">
                  {actions}
                  {canExpand && expanded ? (
                    <Button
                      data-balsa-code-collapse=""
                      type="button"
                      variant="outline"
                      color="primary"
                      size={null}
                      className={textActionClasses}
                      onClick={() => setExpanded(false)}
                    >
                      Show less
                    </Button>
                  ) : null}
                  {copyButton}
                </div>
              </div>
            ) : null}
            <div className="relative min-w-0">
              <pre className={preClasses} style={previewStyle}>
                {lineNumbers ? (
                  <code className={mergeClasses(codeClasses, "min-w-0")}>
                    {highlightedLines.map((line, index) => (
                      <span key={`${index}-${line}`} className={numberedRowClasses}>
                        <span
                          className="mr-balsa-lg w-6 shrink-0 select-none text-right text-balsa-code-foreground/40"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                        <span
                          className={numberedLineClasses}
                          dangerouslySetInnerHTML={{ __html: line || " " }}
                        />
                      </span>
                    ))}
                  </code>
                ) : (
                  <code
                    className={codeClasses}
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                )}
              </pre>
              {isCollapsed ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-balsa-code via-balsa-code/95 to-transparent pb-balsa-md">
                  <Button
                    data-balsa-code-expand=""
                    type="button"
                    variant="outline"
                    color="primary"
                    size={null}
                    className="pointer-events-auto border-transparent bg-transparent px-balsa-2xs text-xs text-balsa-code-foreground hover:bg-transparent hover:underline focus-visible:outline-balsa-code-foreground"
                    onClick={() => setExpanded(true)}
                  >
                    See more
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        )}
        <span className="sr-only" aria-live="polite">
          {copied ? "Code copied to clipboard." : ""}
        </span>
      </div>
    </BalsaThemeContext.Provider>
  );
}
