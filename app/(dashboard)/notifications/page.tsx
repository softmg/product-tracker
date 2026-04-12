"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import Link from "next/link"
import { Bell, RefreshCw, Check, Search, X, ArrowUpRight } from "lucide-react"
import { useUnit } from "effector-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  $notifications,
  $notificationsLoading,
  $unreadCount,
  fetchNotificationsFx,
  markReadFx,
  markAllReadFx,
} from "@/lib/stores/notifications/model"

type PeriodFilter = "all" | "today" | "yesterday" | "7days" | "30days"
type ReadFilter = "all" | "unread"

type NotificationTypeConfig = {
  color: string
  borderColor: string
  label: string
}

const notificationTypeConfig: Record<string, NotificationTypeConfig> = {
  status_change: {
    color: "text-violet-500",
    borderColor: "border-l-violet-500",
    label: "Смена статуса",
  },
  responsible_assigned: {
    color: "text-blue-500",
    borderColor: "border-l-blue-500",
    label: "Назначен ответственный",
  },
  sla_violation: {
    color: "text-red-500",
    borderColor: "border-l-red-500",
    label: "SLA нарушен",
  },
  sla_warning: {
    color: "text-yellow-500",
    borderColor: "border-l-yellow-500",
    label: "SLA — предупреждение",
  },
  committee_voting_opened: {
    color: "text-blue-500",
    borderColor: "border-l-blue-500",
    label: "Голосование ПК",
  },
  committee_decision: {
    color: "text-green-500",
    borderColor: "border-l-green-500",
    label: "Решение ПК",
  },
  artifact_added: {
    color: "text-muted-foreground",
    borderColor: "border-l-muted-foreground",
    label: "Новый артефакт",
  },
  comment_added: {
    color: "text-muted-foreground",
    borderColor: "border-l-muted-foreground",
    label: "Новый комментарий",
  },
}

function getTypeConfig(type: string): NotificationTypeConfig {
  return (
    notificationTypeConfig[type] ?? {
      color: "text-muted-foreground",
      borderColor: "border-l-muted-foreground",
      label: type,
    }
  )
}

function NotificationIcon({ type }: { type: string }) {
  const config = getTypeConfig(type)

  return (
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted", config.color)}>
      {type === "status_change" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      )}
      {type === "responsible_assigned" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
      {type === "sla_violation" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      )}
      {type === "sla_warning" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {type === "committee_voting_opened" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      )}
      {type === "committee_decision" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {type === "artifact_added" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      )}
      {type === "comment_added" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )}
      {!notificationTypeConfig[type] && <Bell className="h-5 w-5" />}
    </div>
  )
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  })
}

function getDateGroup(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (notifDate.getTime() === today.getTime()) {
    return "Сегодня"
  }
  if (notifDate.getTime() === yesterday.getTime()) {
    return "Вчера"
  }
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
}

function isInPeriod(dateString: string, period: PeriodFilter): boolean {
  if (period === "all") return true

  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case "today":
      return date >= today
    case "yesterday": {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      return date >= yesterday && date < today
    }
    case "7days": {
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      return date >= sevenDaysAgo
    }
    case "30days": {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      return date >= thirtyDaysAgo
    }
    default:
      return true
  }
}

