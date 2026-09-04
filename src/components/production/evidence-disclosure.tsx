"use client";

import type { ReactNode } from "react";
import { ACSButton, ACSDrawer } from "@/components/acs";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./evidence-disclosure.module.css";

interface EvidenceFieldBase {
  id: string;
  label: string;
  description?: string;
}

export interface VisibleEvidenceField extends EvidenceFieldBase {
  value: string;
  sensitivity: "ordinary" | "restricted";
  copyAllowed: boolean;
  redactedReason?: never;
}

export interface RedactedEvidenceField extends EvidenceFieldBase {
  value?: never;
  sensitivity: "redacted";
  copyAllowed: false;
  redactedReason: string;
}

export type EvidenceFieldView = VisibleEvidenceField | RedactedEvidenceField;

export interface EvidenceDisclosureProps {
  title: string;
  summary: string;
  fields: readonly EvidenceFieldView[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "inline" | "panel" | "drawer";
  copyAction?: (field: VisibleEvidenceField) => void;
  closeLabel: string;
  triggerLabel?: string;
  className?: string;
}

function EvidenceFields({
  fields,
  copyAction,
}: Pick<EvidenceDisclosureProps, "fields" | "copyAction">) {
  if (fields.length === 0) {
    return <p className={styles.empty}>尚无可核验证据</p>;
  }

  return (
    <dl className={styles.fields}>
      {fields.map((field) => (
        <div key={field.id} className={styles.field} data-evidence-sensitivity={field.sensitivity}>
          <dt>
            <span>{field.label}</span>
            <span className={styles.sensitivity}>
              {field.sensitivity === "ordinary"
                ? "普通"
                : field.sensitivity === "restricted"
                  ? "受限"
                  : "已脱敏"}
            </span>
          </dt>
          <dd>
            {field.sensitivity === "redacted" ? (
              <span className={styles.redactedReason}>{field.redactedReason}</span>
            ) : (
              <code data-evidence-value="true">{field.value}</code>
            )}
            {field.description && <span className={styles.description}>{field.description}</span>}
            {field.sensitivity !== "redacted" && field.copyAllowed && copyAction && (
              <ACSButton
                variant="ghost"
                size="small"
                onClick={() => copyAction(field)}
                aria-label={`复制${field.label}`}
              >
                复制
              </ACSButton>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DisclosureBody({
  summary,
  fields,
  copyAction,
}: Pick<EvidenceDisclosureProps, "summary" | "fields" | "copyAction">) {
  return (
    <>
      <p className={styles.summary}>{summary}</p>
      <EvidenceFields fields={fields} copyAction={copyAction} />
    </>
  );
}

export function EvidenceDisclosure({
  title,
  summary,
  fields,
  open,
  onOpenChange,
  mode,
  copyAction,
  closeLabel,
  triggerLabel = "查看技术证据",
  className,
}: EvidenceDisclosureProps) {
  const trigger: ReactNode = (
    <ACSButton
      variant="ghost"
      size="small"
      onClick={() => onOpenChange(!open)}
      aria-expanded={open}
    >
      {open && mode !== "drawer" ? "收起技术证据" : triggerLabel}
    </ACSButton>
  );

  if (mode === "drawer") {
    return (
      <div className={mergeClassNames(styles.drawerTrigger, className)}>
        {trigger}
        <ACSDrawer
          open={open}
          onClose={() => onOpenChange(false)}
          title={title}
          description={summary}
          side="right"
          size="wide"
          closeLabel={closeLabel}
        >
          <EvidenceFields fields={fields} copyAction={copyAction} />
        </ACSDrawer>
      </div>
    );
  }

  return (
    <section
      aria-label={title}
      className={mergeClassNames(styles.disclosure, className)}
      data-mode={mode}
    >
      <header className={styles.header}>
        <h2>{title}</h2>
        {trigger}
      </header>
      {open && <DisclosureBody summary={summary} fields={fields} copyAction={copyAction} />}
    </section>
  );
}
