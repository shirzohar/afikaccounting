"use client";

import { ExternalLink, Eye, EyeOff, Pencil } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { setExamPublished } from "@/lib/actions/admin-exams";
import { TOPICS } from "@/lib/catalog";
import type { AdminExamRow } from "@/lib/data/admin";
import { examWhen } from "@/lib/exams/types";
import { shortDate } from "@/lib/utils";
import { DataTable } from "./data-table";

const iconBtn = "grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg";
const topicName = (id: string) => TOPICS.find((t) => t.id === id)?.title ?? id;

export function ExamTable({ rows }: { rows: AdminExamRow[] }) {
  const publish = async (r: AdminExamRow) => {
    const res = await setExamPublished(r.id, !r.published);
    if (!res.ok) alert(res.error);
  };
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.id}
      searchText={(r) => [r.title, topicName(r.topic), r.year, ...r.subjects].join(" ")}
      initialSort={{ key: "updated", dir: "desc" }}
      empty="אין עדיין מבחנים. צרו מבחן ראשון."
      filters={[
        { key: "topic", label: "קורס", options: TOPICS.map((t) => ({ value: t.id, label: t.title })), test: (r, v) => r.topic === v },
        { key: "status", label: "סטטוס", options: [{ value: "1", label: "פורסם" }, { value: "0", label: "טיוטה" }], test: (r, v) => r.published === (v === "1") },
      ]}
      columns={[
        {
          key: "title",
          label: "מבחן",
          sort: (r) => r.title,
          render: (r) => (
            <Link href={`/admin/exams/${r.id}`} className="group block">
              <span className="font-medium text-fg group-hover:text-accent">{r.title}</span>
              <span className="block text-xs text-muted">
                {topicName(r.topic)} · {examWhen(r)}
              </span>
            </Link>
          ),
        },
        {
          key: "content",
          label: "תוכן",
          render: (r) => (
            <span className="flex flex-wrap gap-1">
              <Badge tone={r.hasPaper ? "success" : "neutral"}>{r.hasPaper ? "שאלון" : "בלי שאלון"}</Badge>
              <Badge tone={r.hasSteps ? "success" : "warning"}>{r.hasSteps ? "פתרון" : "בלי פתרון"}</Badge>
              {r.isSample && <Badge tone="accent">לדוגמה</Badge>}
            </span>
          ),
        },
        { key: "status", label: "סטטוס", sort: (r) => Number(r.published), render: (r) => <Badge tone={r.published ? "success" : "warning"}>{r.published ? "פורסם" : "טיוטה"}</Badge> },
        { key: "updated", label: "עודכן", sort: (r) => r.updatedAt, className: "whitespace-nowrap", render: (r) => <span className="text-xs text-muted">{shortDate(r.updatedAt)}</span> },
        {
          key: "actions",
          label: "",
          className: "w-px whitespace-nowrap",
          render: (r) => (
            <div className="flex justify-end gap-0.5">
              <button type="button" onClick={() => publish(r)} aria-label={r.published ? "העברה לטיוטה" : "פרסום"} title={r.published ? "העברה לטיוטה" : "פרסום"} className={iconBtn}>
                {r.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {r.published && (
                <a href={`/exams/${r.id}`} target="_blank" rel="noopener noreferrer" aria-label="צפייה באתר" title="צפייה באתר" className={iconBtn}>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <Link href={`/admin/exams/${r.id}`} aria-label="עריכה" title="עריכה" className={iconBtn}>
                <Pencil className="h-4 w-4" />
              </Link>
            </div>
          ),
        },
      ]}
    />
  );
}
