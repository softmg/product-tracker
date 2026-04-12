"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  Plus,
  FileText,
  ArrowRight,
  Activity,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUnit } from "effector-react"
import { useAuth } from "@/lib/auth-context"
import type { HypothesisStatus, UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/hypotheses/status-badge"
import { $hypotheses, fetchHypothesesFx } from "@/lib/stores/hypotheses/model"
import type { ApiHypothesisList } from "@/lib/stores/hypotheses/types"

type DashboardHypothesis = {
  id: number
  code: string
  title: string
  status: HypothesisStatus
  ownerId: number | null
  teamId: number | null
  scoringPrimary: number | null
  slaDeadline: string | null
  createdAt: string
  updatedAt: string
}

type DashboardActivityAction = "create" | "update" | "status_change"

type DashboardActivity = {
  id: string
  action: DashboardActivityAction
  userName: string
  hypothesisId: number
  hypothesisCode: string
  timestamp: string
  oldStatus?: HypothesisStatus
  newStatus?: HypothesisStatus
}

type ActivityFilter = "all" | DashboardActivityAction

const hypothesisStatuses: HypothesisStatus[] = [
  "backlog",
  "scoring",
  "deep_dive",
  "experiment",
  "analysis",
  "go_no_go",
  "done",
]

// Russian status labels
const statusLabelsRu: Record<HypothesisStatus, string> = {
  backlog: "Идея",
  scoring: "Скоринг",
  deep_dive: "Deep Dive",
  experiment: "Эксперимент",
  analysis: "Анализ",
  go_no_go: "Питч",
  done: "Архив",
}

// Russian role labels
const roleLabelsRu: Record<UserRole, string> = {
  admin: "Администратор",
  initiator: "Инициатор",
  pd_manager: "PD Manager",
  analyst: "Аналитик",
  tech_lead: "Техлид",
  bizdev: "BizDev",
  committee: "Комитет",
}

const statusBarClassByStatus: Record<HypothesisStatus, string> = {
  backlog: "bg-slate-500",
  scoring: "bg-purple-500",
  deep_dive: "bg-blue-500",
  experiment: "bg-cyan-500",
  analysis: "bg-amber-500",
  go_no_go: "bg-orange-500",
  done: "bg-emerald-500",
}

function isHypothesisStatus(value: string): value is HypothesisStatus {
  return hypothesisStatuses.includes(value as HypothesisStatus)
}

function parsePrefixedId(value: string | undefined, prefix: string): number | null {
  if (!value || !value.startsWith(prefix)) {
    return null
  }

  const parsed = Number.parseInt(value.slice(prefix.length), 10)
  return Number.isNaN(parsed) ? null : parsed
}

function toDashboardHypothesis(item: ApiHypothesisList): DashboardHypothesis {
  return {
    id: item.id,
    code: item.code,
    title: item.title,
    status: isHypothesisStatus(item.status) ? item.status : "backlog",
    ownerId: item.owner?.id ?? null,
    teamId: item.team?.id ?? null,
    scoringPrimary: item.scoring_primary,
    slaDeadline: item.sla_deadline,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }
}

function getActionHint(hypothesis: DashboardHypothesis, userRole: UserRole): string | null {
  switch (hypothesis.status) {
    case "backlog":
      return "Отправь в скоринг"
    case "scoring":
      if (!hypothesis.scoringPrimary) {
        return "Заполни скоринг"
      }
      return "Переведи в Deep Dive"
    case "deep_dive":
      return "Заполни чек-лист"
    case "experiment":
      return "Внеси результаты"
    case "analysis":
      return "Подготовь к питчу"
    case "go_no_go":
      return userRole === "admin" ? "Ожидает голосования" : "На голосовании ПК"
    default:
      return null
  }
}

function getSLAStatus(hypothesis: DashboardHypothesis): {
  status: "ok" | "warning" | "overdue"
  daysLeft?: number
  daysOverdue?: number
} {
  if (!hypothesis.slaDeadline) {
    return { status: "ok" }
  }

  const deadline = new Date(hypothesis.slaDeadline)
  const now = new Date()
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return { status: "overdue", daysOverdue: Math.abs(daysLeft) }
  }

  if (daysLeft <= 2) {
    return { status: "warning", daysLeft }
  }

  return { status: "ok", daysLeft }
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const eventTypeLabels: Record<DashboardActivityAction, string> = {
  create: "Создание",
  update: "Изменение",
  status_change: "Смена статуса",
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    actions: false,
    sla: false,
    activity: false,
    deadlines: false,
  })

  const storeHypotheses = useUnit($hypotheses)

  useEffect(() => {
    void fetchHypothesesFx({})
  }, [])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    void fetchHypothesesFx({}).finally(() => {
      setIsRefreshing(false)
    })
  }, [])

  const dashboardHypotheses = useMemo(() => storeHypotheses.map(toDashboardHypothesis), [storeHypotheses])
  const currentUserId = parsePrefixedId(user?.id, "user-")
  const currentTeamId = parsePrefixedId(user?.teamId, "team-")

  const userHypotheses = useMemo(() => {
    if (!user) return []

    return dashboardHypotheses.filter(
      (h) =>
        (currentUserId !== null && h.ownerId === currentUserId) ||
        (currentTeamId !== null && h.teamId === currentTeamId),
    )
  }, [currentTeamId, currentUserId, dashboardHypotheses, user])

  const awaitingAction = useMemo(() => {
    if (!user) return []

    return userHypotheses
      .filter((h) => h.status !== "done")
      .map((h) => ({
        hypothesis: h,
        action: getActionHint(h, user.role),
      }))
      .filter((item) => item.action !== null)
      .slice(0, expandedSections.actions ? 20 : 5)
  }, [expandedSections.actions, user, userHypotheses])

  const totalAwaitingAction = useMemo(() => {
    if (!user) return 0

    return userHypotheses
      .filter((h) => h.status !== "done")
      .map((h) => ({
        hypothesis: h,
        action: getActionHint(h, user.role),
      }))
      .filter((item) => item.action !== null).length
  }, [user, userHypotheses])

  const slaIssues = useMemo(() => {
    return userHypotheses
      .filter((h) => h.status !== "done")
      .map((h) => ({
        hypothesis: h,
        sla: getSLAStatus(h),
      }))
      .filter((item) => item.sla.status !== "ok")
      .sort((a, b) => {
        if (a.sla.status === "overdue" && b.sla.status === "warning") return -1
        if (a.sla.status === "warning" && b.sla.status === "overdue") return 1
        return 0
      })
      .slice(0, expandedSections.sla ? 20 : 5)
  }, [expandedSections.sla, userHypotheses])

  const totalSlaIssues = useMemo(() => {
    return userHypotheses
      .filter((h) => h.status !== "done")
      .map((h) => ({
        hypothesis: h,
        sla: getSLAStatus(h),
      }))
      .filter((item) => item.sla.status !== "ok").length
  }, [userHypotheses])

  const hypothesesByStatus = useMemo(() => {
    const counts: Record<HypothesisStatus, number> = {
      backlog: 0,
      scoring: 0,
      deep_dive: 0,
      experiment: 0,
      analysis: 0,
      go_no_go: 0,
      done: 0,
    }

    userHypotheses.forEach((h) => {
      counts[h.status]++
    })

    return counts
  }, [userHypotheses])

  const maxStatusCount = useMemo(() => {
    return Math.max(...Object.values(hypothesesByStatus), 1)
  }, [hypothesesByStatus])

  const activitySource = useMemo<DashboardActivity[]>(() => {
    return userHypotheses
      .flatMap((hypothesis) => {
        const events: DashboardActivity[] = [
          {
            id: `create-${hypothesis.id}`,
            action: "create",
            userName: user?.name || "Пользователь",
            hypothesisId: hypothesis.id,
            hypothesisCode: hypothesis.code,
            timestamp: hypothesis.createdAt,
          },
        ]

        if (hypothesis.updatedAt !== hypothesis.createdAt) {
          events.push({
            id: `update-${hypothesis.id}`,
            action: "update",
            userName: user?.name || "Пользователь",
            hypothesisId: hypothesis.id,
            hypothesisCode: hypothesis.code,
            timestamp: hypothesis.updatedAt,
          })
        }

        return events
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [user?.name, userHypotheses])

  const activityFeed = useMemo(() => {
    const filtered =
      activityFilter === "all" ? activitySource : activitySource.filter((event) => event.action === activityFilter)

    return filtered.slice(0, expandedSections.activity ? 20 : 5)
  }, [activityFilter, activitySource, expandedSections.activity])

  const totalActivityFeed = useMemo(() => {
    if (activityFilter === "all") {
      return activitySource.length
    }

    return activitySource.filter((event) => event.action === activityFilter).length
  }, [activityFilter, activitySource])

  const activityByDay = useMemo(() => {
    const days: { date: string; count: number }[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const count = activitySource.filter((event) => {
        const eventDate = new Date(event.timestamp).toISOString().split("T")[0]
        return eventDate === dateStr
      }).length

      days.push({
        date: date.toLocaleDateString("ru-RU", { weekday: "short" }),
        count,
      })
    }

    return days
  }, [activitySource])

  const maxActivityCount = useMemo(() => {
    return Math.max(...activityByDay.map((d) => d.count), 1)
  }, [activityByDay])

  const upcomingDeadlines = useMemo(() => {
    return userHypotheses
      .filter((hypothesis) => hypothesis.status !== "done" && hypothesis.slaDeadline)
      .map((hypothesis) => {
        const deadlineDate = new Date(hypothesis.slaDeadline as string)
        const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

        return {
          type: "deep_dive" as const,
          title: hypothesis.title,
          hypothesisCode: hypothesis.code,
          hypothesisId: String(hypothesis.id),
          date: hypothesis.slaDeadline as string,
          daysLeft,
        }
      })
      .filter((deadline) => deadline.daysLeft >= 0 && deadline.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, expandedSections.deadlines ? 20 : 5)
  }, [expandedSections.deadlines, userHypotheses])

  const totalUpcomingDeadlines = useMemo(() => {
    return userHypotheses.filter((hypothesis) => {
      if (hypothesis.status === "done" || !hypothesis.slaDeadline) {
        return false
      }

      const daysLeft = Math.ceil((new Date(hypothesis.slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysLeft >= 0 && daysLeft <= 7
    }).length
  }, [userHypotheses])

  const notificationCount = activitySource.length

  const currentDate = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  if (!user) return null

  return (
    <>
      <Header breadcrumbs={[{ title: "Дашборд" }]} />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Привет, {user.name.split(" ")[0]}!</h1>
              <p className="text-muted-foreground">
                {roleLabelsRu[user.role]} &middot; {currentDate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/hypotheses">
                  <Bell className="mr-2 h-4 w-4" />
                  {notificationCount}
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Обновить
              </Button>
              {hasPermission("hypothesis:create") && (
                <Button asChild>
                  <Link href="/hypotheses/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Новая гипотеза
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Ожидают моего действия</CardTitle>
                  <CardDescription>Гипотезы, требующие вашего внимания прямо сейчас</CardDescription>
                </div>
                {totalAwaitingAction > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedSections((prev) => ({ ...prev, actions: !prev.actions }))}
                  >
                    {expandedSections.actions ? "Свернуть" : `+ Ещё ${totalAwaitingAction - 5}`}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {awaitingAction.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-950 dark:text-green-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Нет задач. Всё в порядке!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {awaitingAction.map(({ hypothesis, action }) => (
                    <Link
                      key={hypothesis.id}
                      href={`/hypotheses/${hypothesis.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-muted-foreground">{hypothesis.code}</span>
                        <StatusBadge status={hypothesis.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{action}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {slaIssues.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">SLA-нарушения и приближения</CardTitle>
                    <CardDescription>Гипотезы с нарушением или приближением дедлайна</CardDescription>
                  </div>
                  {totalSlaIssues > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedSections((prev) => ({ ...prev, sla: !prev.sla }))}
                    >
                      {expandedSections.sla ? "Свернуть" : `+ Ещё ${totalSlaIssues - 5}`}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {slaIssues.map(({ hypothesis, sla }) => (
                    <Link
                      key={hypothesis.id}
                      href={`/hypotheses/${hypothesis.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                            sla.status === "overdue"
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-yellow-500 text-white",
                          )}
                        >
                          {sla.status === "overdue" ? "!!" : "!"}
                        </span>
                        <span className="font-mono text-sm text-muted-foreground">{hypothesis.code}</span>
                        <StatusBadge status={hypothesis.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            sla.status === "overdue" ? "text-destructive" : "text-yellow-600 dark:text-yellow-400",
                          )}
                        >
                          {sla.status === "overdue"
                            ? `Просрочено на ${sla.daysOverdue} дн.`
                            : `Осталось ${sla.daysLeft} дн.`}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Мои гипотезы по статусам</CardTitle>
                <CardDescription>Всего: {userHypotheses.length} гипотез</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hypothesisStatuses.map((status) => {
                    const count = hypothesesByStatus[status]
                    const percentage = (count / maxStatusCount) * 100
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{statusLabelsRu[status]}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full transition-all", statusBarClassByStatus[status])}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Активность за 7 дней</CardTitle>
                <CardDescription>Ваши действия в системе</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-32 items-end justify-between gap-2">
                  {activityByDay.map((day, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-primary transition-all"
                        style={{
                          height: `${(day.count / maxActivityCount) * 100}%`,
                          minHeight: day.count > 0 ? "8px" : "2px",
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{day.date}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Всего: {activityByDay.reduce((sum, d) => sum + d.count, 0)} действий</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Лента изменений</CardTitle>
                  <CardDescription>События по вашим гипотезам</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={activityFilter} onValueChange={(value) => setActivityFilter(value as ActivityFilter)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Фильтр" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все события</SelectItem>
                      <SelectItem value="create">Создание</SelectItem>
                      <SelectItem value="update">Изменение</SelectItem>
                      <SelectItem value="status_change">Смена статуса</SelectItem>
                    </SelectContent>
                  </Select>
                  {totalActivityFeed > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedSections((prev) => ({ ...prev, activity: !prev.activity }))}
                    >
                      {expandedSections.activity ? "Свернуть" : `+ Ещё ${totalActivityFeed - 5}`}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activityFeed.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Нет событий</p>
              ) : (
                <div className="space-y-3">
                  {activityFeed.map((log) => (
                    <div key={log.id} className="flex items-start justify-between rounded-lg border p-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-muted p-1.5">
                          {log.action === "create" && <Plus className="h-3 w-3" />}
                          {log.action === "update" && <FileText className="h-3 w-3" />}
                          {log.action === "status_change" && <ArrowRight className="h-3 w-3" />}
                          {log.action !== "create" && log.action !== "update" && log.action !== "status_change" && (
                            <AlertCircle className="h-3 w-3" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{log.userName}</span>{" "}
                            <span className="text-muted-foreground">{eventTypeLabels[log.action]}</span>{" "}
                            <Link
                              href={`/hypotheses/${log.hypothesisId}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {log.hypothesisCode}
                            </Link>
                          </p>
                          {log.action === "status_change" && log.oldStatus && log.newStatus && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {statusLabelsRu[log.oldStatus]} {" → "} {statusLabelsRu[log.newStatus]}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</span>
                        <Link href={`/hypotheses/${log.hypothesisId}`}>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {upcomingDeadlines.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Ближайшие дедлайны (7 дней)</CardTitle>
                    <CardDescription>Гипотезы с приближающимся дедлайном</CardDescription>
                  </div>
                  {totalUpcomingDeadlines > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedSections((prev) => ({ ...prev, deadlines: !prev.deadlines }))}
                    >
                      {expandedSections.deadlines ? "Свернуть" : `+ Ещё ${totalUpcomingDeadlines - 5}`}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingDeadlines.map((deadline, index) => (
                    <Link
                      key={`${deadline.hypothesisId}-${index}`}
                      href={`/hypotheses/${deadline.hypothesisId}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{deadline.title}</p>
                          <p className="text-xs text-muted-foreground">{deadline.hypothesisCode} &middot; Дедлайн SLA</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={deadline.daysLeft <= 2 ? "destructive" : "secondary"}>
                          {deadline.daysLeft === 0
                            ? "Сегодня"
                            : deadline.daysLeft === 1
                              ? "Завтра"
                              : `${deadline.daysLeft} дн.`}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
