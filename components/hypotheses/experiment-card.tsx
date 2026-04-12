"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Experiment, ExperimentMetric, ExperimentStatus, ExperimentType } from "@/lib/types"
import { cn } from "@/lib/utils"

const experimentTypeLabels: Record<ExperimentType, string> = {
  a_b_test: "A/B тест",
  survey: "Опрос",
  interview: "Интервью",
  prototype: "Прототип",
  mvp: "MVP",
  other: "Другое",
}

const experimentStatusLabels: Record<ExperimentStatus, string> = {
  planned: "Запланирован",
  running: "Выполняется",
  completed: "Завершён",
  cancelled: "Отменён",
}

interface ExperimentCardProps {
  experiment: Experiment
  onEdit?: () => void
  onDelete?: () => void
}

export function ExperimentCard({ experiment, onEdit, onDelete }: ExperimentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-[#DBEAFE] text-[#2563EB]"
      case "completed": return "bg-[#DCFCE7] text-[#16A34A]"
      case "planned": return "bg-[#F3F4F6] text-[#6B7280]"
      case "cancelled": return "bg-[#FEE2E2] text-[#DC2626]"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getResultIcon = (result?: string) => {
    switch (result) {
      case "success": return <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
      case "failure": return <XCircle className="h-4 w-4 text-[#EF4444]" />
      case "inconclusive": return <HelpCircle className="h-4 w-4 text-[#F59E0B]" />
      default: return null
    }
  }

  const getMetricResultColor = (result?: string) => {
    switch (result) {
      case "success": return "text-[#22C55E] bg-[#DCFCE7]"
      case "failure": return "text-[#EF4444] bg-[#FEE2E2]"
      case "inconclusive": return "text-[#F59E0B] bg-[#FEF3C7]"
      default: return "text-muted-foreground bg-muted"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "a_b_test": return "A/B"
      case "survey": return "SV"
      case "interview": return "IN"
      case "prototype": return "PT"
      case "mvp": return "MVP"
      default: return "OT"
    }
  }

  const getLinkTypeLabel = (type: string) => {
    switch (type) {
      case "landing": return "Лендинг"
      case "form": return "Форма"
      case "campaign": return "Кампания"
      default: return "Ссылка"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      month: "short",
      day: "numeric",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getDaysProgress = () => {
    const start = new Date(experiment.startDate).getTime()
    const end = new Date(experiment.endDate).getTime()
    const now = Date.now()
    
    if (now < start) return 0
    if (now > end) return 100
    
    return Math.round(((now - start) / (end - start)) * 100)
  }

  // Use new metrics array or fallback to legacy fields
  const metrics: ExperimentMetric[] = experiment.metrics?.length 
    ? experiment.metrics 
    : experiment.metric 
      ? [{ 
          id: 'legacy', 
          name: experiment.metric, 
          targetValue: experiment.targetValue || '', 
          actualValue: experiment.actualValue,
          result: experiment.result 
        }]
      : []

  const completedMetrics = metrics.filter(m => m.result === 'success').length
  const totalMetrics = metrics.length

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {getTypeIcon(experiment.type)}
              </div>
              <div>
                <CardTitle className="text-base">{experiment.title}</CardTitle>
                <CardDescription className="mt-1">
                  {experimentTypeLabels[experiment.type]}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("font-normal", getStatusColor(experiment.status))}>
                {experimentStatusLabels[experiment.status]}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>Редактировать</DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {experiment.description}
          </p>

          {/* Metrics Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Метрики ({metrics.length})
              </div>
              {experiment.status === 'completed' && totalMetrics > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedMetrics}/{totalMetrics} достигнуто
                </span>
              )}
            </div>
            
            {/* Show first 2-3 metrics in collapsed view */}
            <div className="space-y-2">
              {metrics.slice(0, 2).map((metric) => (
                <div 
                  key={metric.id} 
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {metric.result && getResultIcon(metric.result)}
                    <span className="text-sm">{metric.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {metric.actualValue || metric.targetValue}
                    </span>
                    {metric.actualValue && metric.targetValue && (
                      <span className="text-xs text-muted-foreground">
                        / {metric.targetValue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {metrics.length > 2 && !isExpanded && (
                <p className="text-xs text-muted-foreground text-center">
                  +{metrics.length - 2} ещё метрик
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(experiment.startDate)} - {formatDate(experiment.endDate)}
              </div>
              {experiment.status === "running" && (
                <span className="text-muted-foreground">{getDaysProgress()}% прошло</span>
              )}
            </div>
            {experiment.status === "running" && (
              <Progress value={getDaysProgress()} className="h-1.5" />
            )}
          </div>

          {/* Expand/Collapse Button */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Подробнее
                </>
              )}
            </Button>
          </CollapsibleTrigger>

          {/* Expanded Content */}
          <CollapsibleContent className="space-y-4">
            {/* All Metrics */}
            {metrics.length > 2 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Все метрики</h4>
                <div className="space-y-2">
                  {metrics.slice(2).map((metric) => (
                    <div 
                      key={metric.id} 
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {metric.result && getResultIcon(metric.result)}
                        <span className="text-sm">{metric.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {metric.actualValue || metric.targetValue}
                        </span>
                        {metric.actualValue && metric.targetValue && (
                          <span className="text-xs text-muted-foreground">
                            / {metric.targetValue}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results (What Worked / What Didn't) */}
            {(experiment.whatWorked || experiment.whatDidNotWork) && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Результаты</h4>
                {experiment.whatWorked && (
                  <div className="rounded-lg bg-[#DCFCE7]/50 p-3">
                    <div className="flex items-center gap-2 text-[#16A34A] mb-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm font-medium">Что сработало</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{experiment.whatWorked}</p>
                  </div>
                )}
                {experiment.whatDidNotWork && (
                  <div className="rounded-lg bg-[#FEE2E2]/50 p-3">
                    <div className="flex items-center gap-2 text-[#DC2626] mb-1">
                      <ThumbsDown className="h-4 w-4" />
                      <span className="text-sm font-medium">Что не сработало</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{experiment.whatDidNotWork}</p>
                  </div>
                )}
              </div>
            )}

            {/* Links */}
            {experiment.links && experiment.links.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Ссылки
                </h4>
                <div className="flex flex-wrap gap-2">
                  {experiment.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-sm hover:bg-muted/80 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{link.title}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {getLinkTypeLabel(link.type)}
                      </Badge>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {experiment.files && experiment.files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Файлы
                </h4>
                <div className="space-y-1">
                  {experiment.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {experiment.notes && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">{experiment.notes}</p>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}
