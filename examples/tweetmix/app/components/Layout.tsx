import { Link, NavLink } from "@remix-run/react";
import { type UserData } from "~/models/user.server";
import { Tweetmix } from "./Icons";
import { UserAvatar } from "./UserAvatar";
import {
  BellAlertIcon as SolidBellAlertIcon,
  BookmarkIcon as SolidBookmarkIcon,
  Cog8ToothIcon as SolidCog8ToothIcon,
  EnvelopeIcon as SolidEnvelopeIcon,
  HashtagIcon as SolidHashtagIcon,
  UserIcon as SolidUserIcon,
  HomeIcon as SolidHomeIcon,
} from "@heroicons/react/24/solid";
import {
  BellAlertIcon,
  BookmarkIcon,
  Cog8ToothIcon,
  EnvelopeIcon,
  HashtagIcon,
  HomeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export function Layout({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: UserData | null;
}) {
  return (
    <div className="flex min-h-screen max-w-7xl px-4 mx-auto">
      <header className="pt-1 border-r border-gray-300 dark:border-gray-700 grow-0">
        <div className="w-[275px]">
          <div className="h-full fixed top-0">
            <Link
              className="p-3 ml-2 rounded-full inline-flex"
              to="/"
              prefetch="intent"
            >
              <Tweetmix className="w-8 h-8 fill-current" />
            </Link>
            {user && (
              <NavItem
                to="/home"
                icon={<HomeIcon className="w-8 h-8 text-current" />}
                activeIcon={<SolidHomeIcon className="w-8 h-8 text-current" />}
              >
                Home
              </NavItem>
            )}
            <NavItem
              to="/explore"
              icon={<HashtagIcon className="w-8 h-8 text-current" />}
              activeIcon={<SolidHashtagIcon className="w-8 h-8 text-current" />}
            >
              Explore
            </NavItem>
            {user && (
              <>
                <NavItem
                  to="/notifications"
                  icon={<BellAlertIcon className="w-8 h-8 text-current" />}
                  activeIcon={
                    <SolidBellAlertIcon className="w-8 h-8 text-current" />
                  }
                >
                  Notifications
                </NavItem>
                <NavItem
                  to="/messages"
                  icon={<EnvelopeIcon className="w-8 h-8 text-current" />}
                  activeIcon={
                    <SolidEnvelopeIcon className="w-8 h-8 text-current" />
                  }
                >
                  Messages
                </NavItem>
                <NavItem
                  to="/bookmarks"
                  icon={<BookmarkIcon className="w-8 h-8 text-current" />}
                  activeIcon={
                    <SolidBookmarkIcon className="w-8 h-8 text-current" />
                  }
                >
                  Bookmarks
                </NavItem>
                <NavItem
                  to={"/" + user.username}
                  icon={<UserIcon className="w-8 h-8 text-current" />}
                  activeIcon={
                    <SolidUserIcon className="w-8 h-8 text-current" />
                  }
                >
                  Profile
                </NavItem>
              </>
            )}
            {!user && (
              <NavItem
                to="/settings"
                icon={<Cog8ToothIcon className="w-8 h-8 text-current" />}
                activeIcon={
                  <SolidCog8ToothIcon className="w-8 h-8 text-current" />
                }
              >
                Settings
              </NavItem>
            )}
            {user && <UserNavLink user={user} />}
          </div>
        </div>
      </header>
      <div className="w-full max-w-2xl border-r border-gray-300 dark:border-gray-700">
        {children}
      </div>
      {!user && <LoggedOutBanner />}
    </div>
  );
}

function NavItem({
  icon,
  activeIcon,
  to,
  children,
}: {
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className="flex space-x-8 text-xl py-3 px-5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 items-center"
      prefetch="intent"
    >
      {({ isActive }) => (
        <>
          {isActive ? activeIcon : icon}
          <span className={clsx(isActive && "font-bold")}>{children}</span>
        </>
      )}
    </NavLink>
  );
}

function LoggedOutBanner() {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-blue-500 p-4 text-white">
      <div className="max-w-7xl mx-auto lg:pl-[275px] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Don't miss what's happening</h2>
          <p>People on Tweetmix are the last to know.</p>
        </div>
        <div className="space-x-4">
          <Link
            to="/auth/login"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full border border-white"
          >
            Log In
          </Link>
          <Link
            to="/auth/signup"
            className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-2 px-4 rounded-full border border-white"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

function UserNavLink({ user }: { user: UserData }) {
  return (
    <Link
      className="bottom-2.5 fixed py-3 px-5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
      to={`/${user.username}`}
      prefetch="intent"
    >
      <UserAvatar user={user}>
        <span className="text-gray-600 dark:text-gray-400">
          @{user.username}
        </span>
      </UserAvatar>
    </Link>
  );
}
