import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./acs.module.css";

export type ACSButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ACSButtonSize = "small" | "medium" | "large";

export interface ACSButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ACSButtonVariant;
  size?: ACSButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export const ACSButton = forwardRef<HTMLButtonElement, ACSButtonProps>(
  function ACSButton(
    {
      children,
      className,
      variant = "primary",
      size = "medium",
      loading = false,
      leadingIcon,
      trailingIcon,
      fullWidth = false,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={mergeClassNames(styles.button, className)}
        data-variant={variant}
        data-size={size}
        data-full-width={fullWidth || undefined}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <span className={styles.spinner} aria-hidden="true" /> : leadingIcon}
        <span className={styles.buttonLabel}>{children}</span>
        {!loading && trailingIcon}
      </button>
    );
  },
);
