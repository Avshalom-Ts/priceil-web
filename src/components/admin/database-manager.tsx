"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Search,
} from "lucide-react";
import { AdminApiError, getAdminRows, getAdminTables } from "@/lib/api";
import type {
  AdminDatabaseTableName,
  AdminPageSize,
  AdminRowsResult,
  AdminTable,
} from "@/lib/api";
import {
  adminErrorMessage,
  columnLabel,
  displayCell,
  tableLabels,
} from "@/lib/admin-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatabaseRecordEditor } from "./database-record-editor";

interface View {
  table: AdminDatabaseTableName;
  input: string;
  q: string;
  limit: AdminPageSize;
  page: number;
}
type MetadataState = {
  version: number;
  tables?: AdminTable[];
  error?: unknown;
};
type RowsState = { key: string; data?: AdminRowsResult; error?: unknown };

export function DatabaseManager() {
  const [metadataVersion, setMetadataVersion] = useState(0);
  const [metadata, setMetadata] = useState<MetadataState>({ version: -1 });
  const [view, setView] = useState<View>({
    table: "products",
    input: "",
    q: "",
    limit: 25,
    page: 1,
  });
  const [refresh, setRefresh] = useState(0);
  const [rows, setRows] = useState<RowsState>({ key: "" });
  const [selection, setSelection] = useState<{
    table: AdminTable;
    id: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const opener = useRef<HTMLElement | null>(null);
  const toolbarFocus = useRef<HTMLButtonElement | null>(null);
  const metadataReady = metadata.version === metadataVersion;
  const tables = metadataReady ? (metadata.tables ?? []) : [];
  const table =
    tables.find((candidate) => candidate.table === view.table) ?? tables[0];
  const key = JSON.stringify([
    table?.table,
    view.q,
    view.page,
    view.limit,
    refresh,
    metadataVersion,
  ]);
  const result = rows.key === key ? rows : null;
  const searching = view.input.trim() !== view.q;
  const loading = !!table && (!result || searching);
  const data = loading ? undefined : result?.data;
  const error =
    metadataReady && metadata.error
      ? metadata.error
      : loading
        ? null
        : result?.error;
  const metaLoading = !metadataReady;

  useEffect(() => {
    const controller = new AbortController();
    getAdminTables(controller.signal)
      .then((tables) => {
        if (!controller.signal.aborted)
          setMetadata({ version: metadataVersion, tables });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setMetadata({ version: metadataVersion, error });
      });
    return () => controller.abort();
  }, [metadataVersion]);

  useEffect(() => {
    const q = view.input.trim();
    if (q === view.q) return;
    const timer = setTimeout(
      () => setView((previous) => ({ ...previous, q, page: 1 })),
      300,
    );
    return () => clearTimeout(timer);
  }, [view.input, view.q]);

  useEffect(() => {
    if (!table) return;
    const controller = new AbortController();
    getAdminRows(
      table.table,
      { q: view.q, page: view.page, limit: view.limit },
      controller.signal,
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        if (
          data.items.some((row) =>
            table.columns.some((column) => !(column.key in row)),
          )
        )
          throw new AdminApiError(502, "חסרות עמודות בתשובת השרת");
        if (data.page !== view.page || data.limit !== view.limit)
          throw new AdminApiError(502, "נתוני העימוד אינם תואמים לבקשה");
        if (view.page > Math.max(1, data.totalPages)) {
          setView((previous) => ({
            ...previous,
            page: Math.max(1, data.totalPages),
          }));
          return;
        }
        setRows({ key, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setRows({ key, error });
      });
    return () => controller.abort();
  }, [table, view.q, view.page, view.limit, key]);

  function retry() {
    if (metadata.error || !tables.length)
      setMetadataVersion((version) => version + 1);
    else setRefresh((version) => version + 1);
  }
  function restoreFocus() {
    requestAnimationFrame(() => {
      if (opener.current?.isConnected) opener.current.focus();
      else toolbarFocus.current?.focus();
    });
  }

  return (
    <div className="min-w-0 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Database className="size-6 text-primary" aria-hidden />
          <h1 className="text-2xl font-bold">ניהול נתוני הקטלוג</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          חיפוש, עריכה ומחיקה של רשומות בטבלאות הקיימות.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setView((previous) => ({
            ...previous,
            q: previous.input.trim(),
            page: 1,
          }));
        }}
        className="grid items-start gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[minmax(9rem,1fr)_minmax(0,2fr)_8rem_auto]"
      >
        <div className="space-y-2">
          <label id="database-table-label" className="text-sm font-medium">
            טבלה
          </label>
          <Select
            dir="rtl"
            value={table?.table ?? ""}
            disabled={!tables.length || metaLoading}
            onValueChange={(value) => {
              if (!tables.some((table) => table.table === value)) return;
              setView((previous) => ({
                ...previous,
                table: value as AdminDatabaseTableName,
                input: "",
                q: "",
                page: 1,
              }));
              setNotice("");
            }}
          >
            <SelectTrigger
              ref={toolbarFocus}
              aria-labelledby="database-table-label"
              className="h-9 w-full"
            >
              <SelectValue placeholder="בחירת טבלה" />
            </SelectTrigger>
            <SelectContent>
              {tables.map((table) => (
                <SelectItem key={table.table} value={table.table}>
                  {tableLabels[table.table] ?? table.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {table && (
            <p
              dir="ltr"
              className="text-start font-mono text-[11px] text-muted-foreground"
            >
              {table.table}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="database-search" className="text-sm font-medium">
            חיפוש בטבלה
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute end-3 top-2.5 size-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="database-search"
              className="h-9 pe-9"
              value={view.input}
              onChange={(event) =>
                setView((previous) => ({
                  ...previous,
                  input: event.target.value,
                }))
              }
              placeholder="שם, ברקוד או מזהה…"
              maxLength={200}
              disabled={!table}
              aria-describedby="database-search-hint"
            />
          </div>
          <p
            id="database-search-hint"
            className="text-xs leading-relaxed text-muted-foreground"
          >
            {table
              ? `חיפוש לפי ${table.searchableFields
                  .map((key) => {
                    const column = table.columns.find(
                      (column) => column.key === key,
                    );
                    return column ? columnLabel(column) : key;
                  })
                  .join(
                    ", ",
                  )}${table.primaryKey === "id" ? " או מזהה הרשומה" : ""}${table.table === "prices" ? " או מזהה הסניף" : ""}`
              : "בחרו טבלה כדי להתחיל"}
          </p>
        </div>
        <div className="space-y-2">
          <label id="database-limit-label" className="text-sm font-medium">
            תוצאות בעמוד
          </label>
          <Select
            dir="rtl"
            value={String(view.limit)}
            onValueChange={(value) =>
              setView((previous) => ({
                ...previous,
                limit: Number(value) as AdminPageSize,
                page: 1,
              }))
            }
            disabled={!table}
          >
            <SelectTrigger
              aria-labelledby="database-limit-label"
              className="h-9 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 75, 100].map((limit) => (
                <SelectItem key={limit} value={String(limit)}>
                  {limit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={retry}
          disabled={metaLoading || loading}
          className="mt-0 h-9 sm:mt-7"
        >
          <RefreshCw className={metaLoading || loading ? "animate-spin" : ""} />
          רענון
        </Button>
      </form>

      <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        ייבוא עתידי עשוי לדרוס עריכות ידניות או ליצור מחדש רשומות שנמחקו. מחיקה
        לא תתאפשר כשיש רשומות מקושרות.
      </p>
      <div
        role="status"
        aria-live="polite"
        className={
          notice
            ? "rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm"
            : "sr-only"
        }
      >
        {notice}
      </div>
      {error !== null && error !== undefined && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <p>{adminErrorMessage(error)}</p>
          <div className="flex gap-2">
            {error instanceof AdminApiError && error.status === 401 && (
              <Button asChild variant="outline">
                <Link href="/developers">התחברות מחדש</Link>
              </Button>
            )}
            <Button variant="outline" onClick={retry}>
              ניסיון נוסף
            </Button>
          </div>
        </div>
      )}

      <section
        aria-label="תוצאות הטבלה"
        aria-busy={loading || metaLoading}
        className="min-w-0 overflow-hidden rounded-xl border"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
          <h2 className="text-sm font-semibold">
            {table ? (tableLabels[table.table] ?? table.label) : "נתוני הקטלוג"}
          </h2>
          <span className="text-xs text-muted-foreground">
            {data ? `${data.total.toLocaleString("he-IL")} רשומות` : ""}
          </span>
        </div>
        {loading || metaLoading ? (
          <p
            role="status"
            className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"
          >
            <LoaderCircle className="size-4 animate-spin" />
            {metaLoading ? "טוען טבלאות…" : "טוען רשומות…"}
          </p>
        ) : data && table ? (
          <>
            <div
              className="max-h-[65vh] overflow-auto"
              tabIndex={0}
              aria-label="גלילה בנתוני הטבלה"
            >
              <table className="w-full border-collapse text-start text-sm">
                <caption className="sr-only">
                  {tableLabels[table.table]}. כל עמודות הטבלה. לחצו על רשומה או
                  על עריכה כדי לצפות בפרטים ולערוך.
                </caption>
                <thead className="sticky top-0 z-10 bg-muted text-start">
                  <tr>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-start font-medium"
                    >
                      פעולות
                    </th>
                    {table.columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        className="min-w-36 whitespace-nowrap px-4 py-3 text-start font-medium"
                      >
                        <div>{columnLabel(column)}</div>
                        <bdi
                          dir="ltr"
                          className="font-mono text-[10px] font-normal text-muted-foreground"
                        >
                          {column.dbColumn}
                        </bdi>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => {
                    const id = String(row[table.primaryKey]);
                    return (
                      <tr
                        key={id}
                        className="cursor-pointer border-t align-top hover:bg-muted/40 focus-within:bg-muted/40"
                        onClick={(event) => {
                          opener.current =
                            event.currentTarget.querySelector("button");
                          setSelection({ table, id });
                        }}
                      >
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`עריכת רשומה ${id}`}
                          >
                            <Pencil className="size-3.5" />
                            עריכה
                          </Button>
                        </td>
                        {table.columns.map((column) => (
                          <td key={column.key} className="max-w-72 px-4 py-3">
                            <div
                              className={`max-h-28 overflow-auto whitespace-pre-wrap break-words ${row[column.key] === null || row[column.key] === "" ? "text-xs text-muted-foreground" : ""}`}
                            >
                              <bdi dir="auto">
                                {displayCell(row[column.key])}
                              </bdi>
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {!data.items.length && (
                    <tr>
                      <td
                        colSpan={table.columns.length + 1}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        {view.q
                          ? "לא נמצאו רשומות התואמות לחיפוש."
                          : "אין רשומות בטבלה זו."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                עמוד {view.page} מתוך {Math.max(1, data.totalPages)} · עד{" "}
                {view.limit} תוצאות בעמוד
              </p>
              <nav aria-label="עימוד תוצאות" className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={view.page <= 1}
                  onClick={() =>
                    setView((previous) => ({
                      ...previous,
                      page: previous.page - 1,
                    }))
                  }
                >
                  <ChevronRight />
                  הקודם
                </Button>
                <Button
                  variant="outline"
                  disabled={view.page >= data.totalPages}
                  onClick={() =>
                    setView((previous) => ({
                      ...previous,
                      page: previous.page + 1,
                    }))
                  }
                >
                  הבא
                  <ChevronLeft />
                </Button>
              </nav>
            </div>
          </>
        ) : (
          <p className="p-12 text-center text-sm text-muted-foreground">
            {error
              ? "לא ניתן להציג את הנתונים כרגע."
              : "אין טבלאות זמינות לניהול."}
          </p>
        )}
      </section>
      {selection && (
        <DatabaseRecordEditor
          key={`${selection.table.table}/${selection.id}`}
          table={selection.table}
          id={selection.id}
          restoreFocus={restoreFocus}
          onClose={(refreshRows) => {
            setSelection(null);
            if (refreshRows) setRefresh((value) => value + 1);
          }}
          onSuccess={(message) => {
            setSelection(null);
            setNotice(message);
            setRefresh((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}
