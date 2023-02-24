import clsx from "clsx";
import type { ElementType } from "react";

export function FormField({
  label,
  name,
  as = "input",
  wrapperClassName = "",
  inputClassName = "",
  options,
  ...props
}: {
  label: string;
  name: string;
  as?: ElementType;
  wrapperClassName?: string;
  inputClassName?: string;
  options?: { label: string; value: string }[];
} & React.ComponentPropsWithoutRef<ElementType>) {
  const Component = as;

  return (
    <div className={clsx("sm:col-span-4", wrapperClassName)}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <div className="mt-1">
        {/* @ts-ignore */}
        <Component
          id={name}
          name={name}
          className={clsx(
            "block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700",
            inputClassName
          )}
          {...props}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Component>
      </div>
    </div>
  );
}
