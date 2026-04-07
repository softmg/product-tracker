"use client"

import { use, useEffect, useState } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Pencil, Trash2, MoreHorizontal, Clock, Send, MessageSquare } from "lucide-react"
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
  getHypothesisById,
  getExperimentsByHypothesisId,
  getUserById,
  getTeamById,
  getCommentsByHypothesisId,
  mockAuditLog,
  mockUsers,
  statusDisplayInfo,
} from "@/lib/mock-data"
import type { HypothesisStatus } from "@/lib/types"
import { fetchHypothesisFx, transitionHypothesisFx } from "@/lib/stores/hypotheses/model"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function HypothesisPage({ params }: PageProps) {
  const { id } = use(params)
  const { user, hasPermission } = useAuth()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editStatus, setEditStatus] = useState<HypothesisStatus | "">("")
  const [editOwnerId, setEditOwnerId] = useState("")
  const [newComment, setNewComment] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch via Effector on mount — populates $currentHypothesis for other consumers
  useEffect(() => {
    const numericId = Number.parseInt(id, 10)
    if (!Number.isNaN(numericId)) {
      void fetchHypothesisFx(numericId)
    }
  }, [id])

  // Resolve hypothesis: try direct id, then "hyp-<id>" for numeric mock ids
  const hypothesis = getHypothesisById(id) ?? getHypothesisById(`hyp-${id}`)

  if (!hypothesis) {
    notFound()
  }

  const experiments = getExperimentsByHypothesisId(id)
  const owner = getUserById(hypothesis.ownerId)
  const team = getTeamById(hypothesis.teamId)
  const comments = getCommentsByHypothesisId(id)
  const historyEntries = mockAuditLog.filter(
    entry => entry.entityId === id || 
    (entry.entityType === "experiment" && experiments.some(e => e.id === entry.entityId))
  )
  
  // Calculate SLA days remaining
  const getDaysRemaining = () => {
    if (!hypothesis.deadline) return null
    const today = new Date()
    const deadline = new Date(hypothesis.deadline)
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  const daysRemaining = getDaysRemaining()
  
  const handleOpenEditDialog = () => {
    setEditStatus(hypothesis.status)
    setEditOwnerId(hypothesis.ownerId)
    setIsEditDialogOpen(true)
  }
  
  const handleSaveEdit = () => {
    // Mock save - in real app would call API
    console.log("[v0] Saving edit:", { status: editStatus, ownerId: editOwnerId })
    setIsEditDialogOpen(false)
  }
  
  const handleAddComment = () => {
    if (!newComment.trim()) return
    // Mock add comment - in real app would call API
    console.log("[v0] Adding comment:", newComment)
    setNewComment("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <>
      <Header 
        breadcrumbs={[
          { title: "Гипотезы", href: "/hypotheses" },
          { title: hypothesis.code }
        ]} 
      />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/hypotheses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к гипотезам
            </Link>
          </Button>

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">
                  {hypothesis.title}
                </h1>
                <StatusBadge status={hypothesis.status} />
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                {hypothesis.code}
              </p>
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview">Обзор</TabsTrigger>
              <TabsTrigger value="scoring">Скоринг</TabsTrigger>
              <TabsTrigger value="deep-dive">Deep Dive</TabsTrigger>
              <TabsTrigger value="experiments">
                Эксперименты
                {experiments.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5">
                    {experiments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="passport">Паспорт</TabsTrigger>
              <TabsTrigger value="committee">Решение ПК</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Status Transition Panel */}
              <StatusTransitionPanel
                hypothesis={hypothesis}
                experiments={experiments}
                onTransition={(toStatus, data) => {
                  const numericId = Number.parseInt(id, 10)
                  if (!Number.isNaN(numericId)) {
                    void transitionHypothesisFx({
                      id: numericId,
                      to_status: toStatus,
                      comment: data?.comment,
                    })
                  }
                }}
                onTabChange={setActiveTab}
              />

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Info */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Описание</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{hypothesis.description}</p>
                  </CardContent>
                </Card>

                {/* Meta Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Детали</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* SLA */}
                    {daysRemaining !== null && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            SLA
                          </span>
                          <span className={`text-sm font-medium ${
                            daysRemaining <= 0 
                              ? 'text-destructive' 
                              : daysRemaining <= 3 
                                ? 'text-warning' 
                                : 'text-success'
                          }`}>
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
                      <span className="text-sm font-medium">{team?.name || "-"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Ответственный</span>
                      <span className="text-sm font-medium">{owner?.name || "-"}</span>
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
                          <span className="text-sm font-medium font-mono">
                            {hypothesis.scoring.totalScore}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>ICE Score</CardDescription>
                    <CardTitle className="text-3xl">
                      {hypothesis.scoring?.totalScore || "-"}
                    </CardTitle>
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
                    <CardTitle className="text-3xl">
                      {hypothesis.deepDive?.completedAt ? "Готово" : "В работе"}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Решение</CardDescription>
                    <CardTitle className="text-3xl capitalize">
                      {hypothesis.decision?.result || "Ожидание"}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Comments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Комментарии
                    {comments.length > 0 && (
                      <Badge variant="secondary">{comments.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Comment */}
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
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
                      <Button 
                        size="icon" 
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {comments.length > 0 && <Separator />}

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {comment.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

{comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Комментариев пока нет
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Risks, Resources, Recommendations */}
              <RisksResourcesForm 
                risks={hypothesis.risks}
                resources={hypothesis.resources}
                recommendations={hypothesis.recommendations}
                readOnly={!hasPermission("hypothesis:edit")}
              />
            </TabsContent>

            {/* Scoring Tab */}
            <TabsContent value="scoring">
              <ScoringForm 
                initialScoring={hypothesis.scoring}
                readOnly={!hasPermission("hypothesis:score")}
              />
            </TabsContent>

            {/* Deep Dive Tab */}
            <TabsContent value="deep-dive">
              <DeepDiveForm 
                hypothesisId={hypothesis.id}
                initialData={hypothesis.deepDive}
                readOnly={!hasPermission("hypothesis:edit")}
              />
            </TabsContent>

            {/* Experiments Tab */}
            <TabsContent value="experiments">
              <ExperimentsList 
                experiments={experiments}
                hypothesisId={hypothesis.id}
              />
            </TabsContent>

            {/* Passport Tab */}
            <TabsContent value="passport">
              <PassportView 
                hypothesis={hypothesis}
                experiments={experiments}
                readOnly={!hasPermission("hypothesis:edit")}
              />
            </TabsContent>

            {/* Committee Decision Tab */}
            <TabsContent value="committee">
              <CommitteeDecisionForm 
                hypothesis={hypothesis}
                onTabChange={setActiveTab}
                readOnly={!hasPermission("hypothesis:edit")}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <HistoryTimeline entries={historyEntries} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать гипотезу</DialogTitle>
            <DialogDescription>
              Измените статус или ответственного за гипотезу
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Статус</Label>
              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as HypothesisStatus)}>
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusDisplayInfo).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-owner">Ответственный</Label>
              <Select value={editOwnerId} onValueChange={setEditOwnerId}>
                <SelectTrigger id="edit-owner">
                  <SelectValue placeholder="Выберите ответственного" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.filter(u => u.isActive && u.role !== 'initiator').map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEdit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
