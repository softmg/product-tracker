"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Lightbulb,
  Users,
  Building2,
  Settings,
  ScrollText,
  Shield,
  ChevronDown,
  LogOut,
  Search,
  Users2,
  ArrowRightLeft,
  Calculator,
  Clock,
  Bell,
  BarChart3,
  LayoutDashboard,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { roleLabels } from "@/lib/mock-data"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const mainNavItems = [
  {
    title: "Дашборд",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Гипотезы",
    href: "/hypotheses",
    icon: Lightbulb,
  },
  {
    title: "Уведомления",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Аналитика",
    href: "/analytics",
    icon: BarChart3,
  },
]

const adminNavItems = [
  {
    title: "Пользователи",
    href: "/admin/users",
    icon: Users,
    permission: "admin:users" as const,
  },
  {
    title: "Команды",
    href: "/admin/teams",
    icon: Building2,
    permission: "admin:teams" as const,
  },
  {
    title: "Настройки скоринга",
    href: "/admin/scoring",
    icon: Settings,
    permission: "admin:settings" as const,
  },
  {
    title: "Настройки Deep Dive",
    href: "/admin/deep-dive",
    icon: Search,
    permission: "admin:settings" as const,
  },
  {
    title: "Настройки статусов",
    href: "/admin/statuses",
    icon: Shield,
    permission: "admin:settings" as const,
  },
  {
    title: "Статусы и переходы",
    href: "/admin/transitions",
    icon: ArrowRightLeft,
    permission: "admin:settings" as const,
  },
  {
    title: "Пороги скоринга",
    href: "/admin/scoring-thresholds",
    icon: Calculator,
    permission: "admin:settings" as const,
  },
  {
    title: "SLA",
    href: "/admin/sla",
    icon: Clock,
    permission: "admin:settings" as const,
  },
  {
    title: "Уведомления",
    href: "/admin/notifications",
    icon: Bell,
    permission: "admin:settings" as const,
  },
  {
    title: "Журнал аудита",
    href: "/admin/audit",
    icon: ScrollText,
    permission: "admin:audit" as const,
  },
  {
    title: "Продуктовый комитет",
    href: "/admin/committee",
    icon: Users2,
    permission: "admin:settings" as const,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout, hasPermission } = useAuth()

  const filteredAdminItems = adminNavItems.filter(item => 
    hasPermission(item.permission)
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-3 transition-colors hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Product Tracker</span>
            <span className="text-xs text-muted-foreground">Управление гипотезами</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Главное</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdminItems.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Администрирование</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredAdminItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user ? getInitials(user.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name || "Гость"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user ? roleLabels[user.role] : "Не авторизован"}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user ? getInitials(user.name) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className={cn(
                    "cursor-pointer text-destructive focus:text-destructive"
                  )}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
