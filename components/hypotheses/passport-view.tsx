"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Download, 
  FileSpreadsheet,
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Calendar,
  User,
  Building2,
  Target,
  TrendingUp,
  Beaker,
  Shield,
  BookOpen,
  Lightbulb,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle,
  MinusCircle
} from "lucide-react"
import type { Hypothesis, Experiment, HypothesisRisk, HypothesisResource, HypothesisRecommendation } from "@/lib/types"
import { getUserById, getTeamById, getActiveDeepDiveStages, mockScoringCriteria } from "@/lib/mock-data"
import { StatusBadge } from "./status-badge"

interface PassportViewProps {
  hypothesis: Hypothesis
  experiments?: Experiment[]
  readOnly?: boolean
}

export function PassportView({ hypothesis, experiments = [], readOnly = false }: PassportViewProps) {
  const owner = getUserById(hypothesis.ownerId)
  const team = getTeamById(hypothesis.teamId)
  const deepDiveStages = getActiveDeepDiveStages()

  // Calculate deep dive progress
  const getDeepDiveProgress = () => {
    if (!hypothesis.deepDive?.stages) return { completed: 0, total: deepDiveStages.length, percent: 0 }
    const completed = hypothesis.deepDive.stages.filter(s => s.isCompleted).length
    const total = deepDiveStages.length
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const deepDiveProgress = getDeepDiveProgress()

  // Calculate experiment stats
  const getExperimentStats = () => {
    const total = experiments.length
    const completed = experiments.filter(e => e.status === 'completed').length
    const successful = experiments.filter(e => e.result === 'success').length
    const running = experiments.filter(e => e.status === 'running').length
    return { total, completed, successful, running }
  }

  const expStats = getExperimentStats()

  // Get scoring data
  const getScoringData = () => {
    if (!hypothesis.scoring) return null
    
    const criteriaData = mockScoringCriteria
      .filter(c => c.isActive)
      .map(criterion => {
        const score = hypothesis.scoring?.criteriaScores[criterion.id]
        return {
          name: criterion.name,
          score: score ?? '-',
          maxScore: criterion.maxValue,
          isStopFactor: criterion.isStopFactor
        }
      })
    
    return {
      totalScore: hypothesis.scoring.totalScore,
      stopFactorTriggered: hypothesis.scoring.stopFactorTriggered,
      criteria: criteriaData
    }
  }

  const scoringData = getScoringData()

  const getDecisionBadge = () => {
    if (!hypothesis.decision) return null
    
    switch (hypothesis.decision.result) {
      case "go":
        return (
          <Badge className="bg-[#DCFCE7] text-[#16A34A] gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Go
          </Badge>
        )
      case "no_go":
        return (
          <Badge className="bg-[#FEE2E2] text-[#DC2626] gap-1">
            <XCircle className="h-3 w-3" />
            No-Go
          </Badge>
        )
      case "pivot":
        return (
          <Badge className="bg-[#FEF3C7] text-[#D97706] gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pivot
          </Badge>
        )
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getSeverityBadge = (severity: number) => {
    const configs: Record<number, { label: string; className: string }> = {
      1: { label: 'Низкий', className: 'bg-slate-100 text-slate-700' },
      2: { label: 'Умеренный', className: 'bg-blue-100 text-blue-700' },
      3: { label: 'Средний', className: 'bg-yellow-100 text-yellow-700' },
      4: { label: 'Высокий', className: 'bg-orange-100 text-orange-700' },
      5: { label: 'Критический', className: 'bg-red-100 text-red-700' },
    }
    const config = configs[severity] || configs[1]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getExperimentResultIcon = (result?: string) => {
    switch (result) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'inconclusive':
        return <MinusCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const handleExportPDF = () => {
    // Mock PDF export
    console.log("[v0] Exporting passport as PDF")
    alert("Экспорт в PDF будет доступен в следующей версии")
  }

  const handleExportExcel = () => {
    // Mock Excel export
    console.log("[v0] Exporting passport as Excel")
    alert("Экспорт в Excel будет доступен в следующей версии")
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Автоматически сгенерированный документ на основе данных карточки
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Экспорт Excel
          </Button>
        </div>
      </div>

      {/* Passport Document */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-8 text-primary-foreground">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-primary-foreground/70">Паспорт гипотезы</p>
              <h1 className="mt-2 text-2xl font-bold">{hypothesis.title}</h1>
              <p className="mt-1 font-mono text-sm text-primary-foreground/70">{hypothesis.code}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={hypothesis.status} />
              {getDecisionBadge()}
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-8">
          {/* Meta Info */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Команда</p>
                <p className="text-sm font-medium">{team?.name || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Ответственный</p>
                <p className="text-sm font-medium">{owner?.name || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Создано</p>
                <p className="text-sm font-medium">{formatDate(hypothesis.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">ICE Score</p>
                <p className="text-sm font-medium font-mono">{hypothesis.scoring?.totalScore || "-"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 1: Описание гипотезы */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
              <FileText className="h-5 w-5 text-primary" />
              Описание гипотезы
            </h3>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm leading-relaxed">{hypothesis.description}</p>
            </div>
          </div>

          <Separator />

          {/* Section 2: Рынок и потенциал (from scoring) */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              Рынок и потенциал
            </h3>
            {scoringData ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* TAM/SOM if available */}
                {scoringData.criteria.filter(c => c.name.toLowerCase().includes('tam') || c.name.toLowerCase().includes('som')).map((criterion, idx) => (
                  <div key={idx} className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground uppercase">{criterion.name}</p>
                    <p className="text-2xl font-bold font-mono mt-1">
                      {typeof criterion.score === 'number' ? criterion.score.toLocaleString('ru-RU') : criterion.score}
                    </p>
                  </div>
                ))}
                {/* Market potential */}
                {scoringData.criteria.filter(c => c.name.toLowerCase().includes('рыночный') || c.name.toLowerCase().includes('market')).map((criterion, idx) => (
                  <div key={idx} className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground uppercase">{criterion.name}</p>
                    <p className="text-2xl font-bold font-mono mt-1">{criterion.score}/5</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Данные скоринга не заполнены</p>
            )}
          </div>

          <Separator />

          {/* Section 3: Скоринг */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
              <Target className="h-5 w-5 text-primary" />
              Скоринг
            </h3>
            {scoringData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Итоговый балл</p>
                    <p className="text-3xl font-bold text-primary">{scoringData.totalScore}</p>
                  </div>
                  {scoringData.stopFactorTriggered && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Стоп-фактор активирован
                    </Badge>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {scoringData.criteria.filter(c => !c.isStopFactor).map((criterion, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded border px-3 py-2">
                      <span className="text-sm">{criterion.name}</span>
                      <span className="font-mono text-sm font-medium">{criterion.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Скоринг не выполнен</p>
            )}
          </div>

          <Separator />

          {/* Section 4: Deep Dive итоги */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
              <Beaker className="h-5 w-5 text-primary" />
              Deep Dive итоги
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Прогресс</span>
                    <span className="text-sm text-muted-foreground">
                      Выполнено {deepDiveProgress.completed}/{deepDiveProgress.total} пунктов
                    </span>
                  </div>
                  <Progress value={deepDiveProgress.percent} className="h-2" />
                </div>
                <span className="text-2xl font-bold text-primary">{deepDiveProgress.percent}%</span>
              </div>
              
              {hypothesis.deepDive?.stages && hypothesis.deepDive.stages.length > 0 && (
                <div className="grid gap-2">
                  {deepDiveStages.map((stage) => {
                    const stageData = hypothesis.deepDive?.stages?.find(s => s.stageId === stage.id)
                    const isCompleted = stageData?.isCompleted || false
                    return (
                      <div 
                        key={stage.id} 
                        className={`flex items-center gap-3 rounded border px-3 py-2 ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${isCompleted ? 'text-green-700' : 'text-muted-foreground'}`}>
                          {stage.name}
                        </span>
                        {stage.isRequired && (
                          <Badge variant="outline" className="text-xs ml-auto">Обязательный</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Section 5: Эксперименты */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
              <Beaker className="h-5 w-5 text-primary" />
              Эксперименты
            </h3>
            {experiments.length > 0 ? (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{expStats.total}</p>
                    <p className="text-xs text-muted-foreground">Всего</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{expStats.running}</p>
                    <p className="text-xs text-muted-foreground">В процессе</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{expStats.successful}</p>
                    <p className="text-xs text-muted-foreground">Успешных</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{expStats.completed}</p>
                    <p className="text-xs text-muted-foreground">Завершено</p>
                  </div>
                </div>

                {/* Experiment list */}
                <div className="space-y-3">
                  {experiments.map((exp) => (
                    <div key={exp.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getExperimentResultIcon(exp.result)}
                          <div>
                            <p className="font-medium text-sm">{exp.title}</p>
                            <p className="text-xs text-muted-foreground">{exp.type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{exp.status}</Badge>
                      </div>
                      
                      {/* Metrics summary */}
                      {exp.metrics && exp.metrics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {exp.metrics.map((metric) => (
                            <div 
                              key={metric.id} 
                              className={`text-xs px-2 py-1 rounded ${
                                metric.result === 'success' ? 'bg-green-100 text-green-700' :
                                metric.result === 'failure' ? 'bg-red-100 text-red-700' :
                                metric.result === 'inconclusive' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              {metric.name}: {metric.actualValue || metric.targetValue}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* What worked / didn't work */}
                      {(exp.whatWorked || exp.whatDidNotWork) && (
                        <div className="mt-3 space-y-2">
                          {exp.whatWorked && (
                            <div className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">{exp.whatWorked}</p>
                            </div>
                          )}
                          {exp.whatDidNotWork && (
                            <div className="flex items-start gap-2">
                              <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">{exp.whatDidNotWork}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Эксперименты не проводились</p>
            )}
          </div>

          <Separator />

          {/* Section 6: Риски */}
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
              <Shield className="h-5 w-5 text-primary" />
              Риски
            </h3>
            {hypothesis.risks && hypothesis.risks.length > 0 ? (
              <div className="space-y-2">
                {hypothesis.risks.map((risk) => (
                  <div 
                    key={risk.id} 
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      risk.severity >= 4 ? 'border-red-200 bg-red-50' : 
                      risk.severity >= 3 ? 'border-yellow-200 bg-yellow-50' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{risk.title}</span>
                        {getSeverityBadge(risk.severity)}
                      </div>
                      <p className="text-xs text-muted-foreground">{risk.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Риски не определены</p>
            )}
          </div>

          <Separator />

          {/* Section 7: Ресурсы и рекомендации */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resources */}
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
                <BookOpen className="h-5 w-5 text-primary" />
                Ресурсы
              </h3>
              {hypothesis.resources && hypothesis.resources.length > 0 ? (
                <div className="space-y-2">
                  {hypothesis.resources.map((resource) => (
                    <div key={resource.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{resource.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{resource.description}</p>
                        </div>
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ресурсы не добавлены</p>
              )}
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold mb-3">
                <Lightbulb className="h-5 w-5 text-primary" />
                Рекомендации
              </h3>
              {hypothesis.recommendations && hypothesis.recommendations.length > 0 ? (
                <div className="space-y-2">
                  {hypothesis.recommendations.map((rec) => (
                    <div key={rec.id} className="rounded-lg border p-3">
                      <p className="font-medium text-sm">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Рекомендации не добавлены</p>
              )}
            </div>
          </div>

          {/* Decision (if made) */}
          {hypothesis.decision && (
            <>
              <Separator />
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold">Решение Продуктового Комитета</h3>
                  {getDecisionBadge()}
                </div>
                {hypothesis.decision.comment && (
                  <p className="text-sm text-muted-foreground">{hypothesis.decision.comment}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Решение принято {formatDate(hypothesis.decision.decidedAt)}
                  {hypothesis.decision.decidedBy && (
                    <> — {getUserById(hypothesis.decision.decidedBy)?.name}</>
                  )}
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <Separator />
          <div className="text-xs text-muted-foreground text-center">
            Паспорт сгенерирован {formatDate(new Date().toISOString())}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
