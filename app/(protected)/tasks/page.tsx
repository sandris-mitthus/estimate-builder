import { TodoBoard } from "@/app/components/todo-board";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { listTodoCategories } from "@/app/lib/todo/repository";

export default async function TasksPage() {
  await assertNavAccess("todo");
  const [categories, { t }] = await Promise.all([
    listTodoCategories(),
    getServerTranslations(),
  ]);

  return (
    <TodoBoard
      initialCategories={categories}
      title={t("nav.todo", "Darāmo darbu saraksts")}
      subtitle={t(
        "todo.page.subtitle",
        "Veido kategorijas, pievieno darbus un pārvelc tos augšup, lejup vai uz citu kategoriju.",
      )}
    />
  );
}
