"use client"

import { useState } from "react"
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  FileText,
  Users,
  Target,
  FlaskConical,
  Vote,
  Archive,
  ChevronRight,
  Loader2,
  RotateCcw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "./status-badge"
import type { Hypothesis, HypothesisStatus, Experiment } from "@/lib/types"

// Status flow configuration
const STATUS_FLOW: Record<HypothesisStatus, {
  next: HypothesisStatus | null
  prev: HypothesisStatus | null
  label: string
  icon: React.ElementType
}> = {
  backlog: { next: 'scoring', prev: null, label: 'Идея', icon: FileText },
  scoring: { next: 'deep_dive', prev: 'backlog', label: 'Первичный скоринг', icon: Target },
  deep_dive: { next: 'experiment', prev: 'scoring', label: 'Deep Dive', icon: FlaskConical },
  experiment: { next: 'analysis', prev: 'deep_dive', label: 'Эксперимент', icon: FlaskConical },
  analysis: { next: 'go_no_go', prev: 'experiment', label: 'Питч на ПК', icon: Users },
  go_no_go: { next: 'done', prev: 'analysis', label: 'Решение принято', icon: Vote },
  done: { next: null, prev: null, label: 'Архив', icon: Archive },
}

// Thresholds (would come from admin settings in real app)
const SCORING_THRESHOLD = 7.0
const DEEP_SCORING_THRESHOLD = 7.5

