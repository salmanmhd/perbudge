"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveModalProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Desktop → centered Dialog. Mobile → bottom Drawer. One API for both.
 * `children` may be a render-prop receiving a `close()` callback.
 */
export function ResponsiveModal({
  trigger,
  title,
  description,
  children,
  open: controlledOpen,
  onOpenChange,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const body =
    typeof children === "function"
      ? (children as (c: () => void) => React.ReactNode)(() => setOpen(false))
      : children;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-[460px] p-6 rounded-3xl border-border/60 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-1">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="px-4 pb-6 pt-4 border-t-border/60 rounded-t-3xl max-h-[92vh]">
        <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-4 shrink-0" />
        <div className="overflow-y-auto px-1">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {body}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
