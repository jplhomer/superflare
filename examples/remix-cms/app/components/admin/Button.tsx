import { Link } from "@remix-run/react";
import clsx from "clsx";

export function Button({
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
        "block rounded-md bg-indigo-600 py-1.5 px-3 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center space-x-1",
        className
      )}
      to={to}
      {...props}
    >
      {children}
    </Component>
  );
}

export function SecondaryButton({
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
} & React.ComponentPropsWithoutRef<"button"> &
  React.ComponentPropsWithoutRef<typeof Link>) {
  let Component = to ? Link : as;

  return (
    <Component
      className={clsx(
        "rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center space-x-1",
        className
      )}
      to={to}
      {...props}
    >
      {children}
    </Component>
  );
}
