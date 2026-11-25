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
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, Link2, Plane, Search, TrainFront } from "lucide-react";
import type { Guest } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShaadiStore } from "@/stores/useShaadiStore";
import { copyText } from "@/hooks/useCopy";
import { inviteUrl } from "@/lib/messages";
import { formatDateTime } from "@/lib/data";

type RsvpSummary = "yes" | "no" | "pending" | "mixed";

function rsvpSummary(g: Guest): RsvpSummary {
  const statuses = new Set(g.invitedFunctionIds.map((id) => g.rsvps.find((r) => r.functionId === id)?.status ?? "pending"));
  if (statuses.size === 1) return [...statuses][0] as RsvpSummary;
  if (statuses.has("pending")) return "pending";
  return "mixed";
}

const RSVP_BADGE: Record<RsvpSummary, { label: string; variant: "free" | "unavailable" | "busy" | "secondary" }> = {
  yes: { label: "Aa rahe hain", variant: "free" },
  no: { label: "Nahi aa paayenge", variant: "unavailable" },
  pending: { label: "Jawab baaki", variant: "busy" },
  mixed: { label: "Kuch functions", variant: "secondary" },
};

export function GuestTable() {
  const guests = useShaadiStore((s) => s.guests);
  const config = useShaadiStore((s) => s.publishedConfig);
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);

  const fnName = (id: string) => config.functions.find((f) => f.id === id)?.name ?? id.replace("fn-", "");

  const columns = useMemo<ColumnDef<Guest>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Naam <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[150px]">
            <p className="font-medium">{row.original.name}</p>
            <p className="text-muted-foreground text-xs">{row.original.phone}</p>
          </div>
        ),
      },
      {
        accessorKey: "side",
        header: "Side",
        filterFn: "equals",
        cell: ({ getValue }) => <Badge variant={getValue() === "bride" ? "default" : "accent"}>{getValue() === "bride" ? "Ladki wale" : "Ladke wale"}</Badge>,
      },
      {
        id: "functions",
        header: "Invited to",
        accessorFn: (g) => g.invitedFunctionIds.map(fnName).join(" "),
        cell: ({ row }) => (
          <div className="flex max-w-[240px] flex-wrap gap-1">
            {row.original.invitedFunctionIds.map((id) => {
              const r = row.original.rsvps.find((x) => x.functionId === id);
              return (
                <Badge key={id} variant={r?.status === "yes" ? "free" : r?.status === "no" ? "stale" : "outline"} className="text-[10px]">
                  {fnName(id)}
                </Badge>
              );
            })}
          </div>
        ),
      },
      {
        id: "rsvp",
        header: "RSVP",
        accessorFn: (g) => rsvpSummary(g),
        filterFn: "equals",
        cell: ({ getValue }) => {
          const b = RSVP_BADGE[getValue<RsvpSummary>()];
          return <Badge variant={b.variant}>{b.label}</Badge>;
        },
      },
      {
        id: "headcount",
        header: "Log",
        accessorFn: (g) => Math.max(0, ...g.rsvps.map((r) => (r.status === "yes" ? r.headcount : 0))),
      },
      {
        id: "food",
        header: "Khana",
        accessorFn: (g) => g.rsvps[0]?.food ?? "veg",
        cell: ({ getValue }) => {
          const f = getValue<string>();
          return <span className="text-xs">{f === "veg" ? "🟢 Veg" : f === "jain" ? "🟡 Jain" : "🔴 Non-veg"}</span>;
        },
      },
      {
        id: "arrival",
        header: "Arrival",
        accessorFn: (g) => g.arrival?.time ?? "",
        cell: ({ row }) => {
          const a = row.original.arrival;
          if (!a) return <span className="text-muted-foreground text-xs">Local</span>;
          return (
            <span className="flex items-center gap-1 text-xs whitespace-nowrap">
              {a.mode === "flight" ? <Plane className="size-3" /> : <TrainFront className="size-3" />}
              {formatDateTime(a.time)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="outline" onClick={() => copyText(inviteUrl(row.original.id), `${row.original.name} ka invite link copy hua`)}>
              <Link2 /> Copy invite link
            </Button>
            <Button size="icon" variant="ghost" asChild aria-label="Open invite">
              <Link href={`/invite/${row.original.id}`} target="_blank">
                <ExternalLink />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: guests,
    columns,
    state: { sorting, globalFilter: query, columnFilters: filters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const setFilter = (id: string, value: string) => table.getColumn(id)?.setFilterValue(value === "all" ? undefined : value);

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="relative md:w-72">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input placeholder="Naam, phone ya function…" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Select defaultValue="all" onValueChange={(v) => setFilter("side", v)}>
            <SelectTrigger className="md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Dono side</SelectItem>
              <SelectItem value="bride">Ladki wale</SelectItem>
              <SelectItem value="groom">Ladke wale</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all" onValueChange={(v) => setFilter("rsvp", v)}>
            <SelectTrigger className="md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Saare RSVP</SelectItem>
              <SelectItem value="yes">Aa rahe hain</SelectItem>
              <SelectItem value="pending">Jawab baaki</SelectItem>
              <SelectItem value="no">Nahi aa paayenge</SelectItem>
              <SelectItem value="mixed">Kuch functions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground self-center text-xs md:ml-auto">
          {table.getFilteredRowModel().rows.length} / {guests.length} guests
        </p>
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
                  Koi guest nahi mila.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
