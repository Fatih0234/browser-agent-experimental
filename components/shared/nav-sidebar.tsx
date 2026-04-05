"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOrg } from "@/lib/org-context";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Bell,
  ClipboardList,
  Shield,
  Truck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

export function NavSidebar() {
  const pathname = usePathname();
  const { currentOrg, isAdmin } = useOrg();

  if (!currentOrg) return null;

  const basePath = `/${currentOrg.slug}`;

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: basePath,
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Cases",
      href: `${basePath}/cases`,
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      label: "Documents",
      href: `${basePath}/documents`,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: "Notifications",
      href: `${basePath}/notifications`,
      icon: <Bell className="h-4 w-4" />,
    },
    {
      label: "Logistics",
      href: `${basePath}/logistics`,
      icon: <Truck className="h-4 w-4" />,
    },
    {
      label: "Marketplace",
      href: `${basePath}/marketplace`,
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      label: "HR Portal",
      href: `${basePath}/hr`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Audit Log",
      href: `${basePath}/audit-log`,
      icon: <ClipboardList className="h-4 w-4" />,
      adminOnly: true,
    },
    {
      label: "Admin",
      href: `${basePath}/admin/seed`,
      icon: <Shield className="h-4 w-4" />,
      adminOnly: true,
    },
  ];

  return (
    <nav className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <ul className="space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
        </ul>
      </div>
    </nav>
  );
}
