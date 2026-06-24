import { TodoListPageContent } from "@/app/components/todo-list-board";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";

export default async function TodoPage() {
  await assertSystemAdminAccess();

  return <TodoListPageContent />;
}
