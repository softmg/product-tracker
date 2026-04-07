"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { 
  Bell, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  ChevronRight,
  Clock,
  Plus,
  FileText,
  ArrowRight,
  Vote,
  Calculator,
  ClipboardCheck,
  Send,
  Activity
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUnit } from "effector-react"
import { useAuth } from "@/lib/auth-context"
import {
  mockHypotheses,
  mockExperiments,
  mockAuditLog,
  mockSLAConfigs,
  statusDisplayInfo,
  getUserById,
  roleLabels,
} from "@/lib/mock-data"
import type { Hypothesis, HypothesisStatus, AuditLogEntry, UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/hypotheses/status-badge"
import { $hypotheses, $isLoading, fetchHypothesesFx } from "@/lib/stores/hypotheses/model"

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

// Action hints for different statuses
function getActionHint(hypothesis: Hypothesis, userRole: UserRole): string | null {
  switch (hypothesis.status) {
    case "backlog":
      return "Отправь в скоринг"
    case "scoring":
      if (!hypothesis.scoring?.totalScore) {
        return "Заполни скоринг"
      }
      return "Переведи в Deep Dive"
    case "deep_dive":
      const stages = hypothesis.deepDive?.stages || []
      const completedStages = stages.filter(s => s.isCompleted).length
      const totalStages = stages.length || 7
      if (completedStages < totalStages) {
        return `Заполни чек-лист (${completedStages}/${totalStages})`
      }
      return "Завершить Deep Dive"
    case "experiment":
      const experiments = mockExperiments.filter(e => e.hypothesisId === hypothesis.id)
      const runningExp = experiments.filter(e => e.status === "running")
      if (runningExp.length > 0) {
        return "Внеси результаты"
      }
      return "Создай эксперимент"
    case "analysis":
      return "Подготовь к питчу"
    case "go_no_go":
      if (userRole === "admin") {
        return "Ожидает голосования"
      }
      return "На голосовании ПК"
    default:
      return null
  }
}

// SLA calculation
function getSLAStatus(hypothesis: Hypothesis): { status: "ok" | "warning" | "overdue"; daysLeft?: number; daysOverdue?: number } {
  if (!hypothesis.deadline) {
    // Calculate based on status SLA config
    const slaConfig = mockSLAConfigs.find(s => s.status === hypothesis.status)
    if (!slaConfig || !slaConfig.isActive) {
      return { status: "ok" }
    }
    const statusDate = new Date(hypothesis.updatedAt)
    const now = new Date()
    const daysInStatus = Math.floor((now.getTime() - statusDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysLeft = slaConfig.limitDays - daysInStatus

    if (daysLeft < 0) {
      return { status: "overdue", daysOverdue: Math.abs(daysLeft) }
    }
    if (daysLeft <= slaConfig.warningDays) {
      return { status: "warning", daysLeft }
    }
    return { status: "ok", daysLeft }
  }

  const deadline = new Date(hypothesis.deadline)
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

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("ru-RU", { 
    day: "numeric", 
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  })
}

// Event type labels
const eventTypeLabels: Record<string, string> = {
  create: "Создание",
  update: "Изменение",
  delete: "Удаление",
  status_change: "Смена статуса",
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Load hypotheses from Effector store
  const storeHypotheses = useUnit($hypotheses)
  const storeLoading = useUnit($isLoading)

  useEffect(() => {
    void fetchHypothesesFx({})
  }, [])
  const [activityFilter, setActivityFilter] = useState<string>("all")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    actions: false,
    sla: false,
    activity: false,
    deadlines: false,
  })

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastRefresh(new Date())
      setIsRefreshing(false)
    }, 500)
  }, [])

  // Get user's hypotheses (owned or participating)
  const userHypotheses = useMemo(() => {
    if (!user) return []
    return mockHypotheses.filter(h => 
      h.ownerId === user.id || 
      h.teamId === user.teamId
    )
  }, [user])

  // Get hypotheses awaiting action
  const awaitingAction = useMemo(() => {
    if (!user) return []
    return userHypotheses
      .filter(h => h.status !== "done")
      .map(h => ({
        hypothesis: h,
        action: getActionHint(h, user.role)
      }))
      .filter(item => item.action !== null)
      .slice(0, expandedSections.actions ? 20 : 5)
  }, [userHypotheses, user, expandedSections.actions])

  const totalAwaitingAction = useMemo(() => {
    if (!user) return 0
    return userHypotheses
      .filter(h => h.status !== "done")
      .map(h => ({
        hypothesis: h,
        action: getActionHint(h, user.role)
      }))
      .filter(item => item.action !== null).length
  }, [userHypotheses, user])

  // Get SLA violations and warnings
  const slaIssues = useMemo(() => {
    return userHypotheses
      .filter(h => h.status !== "done")
      .map(h => ({
        hypothesis: h,
        sla: getSLAStatus(h)
      }))
      .filter(item => item.sla.status !== "ok")
      .sort((a, b) => {
        // Overdue first, then warnings
        if (a.sla.status === "overdue" && b.sla.status === "warning") return -1
        if (a.sla.status === "warning" && b.sla.status === "overdue") return 1
        return 0
      })
      .slice(0, expandedSections.sla ? 20 : 5)
  }, [userHypotheses, expandedSections.sla])

  const totalSlaIssues = useMemo(() => {
    return userHypotheses
      .filter(h => h.status !== "done")
      .map(h => ({
        hypothesis: h,
        sla: getSLAStatus(h)
      }))
      .filter(item => item.sla.status !== "ok").length
  }, [userHypotheses])

  // Get hypotheses by status for chart — prefer Effector store data (real API or mock)
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
    const source = storeHypotheses.length > 0 ? storeHypotheses : userHypotheses
    source.forEach((h) => {
      const s = h.status as HypothesisStatus
      if (s in counts) counts[s]++
    })
    return counts
  }, [storeHypotheses, userHypotheses])

  const maxStatusCount = useMemo(() => {
    return Math.max(...Object.values(hypothesesByStatus), 1)
  }, [hypothesesByStatus])

  // Get activity for last 7 days
  const activityByDay = useMemo(() => {
    const days: { date: string; count: number }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const count = mockAuditLog.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split("T")[0]
        return logDate === dateStr && log.userId === user?.id
      }).length
      days.push({
        date: date.toLocaleDateString("ru-RU", { weekday: "short" }),
        count
      })
    }
    return days
  }, [user])

  const maxActivityCount = useMemo(() => {
    return Math.max(...activityByDay.map(d => d.count), 1)
  }, [activityByDay])

  // Get activity feed
  const activityFeed = useMemo(() => {
    const userHypothesisIds = userHypotheses.map(h => h.id)
    let filtered = mockAuditLog
      .filter(log => 
        log.entityType === "hypothesis" && 
        userHypothesisIds.includes(log.entityId)
      )
    
    if (activityFilter !== "all") {
      filtered = filtered.filter(log => log.action === activityFilter)
    }

    return filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, expandedSections.activity ? 20 : 5)
  }, [userHypotheses, activityFilter, expandedSections.activity])

  const totalActivityFeed = useMemo(() => {
    const userHypothesisIds = userHypotheses.map(h => h.id)
    let filtered = mockAuditLog
      .filter(log => 
        log.entityType === "hypothesis" && 
        userHypothesisIds.includes(log.entityId)
      )
    
    if (activityFilter !== "all") {
      filtered = filtered.filter(log => log.action === activityFilter)
    }
    return filtered.length
  }, [userHypotheses, activityFilter])

  // Get upcoming deadlines (experiments & deep dive tasks)
  const upcomingDeadlines = useMemo(() => {
    const deadlines: { 
      type: "experiment" | "deep_dive"
      title: string
      hypothesisCode: string
      hypothesisId: string
      date: string
      daysLeft: number
    }[] = []

    // Experiments
    mockExperiments
      .filter(exp => {
        const hyp = userHypotheses.find(h => h.id === exp.hypothesisId)
        return hyp && exp.status === "running"
      })
      .forEach(exp => {
        const hyp = mockHypotheses.find(h => h.id === exp.hypothesisId)
        if (!hyp) return
        const endDate = new Date(exp.endDate)
        const now = new Date()
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysLeft >= 0 && daysLeft <= 7) {
          deadlines.push({
            type: "experiment",
            title: exp.title,
            hypothesisCode: hyp.code,
            hypothesisId: hyp.id,
            date: exp.endDate,
            daysLeft
          })
        }
      })

    return deadlines
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, expandedSections.deadlines ? 20 : 5)
  }, [userHypotheses, expandedSections.deadlines])

  // Notification count (mock)
  const notificationCount = 3

  // Current date
  const currentDate = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  if (!user) return null

  return (
    <>
      <Header breadcrumbs={[{ title: "Дашборд" }]} />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header with greeting */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Привет, {user.name.split(" ")[0]}!
              </h1>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
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

          {/* Block 1: Awaiting Action */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Ожидают моего действия</CardTitle>
                  <CardDescription>
                    Гипотезы, требующие вашего внимания прямо сейчас
                  </CardDescription>
                </div>
                {totalAwaitingAction > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setExpandedSections(prev => ({ ...prev, actions: !prev.actions }))}
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
                        <span className="font-mono text-sm text-muted-foreground">
                          {hypothesis.code}
                        </span>
                        <StatusBadge status={hypothesis.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">
                          {action}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Block 2: SLA Issues */}
          {slaIssues.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">SLA-нарушения и приближения</CardTitle>
                    <CardDescription>
                      Гипотезы с нарушением или приближением дедлайна
                    </CardDescription>
                  </div>
                  {totalSlaIssues > 5 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedSections(prev => ({ ...prev, sla: !prev.sla }))}
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
                        <span className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          sla.status === "overdue" 
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-yellow-500 text-white"
                        )}>
                          {sla.status === "overdue" ? "!!" : "!"}
                        </span>
                        <span className="font-mono text-sm text-muted-foreground">
                          {hypothesis.code}
                        </span>
                        <StatusBadge status={hypothesis.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          sla.status === "overdue" ? "text-destructive" : "text-yellow-600 dark:text-yellow-400"
                        )}>
                          {sla.status === "overdue" 
                            ? `Просрочено на ${sla.daysOverdue} дн.`
                            : `Осталось ${sla.daysLeft} дн.`
                          }
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Block 3: Two columns */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: Hypotheses by status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Мои гипотезы по статусам</CardTitle>
                <CardDescription>
                  Всего: {userHypotheses.length} гипотез
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(Object.keys(statusLabelsRu) as HypothesisStatus[]).map((status) => {
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
                            className={cn(
                              "h-full rounded-full transition-all",
                              statusDisplayInfo[status]?.colorClass?.split(" ")[0] || "bg-primary"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Right: Activity over 7 days */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Активность за 7 дней</CardTitle>
                <CardDescription>
                  Ваши действия в системе
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-32 items-end justify-between gap-2">
                  {activityByDay.map((day, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-1">
                      <div 
                        className="w-full rounded-t bg-primary transition-all"
                        style={{ 
                          height: `${(day.count / maxActivityCount) * 100}%`,
                          minHeight: day.count > 0 ? "8px" : "2px"
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{day.date}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>
                    Всего: {activityByDay.reduce((sum, d) => sum + d.count, 0)} действий
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Block 4: Activity feed */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Лента изменений</CardTitle>
                  <CardDescription>
                    События по вашим гипотезам
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={activityFilter} onValueChange={setActivityFilter}>
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
                      onClick={() => setExpandedSections(prev => ({ ...prev, activity: !prev.activity }))}
                    >
                      {expandedSections.activity ? "Свернуть" : `+ Ещё ${totalActivityFeed - 5}`}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activityFeed.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Нет событий
                </p>
              ) : (
                <div className="space-y-3">
                  {activityFeed.map((log) => {
                    const hypothesis = mockHypotheses.find(h => h.id === log.entityId)
                    return (
                      <div 
                        key={log.id}
                        className="flex items-start justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-full bg-muted p-1.5">
                            {log.action === "create" && <Plus className="h-3 w-3" />}
                            {log.action === "update" && <FileText className="h-3 w-3" />}
                            {log.action === "status_change" && <ArrowRight className="h-3 w-3" />}
                            {log.action === "delete" && <AlertCircle className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="text-sm">
                              <span className="font-medium">{log.userName}</span>
                              {" "}
                              <span className="text-muted-foreground">
                                {eventTypeLabels[log.action] || log.action}
                              </span>
                              {" "}
                              {hypothesis && (
                                <Link 
                                  href={`/hypotheses/${hypothesis.id}`}
                                  className="font-medium text-primary hover:underline"
                                >
                                  {hypothesis.code}
                                </Link>
                              )}
                            </p>
                            {log.action === "status_change" && log.changes.status && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {statusLabelsRu[log.changes.status.old as HypothesisStatus] || String(log.changes.status.old)}
                                {" → "}
                                {statusLabelsRu[log.changes.status.new as HypothesisStatus] || String(log.changes.status.new)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(log.timestamp)}
                          </span>
                          {hypothesis && (
                            <Link href={`/hypotheses/${hypothesis.id}`}>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Block 5: Upcoming deadlines */}
          {upcomingDeadlines.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Ближайшие дедлайны (7 дней)</CardTitle>
                    <CardDescription>
                      Эксперименты и задачи с приближающимся дедлайном
                    </CardDescription>
                  </div>
                  {upcomingDeadlines.length > 5 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedSections(prev => ({ ...prev, deadlines: !prev.deadlines }))}
                    >
                      {expandedSections.deadlines ? "Свернуть" : `+ Ещё ${upcomingDeadlines.length - 5}`}
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
                          <p className="text-xs text-muted-foreground">
                            {deadline.hypothesisCode} &middot; {deadline.type === "experiment" ? "Эксперимент" : "Deep Dive"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={deadline.daysLeft <= 2 ? "destructive" : "secondary"}>
                          {deadline.daysLeft === 0 
                            ? "Сегодня" 
                            : deadline.daysLeft === 1 
                              ? "Завтра"
                              : `${deadline.daysLeft} дн.`
                          }
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