export default function NotificationsPage() {
  const [notifications, unreadCount, isLoading] = useUnit([$notifications, $unreadCount, $notificationsLoading])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")
  const [readFilter, setReadFilter] = useState<ReadFilter>("all")

  useEffect(() => {
    void fetchNotificationsFx({})
  }, [])

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const matchesSearch =
            n.title.toLowerCase().includes(query) ||
            n.body.toLowerCase().includes(query) ||
            n.type.toLowerCase().includes(query) ||
            String(n.hypothesis_id ?? "").includes(query)
          if (!matchesSearch) return false
        }

        if (typeFilter !== "all" && n.type !== typeFilter) return false
        if (!isInPeriod(n.created_at, periodFilter)) return false
        if (readFilter === "unread" && n.is_read) return false

        return true
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [notifications, searchQuery, typeFilter, periodFilter, readFilter])

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, typeof filteredNotifications> = {}

    filteredNotifications.forEach((n) => {
      const group = getDateGroup(n.created_at)
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(n)
    })

    return groups
  }, [filteredNotifications])

  const activeFiltersCount = [
    typeFilter !== "all",
    periodFilter !== "all",
    readFilter !== "all",
    searchQuery.length > 0,
  ].filter(Boolean).length

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    void fetchNotificationsFx({}).finally(() => {
      setIsRefreshing(false)
    })
  }, [])

  const markAsRead = useCallback((notificationId: number, isRead: boolean) => {
    if (!isRead) {
      void markReadFx(notificationId)
    }
  }, [])

  const markAllAsRead = useCallback(() => {
    void markAllReadFx()
  }, [])

  const clearFilters = useCallback(() => {
    setSearchQuery("")
    setTypeFilter("all")
    setPeriodFilter("all")
    setReadFilter("all")
  }, [])

  const typeOptions = Object.entries(notificationTypeConfig)

  return (
    <>
      <Header breadcrumbs={[{ title: "Центр уведомлений" }]} />

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Центр уведомлений</h1>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} непрочитанных уведомлений` : "Все уведомления прочитаны"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="mr-2 h-4 w-4" />
                  Прочитать все
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing || isLoading}>
                <RefreshCw className={cn("h-4 w-4", (isRefreshing || isLoading) && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по тексту или ID гипотезы..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Тип события" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {typeOptions.map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все время</SelectItem>
                  <SelectItem value="today">Сегодня</SelectItem>
                  <SelectItem value="yesterday">Вчера</SelectItem>
                  <SelectItem value="7days">7 дней</SelectItem>
                  <SelectItem value="30days">30 дней</SelectItem>
                </SelectContent>
              </Select>

              <Select value={readFilter} onValueChange={(v) => setReadFilter(v as ReadFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Прочитанность" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="unread">Только непрочитанные</SelectItem>
                </SelectContent>
              </Select>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Сбросить
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                </Button>
              )}
            </div>
          </div>

          {isLoading && notifications.length === 0 ? (
            <div className="space-y-3">
              <div className="h-20 w-full animate-pulse rounded-lg bg-muted/50" />
              <div className="h-20 w-full animate-pulse rounded-lg bg-muted/50" />
              <div className="h-20 w-full animate-pulse rounded-lg bg-muted/50" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
              <Bell className="mb-4 h-12 w-12" />
              <p className="text-lg font-medium">Нет уведомлений</p>
              <p className="text-sm">
                {activeFiltersCount > 0 ? "Попробуйте изменить фильтры" : "Здесь будут появляться ваши уведомления"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
                <div key={dateGroup}>
                  <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{dateGroup}</h2>
                  <div className="space-y-2">
                    {groupNotifications.map((notification) => {
                      const config = getTypeConfig(notification.type)

                      const cardClassName = cn(
                        "flex gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                        "border-l-4",
                        config.borderColor,
                        !notification.is_read && "bg-muted/30 border-l-4",
                      )

                      const cardContent = (
                        <>
                          <NotificationIcon type={notification.type} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={cn("text-sm", !notification.is_read && "font-semibold")}>{notification.title}</p>
                                {notification.hypothesis_id !== null && (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">Гипотеза #{notification.hypothesis_id}</span>
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</span>
                                {notification.hypothesis_id !== null && <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </div>
                            {notification.body && (
                              <p className={cn("mt-2 text-sm", notification.is_read ? "text-muted-foreground" : "text-foreground")}>
                                {notification.body}
                              </p>
                            )}
                          </div>
                        </>
                      )

                      if (notification.hypothesis_id !== null) {
                        return (
                          <Link
                            key={notification.id}
                            href={`/hypotheses/${notification.hypothesis_id}`}
                            onClick={() => markAsRead(notification.id, notification.is_read)}
                            className={cardClassName}
                          >
                            {cardContent}
                          </Link>
                        )
                      }

                      return (
                        <div
                          key={notification.id}
                          className={cardClassName}
                          onClick={() => markAsRead(notification.id, notification.is_read)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              markAsRead(notification.id, notification.is_read)
                            }
                          }}
                        >
                          {cardContent}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
