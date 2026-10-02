"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  LogOut,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import {
  dashboardRoleLabels,
  normalizeDashboardRole,
} from "@/features/dashboard/config/sidebar-navigation";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending, isRefetching } = useSession();

  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const user = isMounted ? session?.user : null;
  const userName = user?.name || user?.email || "Profile";
  const userInitials = user?.name ? getInitials(user.name) : userName.charAt(0).toUpperCase();
  const isAuthLoading = !isMounted || isPending || (!session && isRefetching);

  const userRole = normalizeDashboardRole(user?.role);
  const roleLabel =
    user?.role?.trim().toLowerCase() === "admin"
      ? "Administrator"
      : dashboardRoleLabels[userRole] || "Resident";

  const handleSignOut = async () => {
    await signOut();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    let scrolled = false;
    let frame = 0;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (!scrolled && scrollY > 24) {
        scrolled = true;
        setIsScrolled(true);
      }

      if (scrolled && scrollY < 8) {
        scrolled = false;
        setIsScrolled(false);
      }
    };

    frame = window.requestAnimationFrame(() => {
      handleScroll();
    });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-200 ${
        isScrolled
          ? "border-black/[0.05] bg-white/95 shadow-sm backdrop-blur-md"
          : "border-transparent bg-white/0 shadow-none backdrop-blur-0"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-7 lg:px-10">
        <Link href="/" className="text-xl font-bold tracking-[-0.03em] text-[var(--ink)]">
          Nesteeq
        </Link>

        <div className="hidden items-center lg:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-[var(--ink)]"
                    : "text-[var(--text)] hover:text-[var(--ink)]"
                }`}
              >
                {item.label}

                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[var(--brand)]"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthLoading ? (
            <div className="h-10 w-40 animate-pulse rounded-full bg-black/[0.06]" />
          ) : user ? (
            <div ref={profileDropdownRef} className="relative">
              <button
                type="button"
                aria-label="User Profile Menu"
                aria-expanded={isProfileOpen}
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="
                  flex
                  h-10
                  cursor-pointer
                  items-center
                  gap-2.5
                  rounded-lg
                  px-2
                  text-left
                  transition-colors
                  duration-150
                  hover:bg-black/[0.04]
                "
              >
                {/* Avatar */}
                <span
                  className="
                    flex
                    size-8
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    bg-[#0F766E]
                    text-[11px]
                    font-bold
                    tracking-wide
                    text-white
                    ring-2
                    ring-white
                  "
                  style={{ boxShadow: '0 0 0 2px #E2E8F0' }}
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={userName}
                      width={32}
                      height={32}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : userInitials ? (
                    userInitials
                  ) : (
                    <UserRound className="size-4" />
                  )}
                </span>

                {/* Name + role */}
                <span className="min-w-0 text-left">
                  <span className="block max-w-36 truncate text-[13px] font-semibold leading-[1.3] text-[#0F172A]">
                    {userName}
                  </span>
                  <span className="block max-w-36 truncate text-[11px] font-medium leading-[1.3] text-[#94A3B8]">
                    {roleLabel}
                  </span>
                </span>
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#DDE3DF] bg-white p-2 shadow-lg z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-[#EEF1F4] mb-1">
                    <p className="text-xs font-semibold text-[#111111] truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] text-[#637083] truncate">
                      {user.email}
                    </p>
                    <p className="text-[11px] text-[#0F766E] font-semibold mt-0.5">
                      {roleLabel}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-[#111111] hover:bg-[#F7F8F5] transition-colors"
                  >
                    <Settings className="size-3.5 text-[#637083]" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      void handleSignOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="size-3.5 text-red-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-black/[0.04]"
              >
                Log in
              </Link>

              <Link
                href="/pricing"
                className="group flex h-10 items-center gap-2 rounded-full bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--brand-hover)]"
              >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setIsMenuOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center lg:hidden"
        >
          {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-black/[0.05] bg-white lg:hidden"
          >
            <div className="px-5 py-4 sm:px-7">
              <div className="flex flex-col">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="border-b border-black/[0.05] py-3.5 text-sm font-semibold text-[var(--ink)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {isAuthLoading ? (
                <div className="mt-4 h-11 animate-pulse rounded-full bg-black/[0.06]" />
              ) : user ? (
                <div className="mt-4 space-y-2 border-t border-black/[0.05] pt-3">
                  <div className="px-3 py-2 bg-slate-50 rounded-lg mb-2">
                    <p className="text-xs font-semibold text-[#111111] truncate">{userName}</p>
                    <p className="text-[11px] text-[#637083] truncate">{user.email}</p>
                    <p className="text-[11px] text-[#0F766E] font-semibold mt-0.5">{roleLabel}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium text-[#111111] hover:bg-[#F7F8F5] transition-colors"
                  >
                    <Settings className="size-3.5 text-[#637083]" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="size-3.5 text-red-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex h-11 items-center justify-center rounded-full border border-black/[0.08] text-sm font-semibold"
                  >
                    Log in
                  </Link>

                  <Link
                    href="/pricing"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand)] text-sm font-semibold text-white"
                  >
                    Get started
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
