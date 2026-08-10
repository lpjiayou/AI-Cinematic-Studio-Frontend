"use client";

import type { ReactNode } from "react";
import { ACSDrawer } from "@/components/acs";

export interface InspectorDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
}

export function InspectorDrawer({
  open,
  onClose,
  title = "检查器",
  description,
  children,
  footer,
  closeLabel = "关闭检查器",
}: InspectorDrawerProps) {
  return (
    <ACSDrawer
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      side="right"
      size="narrow"
      closeLabel={closeLabel}
    >
      {children}
    </ACSDrawer>
  );
}
