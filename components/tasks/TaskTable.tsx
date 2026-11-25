"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle2, Search, Wand2, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Task } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { TaskStatusBadge } from "./StatusBadge";
import { formatDateTime } from "@/lib/data";
import { canTransition } from "@/lib/taskMachine";

const TABS = [
  { value: "active", label: "Active", match: (t: Task) => !["completed", "canceled"].includes(t.status) },
  { value: "offered", label: "Offered", match: (t: Task) => t.status === "offered" || t.status === "declined" },
  { value: "in_progress", label: "On the way", match: (t: Task) => t.status === "in_progress" || t.status === "accepted" },
  { value: "external", label: "Uber/Rapido", match: (t: Task) => t.status === "external" },
  { value: "completed", label: "Done", match: (t: Task) => t.status === "completed" },
  { value: "all", label: "All", match: () => true },
];

export function TaskTable() {
  const tasks = useShaadiStore((s) => s.tasks);
  const helpers = useShaadiStore((s) => s.helpers);
  const vehicles = useShaadiStore((s) => s.vehicles);
  const guests = useShaadiStore((s) => s.guests);
  const dispatchTask = useShaadiStore((s) => s.dispatchTask);
  const completeTask = useShaadiStore((s) => s.completeTask);
  const cancelTask = useShaadiStore((s) => s.cancelTask);
  const [tab, setTab] = useState("active");
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "time", desc: false }]);

  const data = useMemo(() => tasks.filter(TABS.find((t) => t.value === tab)!.match), [tasks, tab]);

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Task",
        cell: ({ row }) => {
          const t = row.original;
          const g = guests.find((x) => x.id === t.guestId);
          return (
            <div className="min-w-[200px]">
              <Link href={`/tasks/${t.id}`} className="font-medium hover:underline">
                {t.title}
              </Link>
              <p className="text-muted-foreground text-xs">
                {t.waypoints[0]?.label} → {t.waypoints[t.waypoints.length - 1]?.label}
                {g && ` · ${g.name}`}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => <Badge variant="outline">{getValue<string>() === "pickup" ? "Pickup" : "Errand"}</Badge>,
      },
      {
        accessorKey: "time",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Time <ArrowUpDown />
          </Button>
        ),
        cell: ({ getValue }) => <span className="whitespace-nowrap">{formatDateTime(getValue<string>())}</span>,
      },
      { accessorKey: "peopleCount", header: "Log", cell: ({ getValue }) => getValue<number>() },
      {
        id: "assigned",
        header: "Assigned",
        accessorFn: (t) =>
          t.externalBooking
            ? `${t.externalProvider} ${t.externalBooking.driverName}`
            : `${helpers.find((h) => h.id === t.assignedHelperId)?.name ?? ""} ${vehicles.find((v) => v.id === t.assignedVehicleId)?.name ?? ""}`,
        cell: ({ row }) => {
          const t = row.original;
          if (t.externalBooking)
            return (
              <span className="text-xs">
                {t.externalProvider}: {t.externalBooking.driverName}
                <br />
                <span className="text-muted-foreground">{t.externalBooking.plate}</span>
              </span>
            );
          const h = helpers.find((x) => x.id === t.assignedHelperId);
          const v = vehicles.find((x) => x.id === t.assignedVehicleId);
          if (!h) return <span className="text-muted-foreground text-xs">Abhi koi nahi</span>;
          return (
            <span className="text-xs">
              {h.name}
              {v && (
                <>
                  <br />
                  <span className="text-muted-foreground">
                    {v.name} · {v.plateNumber}
                  </span>
                </>
              )}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Status <ArrowUpDown />
          </Button>
        ),
        cell: ({ getValue }) => <TaskStatusBadge status={getValue<Task["status"]>()} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="flex justify-end gap-1">
              {canTransition(t.status, "offered") && (
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    const r = dispatchTask(t.id);
                    if (r?.ok) toast.success(`${r.helper.name} ko offer bheja`);
                  }}
                >
                  <Wand2 /> Assign
                </Button>
              )}
              {["accepted", "in_progress", "external"].includes(t.status) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const r = completeTask(t.id);
                    if (r.ok) toast.success("Mark done ✅", { description: t.title });
                    else toast.error(r.error);
                  }}
                >
                  <CheckCircle2 /> Mark done
                </Button>
              )}
              {canTransition(t.status, "canceled") && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Cancel task"
                  title="Cancel"
                  onClick={() => {
                    const r = cancelTask(t.id);
                    if (r.ok) toast("Task cancel kiya", { description: t.title });
                  }}
                >
                  <XCircle className="text-muted-foreground" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [guests, helpers, vehicles, dispatchTask, completeTask, cancelTask]
  );

  // TanStack Table returns functions that cannot be memoized; this is expected.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full md:w-fit">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <span className="text-muted-foreground text-[10px]">{tasks.filter(t.match).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative md:w-72">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input placeholder="Search tasks, helpers, guests…" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                  Is tab mein koi task nahi.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
