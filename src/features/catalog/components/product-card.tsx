import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "./ui/card";

export function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  accent: "blue" | "green" | "amber" | "gray";
}) {
  const accentClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-700",
  } as const;

  return (
    <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-lg">
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <span
            aria-hidden
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold ${accentClasses[accent]}`}
          >
            {value}
          </span>
        </div>
      </Card>
    </Link>
  );
}

export function QuickLinkCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="block rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
      <div className="flex items-center gap-3">
        <span aria-hidden className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="truncate text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}
