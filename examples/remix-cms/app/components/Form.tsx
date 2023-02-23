import clsx from "clsx";

export function FormField({
  label,
  name,
  as = "input",
  wrapperClassName = "",
  inputClassName = "",
  ...props
}: {
  label: string;
  name: string;
  as?: "input" | "textarea";
  wrapperClassName?: string;
  inputClassName?: string;
} & React.ComponentPropsWithoutRef<"input" | "textarea">) {
  const Component = as;

  return (
    <div className={clsx("sm:col-span-4", wrapperClassName)}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1">
        {/* @ts-ignore */}
        <Component
          id={name}
          name={name}
          className={clsx(
            "block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
            inputClassName
          )}
          {...props}
        />
      </div>
    </div>
  );
}
