import type { TaskStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/taskMachine";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</Badge>;
}
