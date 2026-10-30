"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle, LockKeyhole, Trash2, X } from "lucide-react";
import {
  AdminApiError,
  deleteAdminRow,
  getAdminRow,
  updateAdminRow,
} from "@/lib/api";
import type { AdminRowDetail, AdminTable } from "@/lib/api";
import {
  adminErrorMessage,
  columnLabel,
  createDraft,
  displayCell,
  draftChanges,
  readOnlyReason,
  rebaseDraft,
  tableLabels,
} from "@/lib/admin-database";
import type { AdminDraft } from "@/lib/admin-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  table: AdminTable;
  id: string;
  onClose: (refresh?: boolean) => void;
  onSuccess: (message: string) => void;
  restoreFocus: () => void;
}

export function DatabaseRecordEditor({
  table,
  id,
  onClose,
  onSuccess,
  restoreFocus,
}: Props) {
  const [detail, setDetail] = useState<AdminRowDetail | null>(null);
  const [draft, setDraft] = useState<AdminDraft>({});
  const [error, setError] = useState<unknown>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadVersion, setLoadVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const confirmationOpener = useRef<HTMLElement | null>(null);
  const [confirm, setConfirm] = useState<"discard" | "delete" | null>(null);
  const [reviewRequired, setReviewRequired] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [reloading, setReloading] = useState(false);
  const state = detail
    ? draftChanges(table, detail.item, draft)
    : { dirty: false, changes: {}, errors: {} };
  const terminal =
    error instanceof AdminApiError && [401, 403, 404].includes(error.status);

  useEffect(() => {
    const controller = new AbortController();
    getAdminRow(table.table, id, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (table.columns.some((column) => !(column.key in result.item)))
          throw new AdminApiError(502, "חסרים שדות בתשובת השרת");
        setDetail(result);
        setDraft(createDraft(table, result.item));
        setError(null);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause);
      });
    return () => controller.abort();
  }, [table, id, loadVersion]);

  useEffect(() => {
    if (!state.dirty && !busy) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [state.dirty, busy]);

  function requestClose() {
    if (pending.current || reloading) return;
    if (state.dirty) openConfirmation("discard");
    else onClose(error instanceof AdminApiError && error.status === 404);
  }
  function openConfirmation(kind: "discard" | "delete") {
    confirmationOpener.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setConfirm(kind);
  }
  function edit(key: string, value: AdminDraft[string]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([field]) => field !== key),
      ),
    );
  }
  async function reloadForReview() {
    if (pending.current || reloading || !detail) return;
    setReloading(true);
    try {
      const fresh = await getAdminRow(table.table, id);
      if (table.columns.some((column) => !(column.key in fresh.item)))
        throw new AdminApiError(502, "חסרים שדות בתשובת השרת");
      setDraft(rebaseDraft(table, detail.item, draft, fresh.item));
      setDetail(fresh);
      setReviewRequired(true);
      setReviewed(false);
      setError(null);
      setFieldErrors({});
    } catch (cause) {
      setError(cause);
    } finally {
      setReloading(false);
    }
  }
  async function mutate(operation: "save" | "delete") {
    if (
      !detail ||
      pending.current ||
      reloading ||
      terminal ||
      (operation === "save" &&
        (!table.canUpdate ||
          !Object.keys(state.changes).length ||
          Object.keys(state.errors).length ||
          (reviewRequired && !reviewed))) ||
      (operation === "delete" && !table.canDelete)
    )
      return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      if (operation === "delete") {
        await deleteAdminRow(table.table, id, detail.revision);
        onSuccess(`הרשומה ${id} נמחקה בהצלחה`);
      } else {
        const updated = await updateAdminRow(
          table.table,
          id,
          state.changes,
          detail.revision,
        );
        onSuccess(
          table.table === "products" && "itemName" in state.changes
            ? `השינויים נשמרו. קבוצת המוצר: ${displayCell(updated.item.groupId)}`
            : "השינויים נשמרו בהצלחה",
        );
      }
    } catch (cause) {
      setConfirm(null);
      setError(cause);
      if (cause instanceof AdminApiError) setFieldErrors(cause.fieldErrors);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent
          dir="rtl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus();
          }}
          onEscapeKeyDown={(event) => {
            if (confirm || busy || reloading) event.preventDefault();
          }}
        >
          <header className="flex items-start justify-between gap-4 border-b p-5">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-lg font-semibold">
                עריכת רשומה · {tableLabels[table.table] ?? table.label}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                מזהה:{" "}
                <bdi dir="ltr" className="break-all font-mono">
                  {id}
                </bdi>
                . רק השדות המורשים ניתנים לעריכה.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={requestClose}
              disabled={busy || reloading}
              aria-label="סגירת חלון העריכה"
            >
              <X />
            </Button>
          </header>
          <div className="min-h-0 space-y-5 overflow-y-auto p-5">
            {error !== null && (
              <div
                role="alert"
                className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <p>{adminErrorMessage(error)}</p>
                {error instanceof AdminApiError && error.status === 401 && (
                  <Link href="/developers" className="underline">
                    להתחברות מחדש
                  </Link>
                )}
                {detail && !terminal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void reloadForReview()}
                    disabled={busy || reloading}
                  >
                    {reloading
                      ? "טוען…"
                      : "טעינת נתונים עדכניים תוך שמירת הטיוטה"}
                  </Button>
                )}
                {!detail && !terminal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setLoadVersion((value) => value + 1);
                    }}
                  >
                    ניסיון נוסף
                  </Button>
                )}
                {terminal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onClose(true)}
                  >
                    סגירה ורענון
                  </Button>
                )}
              </div>
            )}
            {!detail && error === null && (
              <p
                role="status"
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <LoaderCircle className="size-4 animate-spin" />
                טוען את הרשומה העדכנית…
              </p>
            )}
            {detail && (
              <>
                {table.table === "products" && (
                  <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    שינוי שם המוצר יחשב מחדש את השם המנורמל ואת הקישור לקבוצת
                    המוצרים.
                  </p>
                )}
                {table.table === "product_groups" && (
                  <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    שינוי שם הקבוצה מעדכן את שם התצוגה בלבד. זהות הקבוצה ושיוך
                    המוצרים נשארים כפי שהם.
                  </p>
                )}
                {reviewRequired && (
                  <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                    <p>
                      נטענו נתונים עדכניים. הטיוטה שלך נשמרה; הערכים השמורים
                      מוצגים ליד השדות ששונו.
                    </p>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={reviewed}
                        onChange={(event) => setReviewed(event.target.checked)}
                        disabled={busy}
                        className="mt-1 accent-primary"
                      />
                      בדקתי את הערכים העדכניים ואני מאשר/ת שמירה
                    </label>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {table.columns.map((column) => {
                    const fieldId = `record-${column.key}`;
                    const value = draft[column.key];
                    const message =
                      fieldErrors[column.key] ?? state.errors[column.key];
                    const disabled =
                      busy ||
                      reloading ||
                      !table.canUpdate ||
                      terminal ||
                      value === null;
                    return (
                      <div
                        key={column.key}
                        className={`min-w-0 space-y-2 rounded-lg border p-3 ${column.editable ? "" : "bg-muted/30"}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-1">
                          <label
                            htmlFor={column.editable ? fieldId : undefined}
                            className="text-sm font-medium"
                          >
                            {columnLabel(column)}
                          </label>
                          {!column.editable && (
                            <LockKeyhole
                              className="size-3.5 text-muted-foreground"
                              aria-hidden
                            />
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          <bdi dir="ltr">{column.dbColumn}</bdi>
                        </p>
                        {column.editable ? (
                          <>
                            {column.type === "boolean" ? (
                              <select
                                id={fieldId}
                                value={value === true ? "true" : "false"}
                                onChange={(event) =>
                                  edit(
                                    column.key,
                                    event.target.value === "true",
                                  )
                                }
                                disabled={disabled}
                                aria-invalid={!!message}
                                aria-describedby={
                                  message ? `${fieldId}-error` : undefined
                                }
                                className="h-9 w-full rounded-lg border bg-background px-2 text-sm disabled:opacity-50"
                              >
                                <option value="true">כן</option>
                                <option value="false">לא</option>
                              </select>
                            ) : column.type === "text" ? (
                              <textarea
                                id={fieldId}
                                dir="auto"
                                rows={2}
                                value={typeof value === "string" ? value : ""}
                                onChange={(event) =>
                                  edit(column.key, event.target.value)
                                }
                                disabled={disabled}
                                aria-invalid={!!message}
                                aria-describedby={
                                  message ? `${fieldId}-error` : undefined
                                }
                                className="min-h-16 w-full resize-y rounded-lg border bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                              />
                            ) : (
                              <Input
                                id={fieldId}
                                dir="ltr"
                                type="text"
                                inputMode={
                                  column.type === "integer"
                                    ? "numeric"
                                    : "decimal"
                                }
                                value={typeof value === "string" ? value : ""}
                                onChange={(event) =>
                                  edit(column.key, event.target.value)
                                }
                                disabled={disabled}
                                aria-invalid={!!message}
                                aria-describedby={
                                  message ? `${fieldId}-error` : undefined
                                }
                              />
                            )}
                            {column.nullable && (
                              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <input
                                  type="checkbox"
                                  checked={value === null}
                                  onChange={(event) =>
                                    edit(
                                      column.key,
                                      event.target.checked
                                        ? null
                                        : (createDraft(table, detail.item)[
                                            column.key
                                          ] ??
                                            (column.type === "boolean"
                                              ? false
                                              : "")),
                                    )
                                  }
                                  disabled={
                                    busy ||
                                    reloading ||
                                    !table.canUpdate ||
                                    terminal
                                  }
                                  className="accent-primary"
                                />
                                ללא ערך (NULL)
                              </label>
                            )}
                            {reviewRequired &&
                              value !==
                                createDraft(table, detail.item)[column.key] && (
                                <p className="wrap-break-word text-xs text-muted-foreground">
                                  הערך השמור כעת:{" "}
                                  <bdi dir="auto">
                                    {displayCell(detail.item[column.key])}
                                  </bdi>
                                </p>
                              )}
                            {message && (
                              <p
                                id={`${fieldId}-error`}
                                className="text-xs text-destructive"
                              >
                                {message}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap wrap-break-word text-sm">
                              <bdi dir="auto">
                                {displayCell(detail.item[column.key])}
                              </bdi>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {readOnlyReason(column)}
                              {column.reference && (
                                <>
                                  {" "}
                                  ·{" "}
                                  {tableLabels[column.reference.table] ??
                                    column.reference.table}
                                </>
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 p-4">
            <Button
              variant="destructive"
              disabled={
                !detail || !table.canDelete || busy || reloading || terminal
              }
              onClick={() => openConfirmation("delete")}
            >
              <Trash2 />
              מחיקת רשומה
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={busy || reloading}
                onClick={requestClose}
              >
                ביטול
              </Button>
              <Button
                disabled={
                  !detail ||
                  !table.canUpdate ||
                  !Object.keys(state.changes).length ||
                  !!Object.keys(state.errors).length ||
                  busy ||
                  reloading ||
                  terminal ||
                  (reviewRequired && !reviewed)
                }
                onClick={() => void mutate("save")}
              >
                {busy && <LoaderCircle className="animate-spin" />}שמירה
              </Button>
            </div>
          </footer>
          <span role="status" className="sr-only">
            {busy
              ? "שומר את הפעולה, נא להמתין"
              : reloading
                ? "טוען נתונים עדכניים"
                : ""}
          </span>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
      >
        <AlertDialogContent
          dir="rtl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (confirmationOpener.current?.isConnected)
              confirmationOpener.current.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <AlertDialogTitle className="text-lg font-semibold">
            {confirm === "delete" ? "מחיקת רשומה" : "ביטול השינויים?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
            {confirm === "delete" ? (
              <>
                למחוק לצמיתות את הרשומה{" "}
                <bdi dir="ltr" className="break-all font-mono">
                  {id}
                </bdi>{" "}
                מתוך {tableLabels[table.table]}? שינויים שלא נשמרו יבוטלו.
                רשומות מקושרות ימנעו מחיקה.
              </>
            ) : (
              "יש שינויים שלא נשמרו. סגירת החלון תבטל אותם."
            )}
          </AlertDialogDescription>
          {busy && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              מוחק את הרשומה, נא להמתין…
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={busy}>
                חזרה לעריכה
              </Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                confirm === "delete" ? void mutate("delete") : onClose()
              }
            >
              {busy && <LoaderCircle className="animate-spin" />}
              {confirm === "delete" ? "מחיקה לצמיתות" : "ביטול השינויים וסגירה"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