interface StatusTransitionPanelProps {
  hypothesis: Hypothesis
  experiments?: Experiment[]
  onTransition?: (toStatus: HypothesisStatus, data?: Record<string, unknown>) => void
  onTabChange?: (tab: string) => void
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
  onTabChange 
}: StatusTransitionPanelProps) {
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [targetStatus, setTargetStatus] = useState<HypothesisStatus | null>(null)
  const [decisionResult, setDecisionResult] = useState<'go' | 'no_go' | 'iterate' | ''>('')
  const [decisionComment, setDecisionComment] = useState('')
  const [nextStep, setNextStep] = useState<'deep_dive' | 'done' | ''>('')

  const currentStatus = hypothesis.status
  const statusConfig = STATUS_FLOW[currentStatus]

  // Calculate conditions based on current status
  const getConditionsForTransition = (): TransitionCondition[] => {
    switch (currentStatus) {
      case 'backlog': // Идея -> Первичный скоринг
        return [
          { 
            id: 'title', 
            label: 'Название', 
            isMet: !!hypothesis.title && hypothesis.title.length > 0 
          },
          { 
            id: 'description', 
            label: 'Проблема / боль клиента', 
            isMet: !!hypothesis.description && hypothesis.description.length > 10 
          },
          { 
            id: 'belief', 
            label: 'Формулировка «Мы верим, что…»', 
            isMet: hypothesis.description?.toLowerCase().includes('верим') || hypothesis.description?.toLowerCase().includes('believe') || true // mock
          },
          { 
            id: 'assumptions', 
            label: 'Ключевые предположения', 
            isMet: true // would check specific field
          },
          { 
            id: 'audience', 
            label: 'Целевая аудитория', 
            isMet: !!hypothesis.deepDive?.targetAudience || true // mock
          },
          { 
            id: 'owner', 
            label: 'Назначен Product Discovery менеджер', 
            isMet: !!hypothesis.ownerId 
          },
        ]
      
      case 'scoring': // Первичный скоринг -> Deep Dive
        const score = hypothesis.scoring?.totalScore || 0
        // Normalize score to 10-point scale for display (assuming totalScore is weighted)
        const normalizedScore = Math.min(10, score / 50) // Mock normalization
        return [
          { 
            id: 'scoring_complete', 
            label: `Итоговый балл: ${normalizedScore.toFixed(1)} / 10`, 
            isMet: normalizedScore >= SCORING_THRESHOLD,
            description: `Порог из админки: ${SCORING_THRESHOLD}`
          },
        ]
      
      case 'deep_dive': // Deep Dive -> Эксперимент
        const stages = hypothesis.deepDive?.stages || []
        const requiredStages = [
          { id: 'interviews', label: 'Интервью (>=3)', stageIds: ['stage-3'] },
          { id: 'pain', label: 'Подтвержденная боль', stageIds: ['stage-1'] },
          { id: 'economics', label: 'Позитивная юнит-экономика', stageIds: ['stage-5'] },
          { id: 'tech', label: 'Техническая реализуемость', stageIds: ['stage-6'] },
          { id: 'artifacts', label: 'Загружены ключевые артефакты', stageIds: ['stage-7'] },
        ]
        return requiredStages.map(req => {
          const relevantStages = stages.filter(s => req.stageIds.includes(s.stageId))
          const isCompleted = relevantStages.length > 0 && relevantStages.every(s => s.isCompleted)
          return {
            id: req.id,
            label: req.label,
            isMet: isCompleted
          }
        })
      
      case 'experiment': // Эксперимент -> Питч
        const completedExperiments = experiments.filter(e => e.status === 'completed')
        const hasResults = completedExperiments.some(e => e.whatWorked || e.whatDidNotWork)
        const hasPassport = !!hypothesis.passport?.summary
        return [
          { 
            id: 'experiments_done', 
            label: `Завершены обязательные эксперименты (${completedExperiments.length}/${experiments.length})`, 
            isMet: completedExperiments.length > 0 && completedExperiments.length >= Math.ceil(experiments.length * 0.5)
          },
          { 
            id: 'results_filled', 
            label: 'Заполнены результаты', 
            isMet: hasResults
          },
          { 
            id: 'passport_ready', 
            label: 'Сформирован паспорт гипотезы', 
            isMet: hasPassport
          },
        ]
      
      case 'analysis': // Питч -> Решение принято
        const hasVotes = hypothesis.committeeVotes && hypothesis.committeeVotes.length > 0
        const votesCount = hypothesis.committeeVotes?.filter(v => v.vote !== null).length || 0
        const totalMembers = 5 // Would come from admin settings
        const quorumReached = votesCount >= Math.ceil(totalMembers * 0.5)
        return [
          { 
            id: 'passport', 
            label: 'Паспорт гипотезы', 
            isMet: !!hypothesis.passport?.summary 
          },
          { 
            id: 'scoring_data', 
            label: 'Скоринг (первичный + глубокий)', 
            isMet: !!hypothesis.scoring?.totalScore 
          },
          { 
            id: 'experiment_results', 
            label: 'Результаты экспериментов', 
            isMet: experiments.some(e => e.status === 'completed') 
          },
          { 
            id: 'risks', 
            label: 'Риски и оценка ресурсов', 
            isMet: (hypothesis.risks?.length || 0) > 0 
          },
          { 
            id: 'quorum', 
            label: `Кворум участников (${votesCount}/${totalMembers})`, 
            isMet: quorumReached 
          },
          { 
            id: 'voting_done',
            label: 'Голосование завершено',
            isMet: !!hasVotes && quorumReached
          },
        ]
      
      case 'go_no_go': // Решение принято -> Архив или обратно
        return [
          { 
            id: 'decision', 
            label: 'Зафиксировано итоговое решение', 
            isMet: !!hypothesis.decision?.result 
          },
          { 
            id: 'comment', 
            label: 'Добавлен комментарий комитета', 
            isMet: !!hypothesis.decision?.comment 
          },
          { 
            id: 'next_step', 
            label: 'Определен следующий шаг', 
            isMet: !!hypothesis.decision?.actionPlan || !!hypothesis.decision?.result
          },
        ]
      
      default:
        return []
    }
  }

  const conditions = getConditionsForTransition()
  const allConditionsMet = conditions.every(c => c.isMet)
  const metCount = conditions.filter(c => c.isMet).length
  const progress = conditions.length > 0 ? (metCount / conditions.length) * 100 : 100

  // Get SLA status
  const getSLAStatus = () => {
    if (!hypothesis.deadline) return null
    const today = new Date()
    const deadline = new Date(hypothesis.deadline)
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return { status: 'overdue', label: 'Просрочено', days: Math.abs(diffDays) }
    if (diffDays <= 3) return { status: 'warning', label: 'Приближение', days: diffDays }
    return { status: 'ok', label: 'В срок', days: diffDays }
  }

  const slaStatus = getSLAStatus()

  const handleTransitionClick = (toStatus: HypothesisStatus) => {
    setTargetStatus(toStatus)
    setIsTransitionDialogOpen(true)
  }

  const handleConfirmTransition = async () => {
    if (!targetStatus) return
    
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const transitionData: Record<string, unknown> = {}
    
    if (currentStatus === 'go_no_go' && decisionResult) {
      transitionData.decision = {
        result: decisionResult,
        comment: decisionComment,
        nextStep: nextStep
      }
    }
    
    onTransition?.(targetStatus, transitionData)
    
    setIsLoading(false)
    setIsTransitionDialogOpen(false)
    setDecisionResult('')
    setDecisionComment('')
    setNextStep('')
  }

  // Voting summary for go_no_go status
  const getVotingSummary = () => {
    const votes = hypothesis.committeeVotes || []
    return {
      go: votes.filter(v => v.vote === 'go').length,
      no_go: votes.filter(v => v.vote === 'no_go').length,
      iterate: votes.filter(v => v.vote === 'iterate').length,
    }
  }

  const votingSummary = getVotingSummary()

  // Archive status - read only
  if (currentStatus === 'done') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Архив</CardTitle>
                <CardDescription>
                  Закрыта: {hypothesis.updatedAt ? new Date(hypothesis.updatedAt).toLocaleDateString('ru-RU') : '-'}
                </CardDescription>
              </div>
            </div>
            <StatusBadge status={currentStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hypothesis.decision && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Причина закрытия:</p>
              <p className="text-sm text-muted-foreground">
                Решение комитета: {hypothesis.decision.result === 'go' ? 'Go' : hypothesis.decision.result === 'no_go' ? 'No-Go' : 'Iterate'}
              </p>
              {hypothesis.decision.comment && (
                <p className="text-sm text-muted-foreground">
                  Комментарий: &quot;{hypothesis.decision.comment}&quot;
                </p>
              )}
            </div>
          )}
          
          <Separator />
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onTabChange?.('passport')}>
              <FileText className="mr-2 h-4 w-4" />
              Просмотреть паспорт
            </Button>
            <Button variant="outline" size="sm" onClick={() => onTabChange?.('history')}>
              <Clock className="mr-2 h-4 w-4" />
              Просмотреть аудит
            </Button>
            <Button variant="outline" size="sm">
              Экспорт PDF
            </Button>
            <Button variant="outline" size="sm">
              Экспорт Excel
            </Button>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Редактирование основных полей недоступно для архивных гипотез
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
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
                <CardTitle className="text-lg flex items-center gap-2">
                  {hypothesis.code}: {hypothesis.title.length > 30 ? hypothesis.title.slice(0, 30) + '...' : hypothesis.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  Статус: <StatusBadge status={currentStatus} />
                  {slaStatus && (
                    <Badge 
                      variant={slaStatus.status === 'overdue' ? 'destructive' : slaStatus.status === 'warning' ? 'secondary' : 'outline'}
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
          {/* Conditions checklist */}
          {conditions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {currentStatus === 'backlog' && 'Обязательные поля для перехода в «Первичный скоринг»:'}
                  {currentStatus === 'scoring' && 'Результат первичного скоринга:'}
                  {currentStatus === 'deep_dive' && 'Полнота обязательного Deep Dive чек-листа:'}
                  {currentStatus === 'experiment' && 'Условия перехода в «Питч»:'}
                  {currentStatus === 'analysis' && 'Готовность к голосованию:'}
                  {currentStatus === 'go_no_go' && 'Обязательные поля перед завершением:'}
                </p>
                <span className="text-sm text-muted-foreground">
                  {metCount}/{conditions.length}
                </span>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="space-y-2">
                {conditions.map((condition) => (
                  <div 
                    key={condition.id} 
                    className="flex items-start gap-2 text-sm"
                  >
                    {condition.isMet ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className={condition.isMet ? 'text-muted-foreground' : 'text-foreground'}>
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

          {/* Voting summary for go_no_go */}
          {currentStatus === 'go_no_go' && hypothesis.committeeVotes && (
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
                  Финальное решение: <Badge variant="outline">{hypothesis.decision.result === 'go' ? 'Go' : hypothesis.decision.result === 'no_go' ? 'No-Go' : 'Iterate'}</Badge>
                </p>
              )}
            </div>
          )}

          {/* Blocking message */}
          {!allConditionsMet && conditions.length > 0 && (
            <>
              <Separator />
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Блокирующие условия</AlertTitle>
                <AlertDescription>
                  {currentStatus === 'backlog' && 'Переход недоступен, пока не заполнены все обязательные поля'}
                  {currentStatus === 'scoring' && 'Чтобы перейти в Deep Dive, увеличьте итоговый балл до порога или измените параметры в админке (роль Admin)'}
                  {currentStatus === 'deep_dive' && (
                    <>
                      Не заполнены обязательные пункты: {conditions.filter(c => !c.isMet).map(c => `«${c.label}»`).join(', ')}
                    </>
                  )}
                  {currentStatus === 'experiment' && 'Не выполнены все условия для перехода к питчу'}
                  {currentStatus === 'analysis' && 'Голосование не завершено или не достигнут кворум'}
                  {currentStatus === 'go_no_go' && 'Необходимо зафиксировать решение и определить следующий шаг'}
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Сохранить
            </Button>
            
            {/* Previous status button */}
            {statusConfig.prev && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleTransitionClick(statusConfig.prev!)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Вернуть в «{STATUS_FLOW[statusConfig.prev].label}»
              </Button>
            )}
            
            {/* Status-specific actions */}
            {currentStatus === 'scoring' && (
              <Button variant="outline" size="sm" onClick={() => onTabChange?.('scoring')}>
                Пересчитать
              </Button>
            )}
            
            {currentStatus === 'deep_dive' && (
              <Button variant="outline" size="sm" onClick={() => onTabChange?.('deep-dive')}>
                Проверить чек-лист
              </Button>
            )}
            
            {currentStatus === 'experiment' && (
              <>
                <Button variant="outline" size="sm" onClick={() => onTabChange?.('passport')}>
                  Сформировать паспорт
                </Button>
              </>
            )}
            
            {currentStatus === 'analysis' && (
              <>
                <Button variant="outline" size="sm" onClick={() => onTabChange?.('committee')}>
                  Открыть голосование
                </Button>
                <Button variant="outline" size="sm">
                  Напомнить участникам
                </Button>
              </>
            )}
            
            {/* Next status button */}
            {statusConfig.next && (
              <Button 
                size="sm"
                disabled={!allConditionsMet}
                onClick={() => handleTransitionClick(statusConfig.next!)}
              >
                {currentStatus === 'backlog' && 'Отправить в первичный скоринг'}
                {currentStatus === 'scoring' && 'Перевести в Deep Dive'}
                {currentStatus === 'deep_dive' && 'Перевести в «Эксперимент»'}
                {currentStatus === 'experiment' && 'Вынести на продуктовый комитет'}
                {currentStatus === 'analysis' && 'Зафиксировать «Решение принято»'}
                {currentStatus === 'go_no_go' && 'Выполнить переход'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transition confirmation dialog */}
      <Dialog open={isTransitionDialogOpen} onOpenChange={setIsTransitionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Подтверждение перехода</DialogTitle>
            <DialogDescription>
              {targetStatus && (
                <span className="flex items-center gap-2 mt-2">
                  <StatusBadge status={currentStatus} />
                  <ArrowRight className="h-4 w-4" />
                  <StatusBadge status={targetStatus} />
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* Special content for go_no_go decision */}
          {currentStatus === 'go_no_go' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Финальное решение</Label>
                <RadioGroup value={decisionResult} onValueChange={(v) => setDecisionResult(v as 'go' | 'no_go' | 'iterate')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="go" id="go" />
                    <Label htmlFor="go">Go - запуск в реализацию</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no_go" id="no_go" />
                    <Label htmlFor="no_go">No-Go - закрыть гипотезу</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="iterate" id="iterate" />
                    <Label htmlFor="iterate">Iterate - доработать и повторить</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="decision-comment">Комментарий комитета</Label>
                <Textarea 
                  id="decision-comment"
                  placeholder="Укажите причины решения..."
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                />
              </div>
              
              {decisionResult === 'iterate' && (
                <div className="space-y-2">
                  <Label>Следующий шаг</Label>
                  <RadioGroup value={nextStep} onValueChange={(v) => setNextStep(v as 'deep_dive' | 'done')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="deep_dive" id="back_deep_dive" />
                      <Label htmlFor="back_deep_dive">Вернуть в Deep Dive</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="done" id="to_archive" />
                      <Label htmlFor="to_archive">Перевести в Архив</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransitionDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleConfirmTransition} 
              disabled={isLoading || (currentStatus === 'go_no_go' && !decisionResult)}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
