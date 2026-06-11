"use client"

import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Target,
  FlaskConical,
  Vote,
  ChevronRight,
  RotateCcw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StatusBadge } from "./status-badge"
import { StatusTransitionConfirmDialog } from "./status-transition-confirm-dialog"
import { StatusTransitionTerminalCard } from "./status-transition-terminal-card"
import type { Hypothesis, HypothesisStatus, Experiment } from "@/lib/types"

const STATUS_FLOW: Record<HypothesisStatus, {
  next: HypothesisStatus | null
  prev: HypothesisStatus | null
  label: string
  icon: React.ElementType
}> = {
  backlog: { next: "scoring", prev: null, label: "Идея", icon: FileText },
  scoring: { next: "deep_dive", prev: "backlog", label: "Первичный скоринг", icon: Target },
  deep_dive: { next: "experiment", prev: "scoring", label: "Deep Dive", icon: FlaskConical },
  experiment: { next: "go_no_go", prev: "deep_dive", label: "Эксперимент", icon: FlaskConical },
  go_no_go: { next: "done", prev: "experiment", label: "Питч на ПК", icon: Vote },
  done: { next: null, prev: null, label: "Done", icon: CheckCircle2 },
  archived: { next: null, prev: null, label: "Архив", icon: FileText },
}

const SCORING_THRESHOLD = 7.0

interface StatusTransitionPanelProps {
  hypothesis: Hypothesis
  experiments?: Experiment[]
  onTransition?: (toStatus: HypothesisStatus, data?: Record<string, unknown>) => Promise<void> | void
  onTabChange?: (tab: string) => void
  transitionError?: string | null
}

interface TransitionCondition {
  id: string
  label: string
  isMet: boolean
  description?: string
}

