"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HypothesisScoring, ScoringCriterion } from "@/lib/types"

const scoringCriteriaConfig: ScoringCriterion[] = [
  {
    id: "crit-tam",
    name: "TAM",
    description: "Total Addressable Market - общий объём рынка",
    inputType: "number",
    minValue: 0,
    maxValue: 999_999_999,
    weight: 0.15,
    isActive: true,
    thresholds: [100_000, 500_000, 1_000_000, 5_000_000],
  },
  {
    id: "crit-som",
    name: "SOM",
    description: "Serviceable Obtainable Market - достижимая доля рынка",
    inputType: "number",
    minValue: 0,
    maxValue: 999_999_999,
    weight: 0.15,
    isActive: true,
    thresholds: [10_000, 50_000, 100_000, 500_000],
  },
  {
    id: "crit-market-potential",
    name: "Рыночный потенциал",
    description: "Общая оценка рыночного потенциала гипотезы",
    inputType: "slider",
    minValue: 1,
    maxValue: 5,
    weight: 0.2,
    isActive: true,
  },
  {
    id: "crit-competency-fit",
    name: "Соответствие компетенциям",
    description: "Насколько гипотеза соответствует текущим компетенциям команды",
    inputType: "slider",
    minValue: 1,
    maxValue: 5,
    weight: 0.15,
    isActive: true,
  },
  {
    id: "crit-resource-cost",
    name: "Ресурсоёмкость проверки",
    description: "Оценка затрат ресурсов на проверку гипотезы (5 = минимальная ресурсоёмкость)",
    inputType: "slider",
    minValue: 1,
    maxValue: 5,
    weight: 0.15,
    isActive: true,
  },
  {
    id: "crit-strategic-fit",
    name: "Стратегический fit",
    description: "Соответствие стратегическим целям компании",
    inputType: "slider",
    minValue: 1,
    maxValue: 5,
    weight: 0.2,
    isActive: true,
  },
  {
    id: "crit-stop-factor",
    name: "Стоп-факторы",
    description: "Наличие критических факторов, блокирующих гипотезу (если отмечено - итоговый балл = 0)",
    inputType: "checkbox",
    minValue: 0,
    maxValue: 1,
    weight: 0,
    isActive: true,
    isStopFactor: true,
  },
]

interface ScoringFormProps {
  initialScoring?: HypothesisScoring
  onSave?: (scoring: HypothesisScoring) => void
  readOnly?: boolean
}

// Normalize number value to 1-5 scale based on thresholds
function normalizeToScale(value: number, thresholds: number[]): number {
  if (value < thresholds[0]) return 1
  if (value < thresholds[1]) return 2
  if (value < thresholds[2]) return 3
  if (value < thresholds[3]) return 4
  return 5
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toString()
}

