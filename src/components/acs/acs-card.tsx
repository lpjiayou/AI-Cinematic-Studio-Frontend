import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./acs.module.css";

export type ACSCardTone = "default" | "raised" | "selected" | "ai";
export type ACSCardPadding = "compact" | "default" | "spacious";

export interface ACSCardProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  tone?: ACSCardTone;
  padding?: ACSCardPadding;
  interactive?: boolean;
}

export const ACSCard = forwardRef<HTMLElement, ACSCardProps>(function ACSCard(
  {
    children,
    className,
    title,
    description,
    headerAction,
    footer,
    tone = "default",
    padding = "default",
    interactive = false,
    ...props
  },
  ref,
) {
  return (
    <article
      ref={ref}
      className={mergeClassNames(styles.card, className)}
      data-tone={tone}
      data-padding={padding}
      data-interactive={interactive || undefined}
      {...props}
    >
      {(title || description || headerAction) && (
        <header className={styles.cardHeader}>
          <div className={styles.cardHeading}>
            {title && <h3 className={styles.cardTitle}>{title}</h3>}
            {description && (
              <div className={styles.cardDescription}>{description}</div>
            )}
          </div>
          {headerAction && <div className={styles.cardAction}>{headerAction}</div>}
        </header>
      )}
      <div className={styles.cardBody}>{children}</div>
      {footer && <footer className={styles.cardFooter}>{footer}</footer>}
    </article>
  );
});
