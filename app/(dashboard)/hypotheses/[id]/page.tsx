"use client"

import { use, useEffect, useMemo, useState } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, Trash2, MoreHorizontal, Clock, Send, MessageSquare } from "lucide-react"
import { useUnit } from "effector-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/hypotheses/status-badge"
import { ScoringForm } from "@/components/hypotheses/scoring-form"
import { DeepDiveForm } from "@/components/hypotheses/deep-dive-form"
import { ExperimentsList } from "@/components/hypotheses/experiments-list"
import { PassportView } from "@/components/hypotheses/passport-view"
import { HistoryTimeline } from "@/components/hypotheses/history-timeline"
import { RisksResourcesForm } from "@/components/hypotheses/risks-resources-form"
import { CommitteeDecisionForm } from "@/components/hypotheses/committee-decision-form"
import { StatusTransitionPanel } from "@/components/hypotheses/status-transition-panel"
import { useAuth } from "@/lib/auth-context"
import {
  $currentHypothesis,
  fetchHypothesisFx,
  resetCurrentHypothesis,
  transitionHypothesisFx,
} from "@/lib/stores/hypotheses/model"
import type { ApiHypothesisDetail } from "@/lib/stores/hypotheses/types"
import {
  $experiments,
  $experimentsLoading,
  fetchExperimentsFx,
  type Experiment as ApiExperiment,
} from "@/lib/stores/experiments/model"
import type {
  AuditLogEntry,
  Comment as HypothesisComment,
  Experiment as UiExperiment,
  Hypothesis,
  HypothesisStatus,
} from "@/lib/types"

interface PageProps {
  params: Promise<{ id: string }>
}

const allStatuses: HypothesisStatus[] = [
  "backlog",
  "scoring",
  "deep_dive",
  "experiment",
  "analysis",
  "go_no_go",
  "done",
]

const statusLabelsRu: Record<HypothesisStatus, string> = {
  backlog: "Идея",
  scoring: "Скоринг",
  deep_dive: "Deep Dive",
  experiment: "Эксперимент",
  analysis: "Анализ",
  go_no_go: "Питч",
  done: "Архив",
}

const parsePrefixedId = (value: string | undefined, prefix: string): string | null => {
  if (!value || !value.startsWith(prefix)) {
    return null
  }

  const parsed = Number.parseInt(value.slice(prefix.length), 10)
  return Number.isNaN(parsed) ? null : String(parsed)
}

function isHypothesisStatus(value: string): value is HypothesisStatus {
  return allStatuses.includes(value as HypothesisStatus)
}

function mapApiDetailToHypothesis(source: ApiHypothesisDetail): Hypothesis {
  return {
    id: String(source.id),
    code: source.code,
    title: source.title,
    description: source.description ?? source.problem ?? source.solution ?? "",
    status: isHypothesisStatus(source.status) ? source.status : "backlog",
    teamId: source.team ? String(source.team.id) : source.team_id ? String(source.team_id) : "",
    ownerId: source.owner ? String(source.owner.id) : source.owner_id ? String(source.owner_id) : "",
    deadline: source.sla_deadline ?? undefined,
    createdAt: source.created_at,
    updatedAt: source.updated_at,
    scoring:
      source.scoring_primary != null
        ? {
            criteriaScores: {},
            stopFactorTriggered: false,
            totalScore: source.scoring_primary,
            scoredAt: "",
            scoredBy: "",
          }
        : undefined,
  }
}

function mapApiExperimentToUiExperiment(source: ApiExperiment): UiExperiment {
  return {
    id: String(source.id),
    hypothesisId: String(source.hypothesis_id),
    title: source.title,
    type: "other",
    status: source.status,
    description: source.description ?? "",
    metrics: [],
    startDate: source.started_at ?? source.created_at,
    endDate: source.completed_at ?? source.updated_at,
    result: source.result ?? undefined,
    notes: source.result_notes ?? undefined,
    whatWorked: source.result === "success" ? source.result_notes ?? undefined : undefined,
    whatDidNotWork: source.result === "failure" ? source.result_notes ?? undefined : undefined,
    createdAt: source.created_at,
    createdBy: "system",
  }
}

