import clsx from "clsx";

import { Icon } from "~/components/Icon";

const styles = {
  note: {
    container:
      "bg-gray-100 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10",
    title: "text-gray-900 dark:text-gray-400",
    body: "text-gray-800 [--tw-prose-background:theme(colors.rose.50)] prose-a:text-gray-900 prose-code:text-gray-900 dark:text-slate-300 dark:prose-code:text-slate-300",
  },
  warning: {
    container:
      "bg-amber-50 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10",
    title: "text-amber-900 dark:text-amber-500",
    body: "text-amber-800 [--tw-prose-underline:theme(colors.amber.400)] [--tw-prose-background:theme(colors.amber.50)] prose-a:text-amber-900 prose-code:text-amber-900 dark:text-slate-300 dark:[--tw-prose-underline:theme(colors.sky.700)] dark:prose-code:text-slate-300",
  },
};

const icons = {
  note: (props: Omit<React.ComponentProps<typeof Icon>, "icon">) => (
    <Icon icon="lightbulb" {...props} />
  ),
  warning: (props: Omit<React.ComponentProps<typeof Icon>, "icon">) => (
    <Icon icon="warning" color="amber" {...props} />
  ),
};

export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: "note" | "warning";
  title: string;
  children: React.ReactNode;
}) {
  let IconComponent = icons[type];

  return (
    <div className={clsx("my-8 flex rounded-3xl p-6", styles[type].container)}>
      <IconComponent className="h-8 w-8 flex-none" />
      <div className="ml-4 flex-auto">
        <p className={clsx("m-0 font-display text-xl", styles[type].title)}>
          {title}
        </p>
        <div className={clsx("prose mt-2.5", styles[type].body)}>
          {children}
        </div>
      </div>
    </div>
  );
}
