import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { getAccess } from "@/lib/auth/access";
import { getCurrentUser, getProfile, isAdmin } from "@/lib/auth/dal";
import { ContinueButton, ContinueView } from "./continue";
import { Logo } from "./logo";
import { MobileNav, MobileNavView, NavLinks, NavLinksView } from "./nav-links";
import { SearchTrigger } from "./search";
import { ThemeToggle } from "./theme-toggle";
import { GuestActions, UpgradeButton, UserMenu } from "./user-menu";

export function Navbar() {
  return (
    <header className="glass no-print sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 md:gap-6 lg:px-8">
        <Logo />
        <Suspense fallback={<NavLinksView />}>
          <NavLinks />
        </Suspense>
        <div className="ms-auto flex items-center gap-1.5">
          <Suspense fallback={<ContinueView />}>
            <ContinueButton />
          </Suspense>
          <SearchTrigger />
          <ThemeToggle />
          <Suspense fallback={<Skeleton className="h-9 w-24" />}>
            <AuthArea />
          </Suspense>
          <Suspense fallback={<MobileNavView />}>
            <MobileNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/** Reads the session, so it streams in behind its own Suspense boundary. */
async function AuthArea() {
  const user = await getCurrentUser();
  if (!user) return <GuestActions />;
  const [profile, admin, access] = await Promise.all([getProfile(), isAdmin(), getAccess()]);
  return (
    <>
      {access.tier === "free" && <UpgradeButton />}
      <UserMenu name={profile?.fullName || user.email.split("@")[0]} email={user.email} admin={admin} />
    </>
  );
}
