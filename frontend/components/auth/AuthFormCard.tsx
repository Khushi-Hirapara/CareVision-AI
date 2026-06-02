import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface AuthFormCardProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthFormCard({
  title,
  description,
  children,
  footer,
}: AuthFormCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gradient-to-b from-teal-50/40 via-slate-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
          <div className="mt-6">{children}</div>
          <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
            {footer}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p>
      {prompt}{" "}
      <Link
        href={href}
        className="font-semibold text-teal-700 hover:text-teal-800"
      >
        {label}
      </Link>
    </p>
  );
}
