import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

const productLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
];

const companyLinks = [
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--soft-gray)] px-5 pb-8 pt-16 sm:px-7 lg:px-10 lg:pt-20">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr]">
          <div className="max-w-[350px]">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Nesteeq Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </div>

              <span className="text-xl font-bold tracking-[-0.03em] text-[var(--ink)]">
                Nesteeq
              </span>
            </Link>

            <p className="mt-5 text-sm leading-7 text-[var(--text)]">
              Apartment management,<br />
              organized around your community.
            </p>

            <Link
              href="/register"
              className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)]"
            >
              Get started
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <FooterColumn title="Product" links={productLinks} />

          <FooterColumn title="Company" links={companyLinks} />

          <FooterColumn title="Legal" links={legalLinks} />
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-black/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--text)]">
            © {new Date().getFullYear()} Nesteeq. All rights reserved.
          </p>

          <p className="text-xs text-[var(--text)]">
            Apartment management, simplified.
          </p>
        </div>
      </div>
    </footer>
  );
}

type FooterColumnProps = {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
};

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[var(--ink)]">
        {title}
      </h4>

      <ul className="mt-5 space-y-3.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-[var(--text)] transition-colors duration-200 hover:text-[var(--brand)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
