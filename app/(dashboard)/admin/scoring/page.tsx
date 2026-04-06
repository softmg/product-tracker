"use client"

import { useState } from "react"
import { Plus, GripVertical, Pencil, Trash2, Save, X, AlertTriangle, Calculator } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mockScoringCriteria } from "@/lib/mock-data"
import type { ScoringCriterion, ScoringInputType } from "@/lib/types"

export default function AdminScoringPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [criteria, setCriteria] = useState(mockScoringCriteria)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingWeight, setEditingWeight] = useState<number>(0)

  const toggleActive = (id: string) => {
    setCriteria(prev => prev.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ))
  }

  const startEditWeight = (criterion: ScoringCriterion) => {
    setEditingId(criterion.id)
    setEditingWeight(criterion.weight)
  }

  const saveWeight = (id: string) => {
    setCriteria(prev => prev.map(c => 
      c.id === id ? { ...c, weight: editingWeight } : c
    ))
    setEditingId(null)
  }

  const cancelEditWeight = () => {
    setEditingId(null)
  }

  // Calculate total weight
  const totalWeight = criteria
    .filter(c => c.isActive && !c.isStopFactor)
    .reduce((sum, c) => sum + c.weight, 0)

  const getInputTypeLabel = (type: ScoringInputType) => {
    switch (type) {
      case 'slider': return 'Слайдер (1-5)'
      case 'number': return 'Числовой ввод'
      case 'checkbox': return 'Чекбокс'
    }
  }

  const getInputTypeBadgeVariant = (type: ScoringInputType) => {
    switch (type) {
      case 'slider': return 'default'
      case 'number': return 'secondary'
      case 'checkbox': return 'destructive'
    }
  }

  return (
    <>
      <Header breadcrumbs={[{ title: "Админка" }, { title: "Настройки скоринга" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Настройки скоринга</h1>
              <p className="text-sm text-muted-foreground">
                Управление критериями и весами для оценки гипотез
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить критерий
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить критерий скоринга</DialogTitle>
                  <DialogDescription>
                    Создайте новый критерий для оценки гипотез
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название</Label>
                    <Input id="name" placeholder="например, Рыночный потенциал" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea id="description" placeholder="Что измеряет этот критерий?" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inputType">Тип ввода</Label>
                    <Select defaultValue="slider">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slider">Слайдер (1-5)</SelectItem>
                        <SelectItem value="number">Числовой ввод</SelectItem>
                        <SelectItem value="checkbox">Чекбокс (стоп-фактор)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Вес критерия</Label>
                      <Input id="weight" type="number" defaultValue={0.1} step={0.05} min={0} max={1} />
                    </div>
                    <div className="space-y-2">
                      <Label>Предпросмотр</Label>
                      <div className="h-10 flex items-center">
                        <span className="text-sm text-muted-foreground">0.1 = 10% от итога</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button type="submit">Добавить критерий</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Formula Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Формула расчёта
              </CardTitle>
              <CardDescription>
                Итоговый балл = Σ (Оценка критерия × Вес критерия), нормализованный к шкале 0-100
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Сумма весов активных критериев:</span>{" "}
                  <span className={`font-mono font-medium ${Math.abs(totalWeight - 1) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
                    {totalWeight.toFixed(2)}
                  </span>
                </div>
                {Math.abs(totalWeight - 1) >= 0.01 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Рекомендуется сумма весов = 1.0
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Criteria List */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Критерии оценки</h2>
            
            {criteria.map((criterion) => (
              <Card key={criterion.id} className={!criterion.isActive ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-lg border bg-muted">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{criterion.name}</h3>
                            {criterion.isStopFactor && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Стоп-фактор
                              </Badge>
                            )}
                            <Badge variant={getInputTypeBadgeVariant(criterion.inputType)}>
                              {getInputTypeLabel(criterion.inputType)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {criterion.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${criterion.id}`} className="text-sm text-muted-foreground">
                              Активен
                            </Label>
                            <Switch
                              id={`active-${criterion.id}`}
                              checked={criterion.isActive}
                              onCheckedChange={() => toggleActive(criterion.id)}
                            />
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-6 mt-4">
                        {criterion.inputType !== 'checkbox' && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Диапазон:</span>{" "}
                            <span className="font-mono">{criterion.minValue} - {criterion.maxValue}</span>
                          </div>
                        )}
                        
                        {/* Weight editing */}
                        <div className="text-sm">
                          <span className="text-muted-foreground">Вес:</span>{" "}
                          {editingId === criterion.id ? (
                            <span className="inline-flex items-center gap-2">
                              <Input
                                type="number"
                                value={editingWeight}
                                onChange={(e) => setEditingWeight(parseFloat(e.target.value) || 0)}
                                step={0.05}
                                min={0}
                                max={1}
                                className="w-20 h-7 font-mono"
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-green-600"
                                onClick={() => saveWeight(criterion.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={cancelEditWeight}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </span>
                          ) : (
                            <span 
                              className="font-mono cursor-pointer hover:text-primary"
                              onClick={() => startEditWeight(criterion)}
                            >
                              {criterion.weight}
                              {!criterion.isStopFactor && (
                                <span className="text-muted-foreground ml-1">
                                  ({(criterion.weight * 100).toFixed(0)}%)
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {criterion.thresholds && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Пороги нормализации:</span>{" "}
                            <span className="font-mono text-xs">
                              {criterion.thresholds.map((t, i) => 
                                `${t >= 1000000 ? `${t/1000000}M` : t >= 1000 ? `${t/1000}K` : t}=${i+2}`
                              ).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weights Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Распределение весов</CardTitle>
              <CardDescription>
                Визуализация влияния каждого критерия на итоговую оценку
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {criteria.filter(c => c.isActive && !c.isStopFactor).map((criterion) => (
                  <div key={criterion.id} className="flex items-center gap-4">
                    <span className="text-sm w-48 truncate">{criterion.name}</span>
                    <div className="flex-1">
                      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all" 
                          style={{ width: `${(criterion.weight / totalWeight) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-mono w-16 text-right">
                      {((criterion.weight / totalWeight) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
