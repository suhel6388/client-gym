"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Shadcn-style dialog primitives backed by Radix UI.
 *
 * Radix supplies the accessibility work (focus trapping, Escape handling,
 * scroll locking, `aria-modal`) while the classes below carry the DarkGoldGym
 * dark/gold surface treatment. Entrance and exit animations are defined in
 * `globals.css` so Radix can wait for them before unmounting the portal.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "dg-dialog-overlay fixed inset-0 z-50 bg-black/75 backdrop-blur-[6px]",
        className,
      )}
      {...props}
    />
  );
});

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function DialogContent({ className, children, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "dg-dialog-content scroll-thin z-50 w-[calc(100vw-1.5rem)] max-w-[680px] overflow-y-auto rounded-2xl border border-[rgba(212,175,55,0.28)] bg-[#151515] text-white shadow-[0_32px_90px_-24px_rgba(0,0,0,0.95),0_0_70px_-20px_rgba(212,175,55,0.32)] outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold text-white", className)}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-[13px] leading-5 text-[#A1A1AA]", className)}
      {...props}
    />
  );
});