export function ScoringForm({ initialScoring, onSave, readOnly = false }: ScoringFormProps) {
  const criteria = scoringCriteriaConfig.filter(c => c.isActive)
  
  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (initialScoring?.criteriaScores) {
      return { ...initialScoring.criteriaScores }
    }
    // Initialize with defaults
    const defaults: Record<string, number> = {}
    criteria.forEach(c => {
      if (c.inputType === 'slider') {
        defaults[c.id] = 3 // middle value
      } else if (c.inputType === 'number') {
        defaults[c.id] = 0
      } else if (c.inputType === 'checkbox') {
        defaults[c.id] = 0
      }
    })
    return defaults
  })

  const [stopFactorChecked, setStopFactorChecked] = useState(
    initialScoring?.stopFactorTriggered || false
  )

  // Calculate total score
  const { totalScore, breakdown } = useMemo(() => {
    if (stopFactorChecked) {
      return { totalScore: 0, breakdown: [] }
    }

    let total = 0
    const breakdownItems: { name: string; rawValue: number; normalizedValue: number; weight: number; contribution: number }[] = []

    criteria.forEach(criterion => {
      if (criterion.isStopFactor) return
      
      const rawValue = scores[criterion.id] || 0
      let normalizedValue: number

      if (criterion.inputType === 'number' && criterion.thresholds) {
        normalizedValue = normalizeToScale(rawValue, criterion.thresholds)
      } else {
        normalizedValue = rawValue
      }

      const contribution = normalizedValue * criterion.weight
      total += contribution

      breakdownItems.push({
        name: criterion.name,
        rawValue,
        normalizedValue,
        weight: criterion.weight,
        contribution
      })
    })

    // Normalize to 0-100 scale (max possible is 5 * sum of weights)
    const maxPossible = criteria.filter(c => !c.isStopFactor).reduce((sum, c) => sum + (5 * c.weight), 0)
    const normalizedTotal = Math.round((total / maxPossible) * 100)

    return { totalScore: normalizedTotal, breakdown: breakdownItems }
  }, [scores, stopFactorChecked, criteria])

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-[#22C55E]"
    if (score >= 40) return "text-[#F59E0B]"
    return "text-[#EF4444]"
  }

  const getValueLabel = (value: number) => {
    if (value <= 1) return "Очень низко"
    if (value <= 2) return "Низко"
    if (value <= 3) return "Средне"
    if (value <= 4) return "Высоко"
    return "Очень высоко"
  }

  const handleSliderChange = (criterionId: string, value: number) => {
    setScores(prev => ({ ...prev, [criterionId]: value }))
  }

  const handleNumberChange = (criterionId: string, value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0
    setScores(prev => ({ ...prev, [criterionId]: num }))
  }

  const handleStopFactorChange = (checked: boolean) => {
    setStopFactorChecked(checked)
    const stopFactorCriterion = criteria.find(c => c.isStopFactor)
    if (stopFactorCriterion) {
      setScores(prev => ({ ...prev, [stopFactorCriterion.id]: checked ? 1 : 0 }))
    }
  }

  const handleSave = () => {
    onSave?.({
      criteriaScores: scores,
      stopFactorTriggered: stopFactorChecked,
      totalScore,
    })
  }

  const renderCriterionInput = (criterion: ScoringCriterion) => {
    if (criterion.isStopFactor) {
      return (
        <Card key={criterion.id} className={cn(
          "border-destructive/50",
          stopFactorChecked && "bg-destructive/10"
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={criterion.id}
                  checked={stopFactorChecked}
                  onCheckedChange={handleStopFactorChange}
                  disabled={readOnly}
                />
                <div>
                  <Label htmlFor={criterion.id} className="text-base font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    {criterion.name}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {criterion.description}
                  </p>
                </div>
              </div>
            </div>
            {stopFactorChecked && (
              <div className="mt-3 p-3 bg-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  Гипотеза дисквалифицирована. Итоговый балл = 0
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    if (criterion.inputType === 'number') {
      const value = scores[criterion.id] || 0
      const normalized = criterion.thresholds ? normalizeToScale(value, criterion.thresholds) : value
      
      return (
        <div key={criterion.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">{criterion.name}</Label>
              <p className="text-sm text-muted-foreground">
                {criterion.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {normalized}/5
              </Badge>
              <span className="text-xs text-muted-foreground">
                (вес: {criterion.weight})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={formatNumber(value)}
              onChange={(e) => handleNumberChange(criterion.id, e.target.value)}
              disabled={readOnly}
              className="w-40 font-mono"
              placeholder="0"
            />
            <span className="text-sm text-muted-foreground">
              → Нормализовано: {getValueLabel(normalized)}
            </span>
          </div>
          {criterion.thresholds && (
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5" />
              <span>
                Пороги: {criterion.thresholds.map((t, i) => `${formatNumber(t)}=${i+2}`).join(', ')}
              </span>
            </div>
          )}
        </div>
      )
    }

    // Slider input
    const value = scores[criterion.id] || 3
    return (
      <div key={criterion.id} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">{criterion.name}</Label>
            <p className="text-sm text-muted-foreground">
              {criterion.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{value}</Badge>
            <span className="text-sm text-muted-foreground">{getValueLabel(value)}</span>
            <span className="text-xs text-muted-foreground">
              (вес: {criterion.weight})
            </span>
          </div>
        </div>
        <Slider
          value={[value]}
          onValueChange={([v]) => handleSliderChange(criterion.id, v)}
          min={criterion.minValue}
          max={criterion.maxValue}
          step={1}
          disabled={readOnly}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{criterion.minValue} - Минимум</span>
          <span>{criterion.maxValue} - Максимум</span>
        </div>
      </div>
    )
  }

  // Group criteria by type
  const numberCriteria = criteria.filter(c => c.inputType === 'number')
  const sliderCriteria = criteria.filter(c => c.inputType === 'slider')
  const stopFactors = criteria.filter(c => c.isStopFactor)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Scoring Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Критерии оценки</CardTitle>
          <CardDescription>
            Оцените гипотезу по каждому критерию
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Number inputs (TAM, SOM) */}
          {numberCriteria.length > 0 && (
            <>
              <div className="space-y-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Рыночные показатели
                </h4>
                {numberCriteria.map(renderCriterionInput)}
              </div>
              <Separator />
            </>
          )}

          {/* Slider inputs */}
          {sliderCriteria.length > 0 && (
            <div className="space-y-6">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Качественные критерии
              </h4>
              {sliderCriteria.map(renderCriterionInput)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Summary */}
      <div className="space-y-6">
        {/* Stop Factors */}
        {stopFactors.length > 0 && (
          <div className="space-y-4">
            {stopFactors.map(renderCriterionInput)}
          </div>
        )}

        {/* Total Score */}
        <Card>
          <CardHeader>
            <CardTitle>Итоговый балл</CardTitle>
            <CardDescription>
              Σ (Оценка × Вес критерия)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <div className={cn(
                "text-6xl font-bold tabular-nums",
                stopFactorChecked ? "text-destructive" : getScoreColor(totalScore)
              )}>
                {totalScore}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                из 100 возможных
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#EF4444]" />
                <span className="text-xs text-muted-foreground">0-39</span>
                <div className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                <span className="text-xs text-muted-foreground">40-69</span>
                <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <span className="text-xs text-muted-foreground">70+</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Детализация оценки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({item.normalizedValue} × {item.weight})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all" 
                        style={{ width: `${(item.normalizedValue / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono w-12 text-right">
                      {item.contribution.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              {stopFactorChecked && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm text-destructive">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Стоп-фактор активен
                    </span>
                    <span className="font-mono">= 0</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!readOnly && (
          <Button onClick={handleSave} className="w-full">
            Сохранить оценку
          </Button>
        )}
      </div>
    </div>
  )
}
