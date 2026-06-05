"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogSize = "sm" | "md" | "lg" | "xl";
const SIZE_CLASS: Record<DialogSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-[960px]",
  lg: "sm:max-w-[1080px]",
  xl: "sm:max-w-[1240px]",
};

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize;
  hideClose?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = "md", hideClose, ...props }, ref) => {
  // Detect if caller already provides a max-w-* class so legacy callers keep working.
  const callerHasMaxWidth = typeof className === "string" && /\bmax-w-/.test(className);
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 flex w-[calc(100vw-2rem)] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden border bg-background shadow-2xl rounded-2xl",
          "max-h-[85vh] duration-200",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          // Auto-style direct children:
          // - DialogHeader: sticky-feeling top with border + padding
          // - DialogFooter: sticky-feeling bottom with border + padding
          // - Anything else (the body) becomes the scrollable region
          "[&>[data-dialog-header]]:shrink-0 [&>[data-dialog-header]]:border-b [&>[data-dialog-header]]:border-border/60 [&>[data-dialog-header]]:px-6 [&>[data-dialog-header]]:py-4 [&>[data-dialog-header]]:bg-background",
          "[&>[data-dialog-footer]]:shrink-0 [&>[data-dialog-footer]]:border-t [&>[data-dialog-footer]]:border-border/60 [&>[data-dialog-footer]]:px-6 [&>[data-dialog-footer]]:py-3.5 [&>[data-dialog-footer]]:bg-background/95 [&>[data-dialog-footer]]:backdrop-blur",
          "[&>:not([data-dialog-header]):not([data-dialog-footer])]:min-h-0 [&>:not([data-dialog-header]):not([data-dialog-footer])]:flex-1 [&>:not([data-dialog-header]):not([data-dialog-footer])]:overflow-y-auto [&>:not([data-dialog-header]):not([data-dialog-footer])]:px-6 [&>:not([data-dialog-header]):not([data-dialog-footer])]:py-5 [&>:not([data-dialog-header]):not([data-dialog-footer])]:finder-scroll",
          !callerHasMaxWidth && SIZE_CLASS[size],
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-dialog-header=""
    className={cn("flex flex-col gap-1 text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-dialog-footer=""
    className={cn("flex flex-row items-center justify-end gap-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-[17px] font-semibold leading-tight tracking-tight text-foreground",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

/* ------------------------------------------------------------------ */
/* Form helpers — shared layout primitives for modal forms.            */
/* Use inside the scrollable body region.                              */
/* ------------------------------------------------------------------ */

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-6 last:mb-0", className)}>
      {(title || description) && (
        <header className="mb-3">
          {title && (
            <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground/80">{description}</p>
          )}
        </header>
      )}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function FormField({
  label,
  required,
  full,
  hint,
  children,
  className,
}: {
  label?: React.ReactNode;
  required?: boolean;
  full?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", full && "sm:col-span-2", className)}>
      {label && (
        <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
