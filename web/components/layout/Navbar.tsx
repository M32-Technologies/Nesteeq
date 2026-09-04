"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LogOut, Menu, UserCircle, X } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = session?.user;
  const userName = user?.name || user?.email || "Profile";
  const userInitial = userName.charAt(0).toUpperCase();
  const isAuthLoading = isPending;

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    router.push("/");
    router.refresh();
  };

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
            <>
              <div className="flex h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 text-sm font-semibold text-[var(--ink)]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand)] text-xs text-white">
                  {userInitial}
                </span>
                <span className="max-w-32 truncate">{userName}</span>
              </div>

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)] transition hover:bg-black/[0.04]"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
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
                <div className="mt-4 space-y-3">
                  <div className="flex h-11 items-center gap-2 rounded-full border border-black/[0.08] px-3 text-sm font-semibold text-[var(--ink)]">
                    <UserCircle className="h-5 w-5 text-[var(--brand)]" />
                    <span className="truncate">{userName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-black/[0.08] text-sm font-semibold"
                  >
                    <LogOut size={15} />
                    Sign out
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