export default function HypothesisPage({ params }: PageProps) {
  const { id } = use(params)
  const numericId = Number.parseInt(id, 10)
  const { user, hasPermission } = useAuth()

  const [apiHypothesis, isHypothesisLoading, experimentsRaw, isExperimentsLoading] = useUnit([
    $currentHypothesis,
    fetchHypothesisFx.pending,
    $experiments,
    $experimentsLoading,
  ])

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editStatus, setEditStatus] = useState<HypothesisStatus | "">("")
  const [editOwnerId, setEditOwnerId] = useState("")
  const [newComment, setNewComment] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [hasRequested, setHasRequested] = useState(false)
  const [comments, setComments] = useState<HypothesisComment[]>([])
  const [historyEntries, setHistoryEntries] = useState<AuditLogEntry[]>([])

  useEffect(() => {
    if (Number.isNaN(numericId)) {
      return
    }

    setHasRequested(true)
    setComments([])
    setHistoryEntries([])
    resetCurrentHypothesis()
    void fetchHypothesisFx(numericId)
    void fetchExperimentsFx(numericId)
  }, [numericId])

  if (Number.isNaN(numericId)) {
    notFound()
  }

  if (hasRequested && !isHypothesisLoading && !apiHypothesis) {
    notFound()
  }

  const hypothesis = useMemo(() => {
    if (!apiHypothesis) {
      return null
    }

    return mapApiDetailToHypothesis(apiHypothesis)
  }, [apiHypothesis])

  const experiments = useMemo(() => {
    return experimentsRaw
      .filter((item) => item.hypothesis_id === numericId)
      .map(mapApiExperimentToUiExperiment)
  }, [experimentsRaw, numericId])

  const ownerOptions = useMemo(() => {
    const map = new Map<string, string>()

    if (apiHypothesis?.owner) {
      map.set(
        String(apiHypothesis.owner.id),
        apiHypothesis.owner.name || apiHypothesis.owner.email || `Пользователь ${apiHypothesis.owner.id}`,
      )
    }

    const currentUserId = parsePrefixedId(user?.id, "user-")
    if (currentUserId && user?.name) {
      map.set(currentUserId, user.name)
    }

    return Array.from(map.entries())
      .map(([ownerId, name]) => ({ id: ownerId, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [apiHypothesis?.owner, user?.id, user?.name])

  const teamName = apiHypothesis?.team?.name || "-"
  const ownerName =
    apiHypothesis?.owner?.name || apiHypothesis?.owner?.email || (hypothesis?.ownerId ? `Пользователь #${hypothesis.ownerId}` : "-")

  const getDaysRemaining = () => {
    if (!hypothesis?.deadline) return null
    const today = new Date()
    const deadline = new Date(hypothesis.deadline)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining()

  const handleOpenEditDialog = () => {
    if (!hypothesis) {
      return
    }

    setEditStatus(hypothesis.status)
    setEditOwnerId(hypothesis.ownerId)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!hypothesis || !editStatus) {
      setIsEditDialogOpen(false)
      return
    }

    try {
      if (editStatus !== hypothesis.status) {
        await transitionHypothesisFx({
          id: numericId,
          to_status: editStatus,
        })
      }
    } finally {
      setIsEditDialogOpen(false)
    }
  }

  const handleAddComment = () => {
    const normalizedComment = newComment.trim()

    if (!normalizedComment || !user || !hypothesis) {
      return
    }

    const nowIso = new Date().toISOString()

    const addedComment: HypothesisComment = {
      id: `comment-${Date.now()}`,
      hypothesisId: hypothesis.id,
      userId: user.id,
      userName: user.name,
      text: normalizedComment,
      createdAt: nowIso,
    }

    const historyEntry: AuditLogEntry = {
      id: `history-${Date.now()}`,
      entityType: "hypothesis",
      entityId: hypothesis.id,
      action: "update",
      changes: {
        comment: {
          old: null,
          new: normalizedComment,
        },
      },
      userId: user.id,
      userName: user.name,
      timestamp: nowIso,
    }

    setComments((prev) => [addedComment, ...prev])
    setHistoryEntries((prev) => [historyEntry, ...prev])
    setNewComment("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (!hypothesis) {
    return (
      <>
        <Header
          breadcrumbs={[
            { title: "Гипотезы", href: "/hypotheses" },
            { title: "Загрузка..." },
          ]}
        />
        <main className="flex-1 overflow-auto">
          <div className="container pl-8 pr-8 py-6 text-sm text-muted-foreground">Загрузка гипотезы...</div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header
        breadcrumbs={[
          { title: "Гипотезы", href: "/hypotheses" },
          { title: hypothesis.code },
        ]}
      />

      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/hypotheses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к гипотезам
            </Link>
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">{hypothesis.title}</h1>
                <StatusBadge status={hypothesis.status} />
              </div>
              <p className="text-sm text-muted-foreground font-mono">{hypothesis.code}</p>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasPermission("hypothesis:edit") && (
                    <DropdownMenuItem onClick={handleOpenEditDialog}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                  )}
                  {hasPermission("hypothesis:delete") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="scoring">Скоринг</TabsTrigger>
              <TabsTrigger value="deep-dive">Deep Dive</TabsTrigger>
              <TabsTrigger value="experiments">
                Эксперименты
                {!isExperimentsLoading && experiments.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5">
                    {experiments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="passport">Паспорт</TabsTrigger>
              <TabsTrigger value="committee">Решение ПК</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <StatusTransitionPanel
                hypothesis={hypothesis}
                experiments={experiments}
                onTransition={(toStatus, data) => {
                  void transitionHypothesisFx({
                    id: numericId,
                    to_status: toStatus,
                    comment: typeof data?.comment === "string" ? data.comment : undefined,
                  })
                }}
                onTabChange={setActiveTab}
              />

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Описание</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{hypothesis.description || "Описание не заполнено"}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Детали</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {daysRemaining !== null && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            SLA
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              daysRemaining <= 0
                                ? "text-destructive"
                                : daysRemaining <= 3
                                  ? "text-warning"
                                  : "text-success"
                            }`}
                          >
                            {daysRemaining <= 0
                              ? `Просрочено на ${Math.abs(daysRemaining)} дн.`
                              : `${daysRemaining} дн. осталось`}
                          </span>
                        </div>
                        <Separator />
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Команда</span>
                      <span className="text-sm font-medium">{teamName}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ответственный</span>
                      <span className="text-sm font-medium">{ownerName}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Создано</span>
                      <span className="text-sm font-medium">{formatDate(hypothesis.createdAt)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Обновлено</span>
                      <span className="text-sm font-medium">{formatDate(hypothesis.updatedAt)}</span>
                    </div>
                    {hypothesis.scoring && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">ICE Score</span>
                          <span className="text-sm font-medium font-mono">{hypothesis.scoring.totalScore}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>ICE Score</CardDescription>
                    <CardTitle className="text-3xl">{hypothesis.scoring?.totalScore || "-"}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Эксперименты</CardDescription>
                    <CardTitle className="text-3xl">{experiments.length}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Deep Dive</CardDescription>
                    <CardTitle className="text-3xl">{hypothesis.deepDive?.completedAt ? "Готово" : "В работе"}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Решение</CardDescription>
                    <CardTitle className="text-3xl capitalize">{hypothesis.decision?.result || "Ожидание"}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Комментарии
                    {comments.length > 0 && <Badge variant="secondary">{comments.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user?.name
                          ?.split(" ")
                          .map((namePart) => namePart[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        placeholder="Добавить комментарий..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {comments.length > 0 && <Separator />}

                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {comment.userName
                              .split(" ")
                              .map((namePart) => namePart[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Комментариев пока нет</p>
                  )}
                </CardContent>
              </Card>

              <RisksResourcesForm
                risks={hypothesis.risks}
                resources={hypothesis.resources}
                recommendations={hypothesis.recommendations}
                readOnly={!hasPermission("hypothesis:edit")}
              />
            </TabsContent>

            <TabsContent value="scoring">
              <ScoringForm initialScoring={hypothesis.scoring} readOnly={!hasPermission("hypothesis:score")} />
            </TabsContent>

            <TabsContent value="deep-dive">
              <DeepDiveForm
                hypothesisId={hypothesis.id}
                initialData={hypothesis.deepDive}
                readOnly={!hasPermission("hypothesis:edit")}
              />
            </TabsContent>

            <TabsContent value="experiments">
              <ExperimentsList experiments={experiments} hypothesisId={hypothesis.id} />
            </TabsContent>

            <TabsContent value="passport">
              <PassportView hypothesis={hypothesis} experiments={experiments} readOnly={!hasPermission("hypothesis:edit")} />
            </TabsContent>

            <TabsContent value="committee">
              <CommitteeDecisionForm
                hypothesis={hypothesis}
                onTabChange={setActiveTab}
                readOnly={!hasPermission("hypothesis:edit")}
              />
            </TabsContent>

            <TabsContent value="history">
              <HistoryTimeline entries={historyEntries} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать гипотезу</DialogTitle>
            <DialogDescription>Измените статус гипотезы</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Статус</Label>
              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as HypothesisStatus)}>
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabelsRu[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-owner">Ответственный</Label>
              <Select value={editOwnerId || "none"} onValueChange={(value) => setEditOwnerId(value === "none" ? "" : value)}>
                <SelectTrigger id="edit-owner">
                  <SelectValue placeholder="Выберите ответственного" />
                </SelectTrigger>
                <SelectContent>
                  {ownerOptions.length > 0 ? (
                    ownerOptions.map((ownerOption) => (
                      <SelectItem key={ownerOption.id} value={ownerOption.id}>
                        {ownerOption.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none">Нет доступных пользователей</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
