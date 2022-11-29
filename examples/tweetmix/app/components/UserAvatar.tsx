import type { UserData } from "~/models/user.server";

export function UserAvatar({
  user,
  children,
}: {
  user: UserData;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-x-2 flex items-top">
      <img
        src={user.avatarUrl}
        className="w-10 h-10 rounded-full"
        alt={`${user.username}'s avatar`}
      />
      <div className="grow">{children}</div>
    </div>
  );
}
