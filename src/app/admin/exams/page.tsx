import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ExamTable } from "@/components/admin/exam-table";
import { AdminHeader, AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/dal";
import { listExamsAdmin, unlessSetupRequired } from "@/lib/data/admin";

export const metadata: Metadata = { title: "מבחנים" };

export default function AdminExamsPage() {
  return (
    <>
      <AdminHeader
        title="מבחנים"
        description="מתחם המבחנים: שאלון, פתרון שלב אחר שלב, סרטון וקובץ פתרון. הקבצים בתיקייה פרטית — נפתחים רק למנויי ״קורסים + מבחנים״, ולכולם במבחן ״לדוגמה״."
        actions={
          <ButtonLink href="/admin/exams/new" size="sm">
            <Plus className="h-3.5 w-3.5" /> מבחן חדש
          </ButtonLink>
        }
      />
      <Suspense fallback={<AdminSkeleton />}>
        <List />
      </Suspense>
    </>
  );
}

async function List() {
  await requireAdmin("/admin/exams");
  const rows = await unlessSetupRequired(listExamsAdmin());
  return rows ? <ExamTable rows={rows} /> : <SetupRequired />;
}
