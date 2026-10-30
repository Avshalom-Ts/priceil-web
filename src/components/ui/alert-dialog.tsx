"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTitle = AlertDialogPrimitive.Title;
export const AlertDialogDescription = AlertDialogPrimitive.Description;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export function AlertDialogContent({
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-70 bg-black/50" />
      <AlertDialogPrimitive.Content
        className="fixed inset-s-1/2 top-1/2 z-70 w-[calc(100%-2rem)] max-w-md -translate-y-1/2 rounded-xl border bg-background p-6 text-foreground shadow-xl outline-none ltr:-translate-x-1/2 rtl:translate-x-1/2"
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}
