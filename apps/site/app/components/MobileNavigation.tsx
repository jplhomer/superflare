import { useEffect, useState } from "react";
import { Link, useNavigation } from "@remix-run/react";
import { Dialog } from "@headlessui/react";

import { Logomark } from "~/components/Logo";
import { Navigation } from "~/components/Navigation";
import { Manifest } from "~/docs.server";

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      {...props}
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      {...props}
    >
      <path d="M5 5l14 14M19 5l-14 14" />
    </svg>
  );
}

export function MobileNavigation({ navigation }: { navigation: Manifest }) {
  let router = useNavigation();
  let [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsOpen(false);
  }, [router.state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative"
        aria-label="Open navigation"
      >
        <MenuIcon className="h-6 w-6 stroke-slate-500" />
      </button>
      <Dialog
        open={isOpen}
        onClose={setIsOpen}
        className="fixed inset-0 z-50 flex items-start overflow-y-auto bg-slate-900/50 pr-10 backdrop-blur lg:hidden"
        aria-label="Navigation"
      >
        <Dialog.Panel className="min-h-full w-full max-w-xs bg-white px-4 pt-5 pb-12 dark:bg-slate-900 sm:px-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation"
            >
              <CloseIcon className="h-6 w-6 stroke-slate-500" />
            </button>
            <Link to="/" className="ml-6" aria-label="Home page">
              <Logomark className="h-9 w-9" />
            </Link>
          </div>
          <Navigation navigation={navigation} className="mt-5 px-1" />
        </Dialog.Panel>
      </Dialog>
    </>
  );
}
