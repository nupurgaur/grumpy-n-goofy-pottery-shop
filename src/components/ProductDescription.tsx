import * as React from "react";
import { cn } from "@/lib/utils";

type DescriptionBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

const BULLET_LINE = /^[-•*]\s+/;
const BOLD_SEGMENT = /\*\*(.+?)\*\*/g;

function renderDescriptionInline(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  BOLD_SEGMENT.lastIndex = 0;

  for (const match of text.matchAll(BOLD_SEGMENT)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }
    nodes.push(
      <strong
        key={`b-${start}`}
        className="font-semibold text-brand-primary"
      >
        {match[1]}
      </strong>,
    );
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

function normalizeDescription(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

function parseDescriptionBlocks(text: string): DescriptionBlock[] {
  const normalized = normalizeDescription(text);
  if (!normalized) return [];

  return normalized.split(/\n\n+/).flatMap((rawBlock) => {
    const lines = rawBlock
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const isList = lines.every((line) => BULLET_LINE.test(line));
    if (isList) {
      return [
        {
          type: "list" as const,
          items: lines.map((line) => line.replace(BULLET_LINE, "")),
        },
      ];
    }

    return [{ type: "paragraph" as const, text: lines.join("\n") }];
  });
}

type ProductDescriptionProps = {
  text: string;
  className?: string;
  /** Compact preview on cards — preserves line breaks, clamps height */
  compact?: boolean;
};

export function ProductDescription({
  text,
  className,
  compact = false,
}: ProductDescriptionProps) {
  const normalized = normalizeDescription(text);
  if (!normalized) return null;

  if (compact) {
    return (
      <p
        className={cn(
          "text-sm text-muted-foreground font-sans leading-relaxed whitespace-pre-line line-clamp-3",
          className,
        )}
      >
        {renderDescriptionInline(normalized)}
      </p>
    );
  }

  const blocks = parseDescriptionBlocks(normalized);

  return (
    <div
      className={cn(
        "space-y-3 text-muted-foreground font-sans leading-relaxed",
        className,
      )}
    >
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderDescriptionInline(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="whitespace-pre-line">
            {renderDescriptionInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