export function StatusTransitionPanel({
  hypothesis,
  experiments = [],
  onTransition,
  onTabChange,
  transitionError,
}: StatusTransitionPanelProps) {
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [targetStatus, setTargetStatus] = useState<HypothesisStatus | null>(null)
  const [decisionResult, setDecisionResult] = useState<"go" | "no_go" | "iterate" | "">("")
  const [decisionComment, setDecisionComment] = useState("")
  const [nextStep, setNextStep] = useState<"deep_dive" | "done" | "">("")

  const currentStatus = hypothesis.status
  const statusConfig = STATUS_FLOW[currentStatus]

  const getConditionsForTransition = (): TransitionCondition[] => {
    switch (currentStatus) {
      case "backlog": {
        const problem = hypothesis.problem || hypothesis.description
        const solution = hypothesis.solution
        const targetAudience = hypothesis.targetAudience || hypothesis.deepDive?.targetAudience

        return [
          { id: "title", label: "Название", isMet: !!hypothesis.title && hypothesis.title.length > 0 },
          { id: "description", label: "Проблема / боль клиента", isMet: !!problem && problem.length > 10 },
          { id: "belief", label: "Формулировка «Мы верим, что…»", isMet: !!solution && solution.length > 10 },
          { id: "assumptions", label: "Ключевые предположения", isMet: !!hypothesis.assumptions && hypothesis.assumptions.length > 10 },
          { id: "audience", label: "Целевая аудитория", isMet: !!targetAudience && targetAudience.length > 3 },
          { id: "owner", label: "Назначен Product Discovery менеджер", isMet: !!hypothesis.ownerId },
        ]
      }
      case "scoring": {
        const score = hypothesis.scoring?.totalScore || 0
        const normalizedScore = Math.min(10, score / 50)

        return [{
          id: "scoring_complete",
          label: `Итоговый балл: ${normalizedScore.toFixed(1)} / 10`,
          isMet: normalizedScore >= SCORING_THRESHOLD,
          description: `Порог из админки: ${SCORING_THRESHOLD}`,
        }]
      }
      case "deep_dive": {
        const stages = hypothesis.deepDive?.stages || []
        const requiredStages = [
          { id: "interviews", label: "Интервью (>=3)", stageIds: ["stage-3"] },
          { id: "pain", label: "Подтвержденная боль", stageIds: ["stage-1"] },
          { id: "economics", label: "Позитивная юнит-экономика", stageIds: ["stage-5"] },
          { id: "tech", label: "Техническая реализуемость", stageIds: ["stage-6"] },
          { id: "artifacts", label: "Загружены ключевые артефакты", stageIds: ["stage-7"] },
        ]

        return requiredStages.map((requirement) => {
          const relevantStages = stages.filter((stage) => requirement.stageIds.includes(stage.stageId))
          const isCompleted = relevantStages.length > 0 && relevantStages.every((stage) => stage.isCompleted)

          return {
            id: requirement.id,
            label: requirement.label,
            isMet: isCompleted,
          }
        })
      }
      case "experiment": {
        const completedExperiments = experiments.filter((experiment) => experiment.status === "completed")
        const hasResults = completedExperiments.some((experiment) => experiment.whatWorked || experiment.whatDidNotWork)
        const hasPassport = !!hypothesis.passport?.summary

        return [
          {
            id: "experiments_done",
            label: `Завершены обязательные эксперименты (${completedExperiments.length}/${experiments.length})`,
            isMet: completedExperiments.length > 0 && completedExperiments.length >= Math.ceil(experiments.length * 0.5),
          },
          { id: "results_filled", label: "Заполнены результаты", isMet: hasResults },
          { id: "passport_ready", label: "Сформирован паспорт гипотезы", isMet: hasPassport },
        ]
      }
      case "go_no_go": {
        const hasVotes = hypothesis.committeeVotes && hypothesis.committeeVotes.length > 0
        const votesCount = hypothesis.committeeVotes?.filter((vote) => vote.vote !== null).length || 0
        const totalMembers = 5
        const quorumReached = votesCount >= Math.ceil(totalMembers * 0.5)

        return [
          { id: "passport", label: "Паспорт гипотезы", isMet: !!hypothesis.passport?.summary },
          { id: "scoring_data", label: "Скоринг (первичный + глубокий)", isMet: !!hypothesis.scoring?.totalScore },
          { id: "experiment_results", label: "Результаты экспериментов", isMet: experiments.some((experiment) => experiment.status === "completed") },
          { id: "risks", label: "Риски и оценка ресурсов", isMet: (hypothesis.risks?.length || 0) > 0 },
          { id: "quorum", label: `Кворум участников (${votesCount}/${totalMembers})`, isMet: quorumReached },
          { id: "voting_done", label: "Голосование завершено", isMet: !!hasVotes && quorumReached },
        ]
      }
      default:
        return []
    }
  }

  const conditions = getConditionsForTransition()
  const allConditionsMet = conditions.every((condition) => condition.isMet)
  const metCount = conditions.filter((condition) => condition.isMet).length
  const progress = conditions.length > 0 ? (metCount / conditions.length) * 100 : 100

  const getSLAStatus = () => {
    if (!hypothesis.deadline) return null

    const today = new Date()
    const deadline = new Date(hypothesis.deadline)
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return { status: "overdue" as const, label: "Просрочено" }
    if (diffDays <= 3) return { status: "warning" as const, label: "Приближение" }
    return { status: "ok" as const, label: "В срок" }
  }

  const slaStatus = getSLAStatus()

  const handleTransitionClick = (toStatus: HypothesisStatus) => {
    setTargetStatus(toStatus)
    setIsTransitionDialogOpen(true)
  }

  const handleConfirmTransition = async () => {
    if (!targetStatus) {
      return
    }

    setIsLoading(true)

    const transitionData: Record<string, unknown> = {}

    if (currentStatus === "go_no_go" && decisionResult) {
      transitionData.comment = decisionComment
      transitionData.decision = {
        result: decisionResult,
        comment: decisionComment,
        nextStep,
      }
    }

    try {
      await onTransition?.(targetStatus, transitionData)
      setIsTransitionDialogOpen(false)
      setDecisionResult("")
      setDecisionComment("")
      setNextStep("")
    } catch {
      // keep dialog open after UI feedback from parent handler
    } finally {
      setIsLoading(false)
    }
  }

  const getVotingSummary = () => {
    const votes = hypothesis.committeeVotes || []
    return {
      go: votes.filter((vote) => vote.vote === "go").length,
      no_go: votes.filter((vote) => vote.vote === "no_go").length,
      iterate: votes.filter((vote) => vote.vote === "iterate").length,
    }
  }

  const votingSummary = getVotingSummary()

  if (currentStatus === "done" || currentStatus === "archived") {
    return (
      <StatusTransitionTerminalCard
        hypothesis={hypothesis}
        currentStatus={currentStatus}
        onTabChange={onTabChange}
      />
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = statusConfig.icon
                return <Icon className="h-5 w-5 text-primary" />
              })()}
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {hypothesis.code}: {hypothesis.title.length > 30 ? `${hypothesis.title.slice(0, 30)}...` : hypothesis.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  Статус: <StatusBadge status={currentStatus} />
                  {slaStatus && (
                    <Badge
                      variant={slaStatus.status === "overdue" ? "destructive" : slaStatus.status === "warning" ? "secondary" : "outline"}
                      className="ml-2"
                    >
                      SLA: {slaStatus.label}
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {conditions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {currentStatus === "backlog" && "Обязательные поля для перехода в «Первичный скоринг»:"}
                  {currentStatus === "scoring" && "Результат первичного скоринга:"}
                  {currentStatus === "deep_dive" && "Полнота обязательного Deep Dive чек-листа:"}
                  {currentStatus === "experiment" && "Условия перехода в «Питч»:"}
                  {currentStatus === "go_no_go" && "Готовность к голосованию:"}
                </p>
                <span className="text-sm text-muted-foreground">
                  {metCount}/{conditions.length}
                </span>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="space-y-2">
                {conditions.map((condition) => (
                  <div key={condition.id} className="flex items-start gap-2 text-sm">
                    {condition.isMet ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div>
                      <span className={condition.isMet ? "text-muted-foreground" : "text-foreground"}>
                        {condition.label}
                      </span>
                      {condition.description && (
                        <p className="text-xs text-muted-foreground">{condition.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStatus === "go_no_go" && hypothesis.committeeVotes && (
            <div className="space-y-3">
              <Separator />
              <p className="text-sm font-medium">Итоги голосования:</p>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">Go: {votingSummary.go}</span>
                <span className="text-destructive">No-Go: {votingSummary.no_go}</span>
                <span className="text-amber-600">Iterate: {votingSummary.iterate}</span>
              </div>
              {hypothesis.decision?.result && (
                <p className="text-sm">
                  Финальное решение:{" "}
                  <Badge variant="outline">
                    {hypothesis.decision.result === "go"
                      ? "Go"
                      : hypothesis.decision.result === "no_go"
                        ? "No-Go"
                        : "Iterate"}
                  </Badge>
                </p>
              )}
            </div>
          )}

          {!allConditionsMet && conditions.length > 0 && (
            <>
              <Separator />
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Блокирующие условия</AlertTitle>
                <AlertDescription>
                  {currentStatus === "backlog" && "Переход недоступен, пока не заполнены все обязательные поля"}
                  {currentStatus === "scoring" && "Чтобы перейти в Deep Dive, увеличьте итоговый балл до порога или измените параметры в админке (роль Admin)"}
                  {currentStatus === "deep_dive" && (
                    <>
                      Не заполнены обязательные пункты: {conditions.filter((condition) => !condition.isMet).map((condition) => `«${condition.label}»`).join(", ")}
                    </>
                  )}
                  {currentStatus === "experiment" && "Не выполнены все условия для перехода к питчу"}
                  {currentStatus === "go_no_go" && "Голосование не завершено или не достигнут кворум"}
                </AlertDescription>
              </Alert>
            </>
          )}

          {transitionError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Не удалось выполнить переход</AlertTitle>
              <AlertDescription>{transitionError}</AlertDescription>
            </Alert>
          )}

          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Сохранить
            </Button>

            {statusConfig.prev && (
              <Button variant="outline" size="sm" onClick={() => handleTransitionClick(statusConfig.prev)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Вернуть в «{STATUS_FLOW[statusConfig.prev].label}»
              </Button>
            )}

            {currentStatus === "scoring" && (
              <Button variant="outline" size="sm" onClick={() => onTabChange?.("scoring")}>
                Пересчитать
              </Button>
            )}

            {currentStatus === "deep_dive" && (
              <Button variant="outline" size="sm" onClick={() => onTabChange?.("deep-dive")}>
                Проверить чек-лист
              </Button>
            )}

            {currentStatus === "experiment" && (
              <Button variant="outline" size="sm" onClick={() => onTabChange?.("passport")}>
                Сформировать паспорт
              </Button>
            )}

            {currentStatus === "go_no_go" && (
              <>
                <Button variant="outline" size="sm" onClick={() => onTabChange?.("committee")}>
                  Открыть голосование
                </Button>
                <Button variant="outline" size="sm">
                  Напомнить участникам
                </Button>
              </>
            )}

            {statusConfig.next && (
              <Button size="sm" disabled={!allConditionsMet} onClick={() => handleTransitionClick(statusConfig.next)}>
                {currentStatus === "backlog" && "Отправить в первичный скоринг"}
                {currentStatus === "scoring" && "Перевести в Deep Dive"}
                {currentStatus === "deep_dive" && "Перевести в «Эксперимент»"}
                {currentStatus === "experiment" && "Вынести на продуктовый комитет"}
                {currentStatus === "go_no_go" && "Зафиксировать «Решение принято»"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <StatusTransitionConfirmDialog
        open={isTransitionDialogOpen}
        currentStatus={currentStatus}
        targetStatus={targetStatus}
        isLoading={isLoading}
        decisionResult={decisionResult}
        decisionComment={decisionComment}
        nextStep={nextStep}
        onOpenChange={setIsTransitionDialogOpen}
        onDecisionResultChange={setDecisionResult}
        onDecisionCommentChange={setDecisionComment}
        onNextStepChange={setNextStep}
        onConfirm={handleConfirmTransition}
      />
    </>
  )
}
