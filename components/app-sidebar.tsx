"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarDays,
  Wrench,
  Building2,
  CreditCard,
  Inbox,
  Settings,
  Home,
  Users,
  DollarSign,
  LogOut,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type PortalType = "landlord" | "tenant" | "admin"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: Record<PortalType, NavItem[]> = {
  landlord: [
    { label: "Overview", href: "/landlord", icon: LayoutDashboard },
    { label: "Properties", href: "/landlord/properties", icon: Building2 },
    { label: "Payments", href: "/landlord/payments", icon: CreditCard },
    { label: "Inbox", href: "/landlord/inbox", icon: Inbox },
    { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench },
    { label: "Calendar", href: "/landlord/calendar", icon: CalendarDays },
    { label: "Documents", href: "/landlord/documents", icon: FileText },
    { label: "Settings", href: "/landlord/settings", icon: Settings },
  ],
  tenant: [
    { label: "Overview", href: "/tenant", icon: LayoutDashboard },
    { label: "My Home", href: "/tenant/my-home", icon: Home },
    { label: "Inbox", href: "/tenant/inbox", icon: Inbox },
    { label: "Settings", href: "/tenant/settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Landlords", href: "/admin/landlords", icon: Users },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
}

const portalNames: Record<PortalType, string> = {
  landlord: "Landlord Portal",
  tenant: "Tenant Portal",
  admin: "Admin Portal",
}

interface AppSidebarProps {
  portal: PortalType
  user: {
    firstName: string
    lastName: string
    email: string
  }
  trialDaysRemaining?: number
  onUpgrade?: () => void
  onSignOut?: () => void
  /** Optional unread/notification counts keyed by nav href, e.g. { "/tenant/inbox": 3 }. */
  badges?: Record<string, number>
}

export function AppSidebar({
  portal,
  user,
  trialDaysRemaining,
  onUpgrade,
  onSignOut,
  badges,
}: AppSidebarProps) {
  const pathname = usePathname()
  const items = navItems[portal]
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  const isActive = (href: string) => {
    if (href === `/${portal}`) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
   <aside className="w-64 h-dvh overflow-y-auto bg-[var(--sidebar-bg)] flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Logo portalName={portalNames[portal]} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          Menu
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isActive(item.href)
            const badgeCount = badges?.[item.href] ?? 0
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-normal transition-colors",
                    active
                      ? "bg-white text-navy"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-navy" : "text-white/70"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span
                      className={cn(
                        "min-w-5 h-5 px-1.5 rounded-full text-xs font-medium flex items-center justify-center",
                        active ? "bg-teal text-white" : "bg-teal text-white"
                      )}
                      aria-label={`${badgeCount} unread`}
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Trial countdown (landlord only) */}
      {portal === "landlord" && trialDaysRemaining !== undefined && trialDaysRemaining <= 7 && (
        <div className="px-4 py-3 mx-4 mb-4 bg-white/10 rounded-lg">
          {trialDaysRemaining > 0 ? (
            <>
              <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                <Clock className="h-4 w-4" />
                <span>{trialDaysRemaining} days left in trial</span>
              </div>
              <Button
                onClick={onUpgrade}
                size="sm"
                className="w-full bg-teal hover:bg-teal-dark text-white"
              >
                Upgrade Now
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-warning text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Trial ended</span>
              </div>
              <Button
                onClick={onUpgrade}
                size="sm"
                className="w-full bg-teal hover:bg-teal-dark text-white"
              >
                Upgrade to Continue
              </Button>
            </>
          )}
        </div>
      )}

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 bg-sage-light">
            <AvatarFallback className="bg-sage-light text-navy text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-white/50 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
