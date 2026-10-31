import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExamEditor } from "@/components/admin/exam-editor";
import { AdminHeader, AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { getExamAdmin, unlessSetupRequired } from "@/lib/data/admin";

export const metadata: Metadata = { title: "עריכת מבחן" };

/** `/admin/exams/new` creates; any other segment is the id of an exam to edit. */
export default function AdminExamEditPage({ params }: PageProps<"/admin/exams/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/exams/[id]">["params"] }) {
  const { id } = await params;
  await requireAdmin(`/admin/exams/${id}`);
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const loaded = await unlessSetupRequired(Promise.all([isNew ? null : getExamAdmin(id)]));
  if (!loaded) return <SetupRequired />;
  const [exam] = loaded;
  if (!isNew && !exam) notFound();
  return (
    <>
      <AdminHeader
        title={exam ? exam.title : "מבחן חדש"}
        description={
          <Link href="/admin/exams" className="hover:text-accent">
            → חזרה לרשימת המבחנים
          </Link>
        }
      />
      <ExamEditor key={exam?.id ?? "new"} exam={exam ?? undefined} />
    </>
  );
}
