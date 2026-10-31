import { Calc } from "@/components/basics/ui";
import { RichParagraph } from "@/components/content/rich-text";
import { Callout, DataTable, JournalEntry } from "@/components/study/blocks";
import type { ExamBlock } from "@/lib/exams/types";

/** One block of a question or a solution step, in the lessons' own component for it. Rendered on the server. */
export function ExamBlockView({ block: b }: { block: ExamBlock }) {
  switch (b.kind) {
    case "text":
      return <RichParagraph text={b.text} className="text-[15.5px] leading-relaxed text-fg/90" />;
    case "entry":
      return <JournalEntry title={b.title} date={b.date} lines={b.lines} note={b.note} />;
    case "table":
      return <DataTable caption={b.caption} head={b.head} rows={b.rows} foot={b.foot} />;
    case "calc":
      return <Calc result={b.result}>{b.text}</Calc>;
    case "note":
      return (
        <Callout kind={b.tone} title={b.title}>
          {b.text && <RichParagraph text={b.text} />}
        </Callout>
      );
  }
}

export function ExamBlocks({ blocks }: { blocks: ExamBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <ExamBlockView key={i} block={b} />
      ))}
    </div>
  );
}
