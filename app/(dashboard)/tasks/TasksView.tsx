"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { TaskTable } from "@/components/tasks/TaskTable";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";

export function TasksView() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Every pickup and errand is a dispatch order: created → offered → accepted → on the way → done."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> New task
          </Button>
        }
      />
      <div className="px-3 pb-6 md:px-6">
        <TaskTable />
      </div>
      <NewTaskDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
