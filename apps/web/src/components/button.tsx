import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "toggle" | "icon";
type Size = "sm" | "md" | "lg";

const SHAPE: Record<Variant, string> = {
  primary: "rounded-2xl",
  secondary: "rounded-2xl",
  toggle: "rounded-full",
  icon: "rounded-full",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-12 px-6 text-sm",
  lg: "h-[52px] px-7 text-[15px]",
};

const ICON_SIZE: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

// Gaya "liquid glass": permukaan tembus pandang + blur + garis tepi terang tipis
// (before: gradient) buat kesan pantulan cahaya di kaca.
const BASE =
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden font-medium " +
  "backdrop-blur-md transition-all duration-200 " +
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:content-[''] " +
  "before:bg-gradient-to-b before:from-white/30 before:to-white/0 before:opacity-70 " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-70";

function tone(variant: Variant, active: boolean, disabled: boolean) {
  if (disabled) {
    return "border border-keytabee-border/60 bg-keytabee-surface-muted/70 text-keytabee-disabled";
  }
  switch (variant) {
    case "primary":
      return "border border-white/15 bg-keytabee-ink/80 text-white shadow-[0_8px_24px_-10px_rgba(1,35,64,0.55)] hover:bg-keytabee-ink/90";
    case "secondary":
      return "border border-keytabee-border/70 bg-white/40 text-keytabee-ink shadow-[0_4px_16px_-8px_rgba(1,35,64,0.25)] hover:bg-white/60";
    case "toggle":
      return active
        ? "border border-white/15 bg-keytabee-ink/80 text-white shadow-[0_6px_18px_-10px_rgba(1,35,64,0.5)]"
        : "border border-white/50 bg-white/35 text-keytabee-ink hover:bg-white/55";
    case "icon":
      return "border border-white/50 bg-white/50 text-keytabee-ink shadow-[0_4px_14px_-6px_rgba(1,35,64,0.35)] hover:bg-white/70";
  }
}

type CommonProps = {
  variant?: Variant;
  active?: boolean;
  size?: Size;
  fullWidth?: boolean;
  href?: string;
  className?: string;
  children: ReactNode;
};

export type ButtonProps = CommonProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof CommonProps
  >;

export function Button({
  variant = "primary",
  active = false,
  size = "md",
  fullWidth = false,
  href,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    BASE,
    SHAPE[variant],
    variant === "icon" ? ICON_SIZE[size] : SIZE[size],
    tone(variant, active, !!disabled),
    fullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    if (href.startsWith("http")) {
      return (
        <a href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
