import { Link } from "@remix-run/react";
import clsx from "clsx";

export default function Button({
  children,
  className,
  to,
  as = "button",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  to?: string;
  as?: React.ElementType;
} & React.ComponentPropsWithoutRef<"button">) {
  let Component = to ? Link : as;

  return (
    <Component
      className={clsx(
        "block rounded-md bg-indigo-600 py-1.5 px-3 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
        className
      )}
      to={to}
      {...props}
    >
      {children}
    </Component>
  );
}
