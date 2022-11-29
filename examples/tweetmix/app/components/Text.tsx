export function ThiccTitle({
  as = "h1",
  children,
}: {
  as?: string | React.ReactNode;
  children: React.ReactNode;
}) {
  const Component = as as React.ElementType;
  return <Component className="text-4xl font-bold">{children}</Component>;
}

export function ValidationError({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-red-500 dark:text-red-300" role="alert">
      {children}
    </div>
  );
}

export function Heading({
  children,
  as = "h2",
}: {
  children: React.ReactNode;
  as?: string | React.ReactNode;
}) {
  const Component = as as React.ElementType;
  return (
    <Component className="text-2xl font-bold p-4 fixed top-0 bg-white dark:bg-black w-full max-w-2xl border-r border-gray-300 dark:border-gray-700">
      {children}
    </Component>
  );
}
