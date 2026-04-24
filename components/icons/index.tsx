"use client";

import {
  Users, Clock, AlertTriangle, FileCheck, FileText, BarChart3,
  Gift, Shirt, Download, UserPlus, ShieldAlert, LayoutDashboard,
  Briefcase, Building2, Calendar, CalendarIcon, ChevronLeft, ChevronRight,
  Eye, Filter, Loader2, LogOut, MapPin, MoreHorizontal, Pencil,
  Plus, Search, Settings, Sparkles, TrendingUp, Trash2, UserCheck,
  UserMinus, Zap, DollarSign, ArrowRight, ArrowUpRight, Info,
  type LucideProps,
} from "lucide-react";
import type { FC } from "react";

export type AppIconName =
  | "users" | "clock" | "alert-triangle" | "file-check" | "file-text"
  | "bar-chart" | "gift" | "shirt" | "download" | "user-plus"
  | "shield-alert" | "layout-dashboard" | "briefcase" | "building"
  | "calendar" | "calendar-icon" | "chevron-left" | "chevron-right"
  | "eye" | "filter" | "loader" | "log-out" | "map-pin" | "more-horizontal"
  | "pencil" | "plus" | "search" | "settings" | "sparkles" | "trending-up"
  | "trash" | "user-check" | "user-minus" | "zap" | "dollar-sign"
  | "arrow-right" | "arrow-up-right" | "info";

const ICON_MAP: Record<AppIconName, FC<LucideProps>> = {
  "users": Users,
  "clock": Clock,
  "alert-triangle": AlertTriangle,
  "file-check": FileCheck,
  "file-text": FileText,
  "bar-chart": BarChart3,
  "gift": Gift,
  "shirt": Shirt,
  "download": Download,
  "user-plus": UserPlus,
  "shield-alert": ShieldAlert,
  "layout-dashboard": LayoutDashboard,
  "briefcase": Briefcase,
  "building": Building2,
  "calendar": Calendar,
  "calendar-icon": CalendarIcon,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "eye": Eye,
  "filter": Filter,
  "loader": Loader2,
  "log-out": LogOut,
  "map-pin": MapPin,
  "more-horizontal": MoreHorizontal,
  "pencil": Pencil,
  "plus": Plus,
  "search": Search,
  "settings": Settings,
  "sparkles": Sparkles,
  "trending-up": TrendingUp,
  "trash": Trash2,
  "user-check": UserCheck,
  "user-minus": UserMinus,
  "zap": Zap,
  "dollar-sign": DollarSign,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "info": Info,
};

export function AppIcon({ name, ...props }: LucideProps & { name: AppIconName }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon {...props} />;
}
