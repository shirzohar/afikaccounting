import { type Access, canOpenExam } from "@/lib/access";
import { TOPICS } from "@/lib/catalog";
import type { ExamMeta } from "@/lib/exams/types";
import { cn } from "@/lib/utils";
import { ExamCard } from "./exam-card";

/** A topic's name, as a card shows it ("מלאי (IAS 2)"). */
export const topicLabel = (id: string) => {
  const t = TOPICS.find((x) => x.id === id);
  return t ? (t.standard ? `${t.title} (${t.standard})` : t.title) : id;
};

/** Exams as cards, each open or locked for this reader. A locked card's paywall points to a sample to try. */
export function ExamGrid({ exams, access, blur, className }: { exams: ExamMeta[]; access: Access; blur?: boolean; className?: string }) {
  const sample = exams.find((e) => e.isSample);
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {exams.map((e) => (
        <li key={e.id} className="min-w-0">
          <ExamCard exam={e} topic={topicLabel(e.topic)} open={canOpenExam(access, e)} blur={blur} sample={sample && { href: `/exams/${sample.id}` }} />
        </li>
      ))}
    </ul>
  );
}
