"use client"

import { useState } from "react"
import { Plus, FlaskConical, Trash2, Link as LinkIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ExperimentCard } from "./experiment-card"
import { useAuth } from "@/lib/auth-context"
import type { Experiment, ExperimentMetric, ExperimentLink } from "@/lib/types"
import { experimentTypeLabels } from "@/lib/mock-data"

interface ExperimentsListProps {
  experiments: Experiment[]
  hypothesisId: string
}

interface MetricInput {
  id: string
  name: string
  targetValue: string
  unit: string
}

interface LinkInput {
  id: string
  type: 'landing' | 'form' | 'campaign' | 'other'
  title: string
  url: string
}

export function ExperimentsList({ experiments, hypothesisId }: ExperimentsListProps) {
  const { hasPermission } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form state for new experiment
  const [metrics, setMetrics] = useState<MetricInput[]>([
    { id: crypto.randomUUID(), name: '', targetValue: '', unit: '' }
  ])
  const [links, setLinks] = useState<LinkInput[]>([])

  const runningExperiments = experiments.filter(e => e.status === "running")
  const completedExperiments = experiments.filter(e => e.status === "completed")
  const plannedExperiments = experiments.filter(e => e.status === "planned")

  const addMetric = () => {
    setMetrics([...metrics, { id: crypto.randomUUID(), name: '', targetValue: '', unit: '' }])
  }

  const removeMetric = (id: string) => {
    if (metrics.length > 1) {
      setMetrics(metrics.filter(m => m.id !== id))
    }
  }

  const updateMetric = (id: string, field: keyof MetricInput, value: string) => {
    setMetrics(metrics.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const addLink = () => {
    setLinks([...links, { id: crypto.randomUUID(), type: 'landing', title: '', url: '' }])
  }

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id))
  }

  const updateLink = (id: string, field: keyof LinkInput, value: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  const resetForm = () => {
    setMetrics([{ id: crypto.randomUUID(), name: '', targetValue: '', unit: '' }])
    setLinks([])
  }

  const handleClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Активные</CardDescription>
            <CardTitle className="text-3xl">{runningExperiments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Завершённые</CardDescription>
            <CardTitle className="text-3xl">{completedExperiments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Запланированные</CardDescription>
            <CardTitle className="text-3xl">{plannedExperiments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Add Experiment Button */}
      {hasPermission("experiment:create") && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) handleClose()
          else setIsDialogOpen(true)
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить эксперимент
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Создать эксперимент</DialogTitle>
              <DialogDescription>
                Добавьте эксперимент для валидации гипотезы
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название</Label>
                  <Input id="title" placeholder="Название эксперимента" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Тип</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(experimentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea id="description" placeholder="Что будем тестировать?" rows={3} />
                </div>
              </div>

              <Separator />

              {/* Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Метрики</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMetric}>
                    <Plus className="mr-1 h-3 w-3" />
                    Добавить
                  </Button>
                </div>
                <div className="space-y-3">
                  {metrics.map((metric, index) => (
                    <div key={metric.id} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input 
                          placeholder="Название метрики" 
                          value={metric.name}
                          onChange={(e) => updateMetric(metric.id, 'name', e.target.value)}
                        />
                        <Input 
                          placeholder="Целевое значение" 
                          value={metric.targetValue}
                          onChange={(e) => updateMetric(metric.id, 'targetValue', e.target.value)}
                        />
                        <Input 
                          placeholder="Единица (%, шт)" 
                          value={metric.unit}
                          onChange={(e) => updateMetric(metric.id, 'unit', e.target.value)}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeMetric(metric.id)}
                        disabled={metrics.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Добавьте метрики для отслеживания: конверсия, предзаказы, интервью, трафик, вовлечённость
                </p>
              </div>

              <Separator />

              {/* Links */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Ссылки</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLink}>
                    <LinkIcon className="mr-1 h-3 w-3" />
                    Добавить
                  </Button>
                </div>
                {links.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Добавьте ссылки на лендинг, форму или рекламную кампанию
                  </p>
                ) : (
                  <div className="space-y-3">
                    {links.map((link) => (
                      <div key={link.id} className="flex gap-2 items-start">
                        <Select 
                          value={link.type}
                          onValueChange={(value) => updateLink(link.id, 'type', value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="landing">Лендинг</SelectItem>
                            <SelectItem value="form">Форма</SelectItem>
                            <SelectItem value="campaign">Кампания</SelectItem>
                            <SelectItem value="other">Другое</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          placeholder="Название" 
                          className="w-[140px]"
                          value={link.title}
                          onChange={(e) => updateLink(link.id, 'title', e.target.value)}
                        />
                        <Input 
                          placeholder="URL" 
                          className="flex-1"
                          value={link.url}
                          onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeLink(link.id)}
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Дата начала</Label>
                  <Input id="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Дата окончания</Label>
                  <Input id="endDate" type="date" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Отмена
                </Button>
                <Button type="submit">Создать эксперимент</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Experiments List */}
      {experiments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FlaskConical className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Нет экспериментов</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
              Создайте эксперименты для валидации гипотезы реальными данными.
            </p>
            {hasPermission("experiment:create") && (
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Создать первый эксперимент
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Running */}
          {runningExperiments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Активные ({runningExperiments.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {runningExperiments.map((exp) => (
                  <ExperimentCard key={exp.id} experiment={exp} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedExperiments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Завершённые ({completedExperiments.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {completedExperiments.map((exp) => (
                  <ExperimentCard key={exp.id} experiment={exp} />
                ))}
              </div>
            </div>
          )}

          {/* Planned */}
          {plannedExperiments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Запланированные ({plannedExperiments.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {plannedExperiments.map((exp) => (
                  <ExperimentCard key={exp.id} experiment={exp} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
