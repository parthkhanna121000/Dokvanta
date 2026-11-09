import {
  FilePenLine,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquareText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface WorkspaceNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const WORKSPACE_NAV: readonly WorkspaceNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Documents", href: "/documents", icon: FileText },
  { label: "AI Intelligence", href: "/intelligence", icon: MessageSquareText },
  { label: "AI Visual Edit", href: "/visual-edit", icon: FilePenLine },
  { label: "Document Creator", href: "/creator", icon: FilePlus2 },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "Settings", href: "/settings", icon: Settings },
];
