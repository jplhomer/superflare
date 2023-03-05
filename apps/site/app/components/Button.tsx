import { Link } from "@remix-run/react";
import clsx from "clsx";

const styles = {
  primary:
    "rounded-full bg-rose-300 py-2 px-4 text-sm font-semibold text-slate-900 hover:bg-rose-200 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300/50 active:bg-rose-500",
  secondary:
    "rounded-full bg-slate-800 py-2 px-4 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 active:text-slate-400",
};

export function Button({
  variant = "primary",
  className,
  href,
  ...props
}: {
  variant?: keyof typeof styles;
  className?: string;
  href?: string;
} & React.ComponentProps<"button" | typeof Link>) {
  className = clsx(styles[variant], className);

  return href ? (
    <Link to={href} className={className} {...props} />
  ) : (
    <button className={className} {...props} />
  );
}
