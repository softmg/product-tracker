"use client"

import { useState } from "react"
import { Pencil, Save, X, Calculator } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockScoringCriteria, mockScoringThresholds } from "@/lib/mock-data"
import { toast } from "sonner"

// Primary scoring criteria
const primaryCriteria = [
  { id: 'crit-tam', name: 'TAM (Total Addressable Market)', weight: 0.15, maxScore: 5 },
  { id: 'crit-som', name: 'SOM (Serviceable Obtainable Market)', weight: 0.15, maxScore: 5 },
  { id: 'crit-market-potential', name: 'Рыночный потенциал', weight: 0.20, maxScore: 5 },
  { id: 'crit-competency-fit', name: 'Соответствие компетенциям SMG', weight: 0.15, maxScore: 5 },
  { id: 'crit-resource-cost', name: 'Ресурсоёмкость проверки', weight: 0.15, maxScore: 5 },
  { id: 'crit-strategic-fit', name: 'Стратегический fit', weight: 0.20, maxScore: 5 },
]

// Deep scoring criteria
const deepCriteria = [
  { id: 'crit-unit-economics', name: 'Юнит-экономика', weight: 0.30, maxScore: 5 },
  { id: 'crit-technical-feasibility', name: 'Техническая реализуемость', weight: 0.35, maxScore: 5 },
  { id: 'crit-mvp-resources', name: 'Оценка ресурсов на MVP', weight: 0.35, maxScore: 5 },
]

export default function AdminScoringThresholdsPage() {
  const [primaryThreshold, setPrimaryThreshold] = useState(mockScoringThresholds.primaryThreshold)
  const [deepThreshold, setDeepThreshold] = useState(mockScoringThresholds.deepThreshold)
  const [primaryCriteriaState, setPrimaryCriteriaState] = useState(primaryCriteria)
  const [deepCriteriaState, setDeepCriteriaState] = useState(deepCriteria)
  const [editingCriterion, setEditingCriterion] = useState<string | null>(null)
  const [editingWeight, setEditingWeight] = useState<number>(0)

  const startEditWeight = (criterionId: string, currentWeight: number) => {
    setEditingCriterion(criterionId)
    setEditingWeight(currentWeight)
  }

  const saveWeight = (criterionId: string, isPrimary: boolean) => {
    if (isPrimary) {
      setPrimaryCriteriaState(prev => prev.map(c => 
        c.id === criterionId ? { ...c, weight: editingWeight } : c
      ))
    } else {
      setDeepCriteriaState(prev => prev.map(c => 
        c.id === criterionId ? { ...c, weight: editingWeight } : c
      ))
    }
    setEditingCriterion(null)
    toast.success("Вес критерия обновлён")
  }

  const handleSaveAll = () => {
    toast.success("Настройки порогов сохранены")
  }

  const primaryTotalWeight = primaryCriteriaState.reduce((sum, c) => sum + c.weight, 0)
  const deepTotalWeight = deepCriteriaState.reduce((sum, c) => sum + c.weight, 0)

  return (
    <>
      <Header breadcrumbs={[{ title: "Admin" }, { title: "Пороги скоринга" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Пороги скоринга</h1>
              <p className="text-sm text-muted-foreground">
                Настройка порогов и весов критериев для первичного и глубокого скоринга
              </p>
            </div>
            <Button onClick={handleSaveAll}>Сохранить настройки</Button>
          </div>

          {/* Primary Scoring Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Первичный скоринг</CardTitle>
              </div>
              <CardDescription>
                Минимальный балл для перехода в Deep Dive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="primary-threshold" className="w-32">Порог (threshold_primary)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-threshold"
                    type="number"
                    value={primaryThreshold}
                    onChange={(e) => setPrimaryThreshold(parseFloat(e.target.value) || 0)}
                    step={0.5}
                    min={0}
                    max={10}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">/ 10</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Критерии первичного скоринга</h4>
                  <span className={`text-sm ${Math.abs(primaryTotalWeight - 1) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
                    Сумма весов: {primaryTotalWeight.toFixed(2)}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead className="w-24">Вес</TableHead>
                      <TableHead className="w-24">Макс. балл</TableHead>
                      <TableHead className="w-32">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {primaryCriteriaState.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell>{criterion.name}</TableCell>
                        <TableCell>
                          {editingCriterion === criterion.id ? (
                            <Input
                              type="number"
                              value={editingWeight}
                              onChange={(e) => setEditingWeight(parseFloat(e.target.value) || 0)}
                              step={0.05}
                              min={0}
                              max={1}
                              className="w-20 h-8"
                            />
                          ) : (
                            <span className="font-mono">{criterion.weight.toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{criterion.maxScore}</span>
                        </TableCell>
                        <TableCell>
                          {editingCriterion === criterion.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600"
                                onClick={() => saveWeight(criterion.id, true)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingCriterion(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditWeight(criterion.id, criterion.weight)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Изменить вес
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Deep Scoring Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Глубокий скоринг</CardTitle>
              </div>
              <CardDescription>
                Минимальный балл для перехода в Эксперимент
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="deep-threshold" className="w-32">Порог (threshold_deep)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="deep-threshold"
                    type="number"
                    value={deepThreshold}
                    onChange={(e) => setDeepThreshold(parseFloat(e.target.value) || 0)}
                    step={0.5}
                    min={0}
                    max={10}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">/ 10</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Критерии глубокого скоринга</h4>
                  <span className={`text-sm ${Math.abs(deepTotalWeight - 1) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
                    Сумма весов: {deepTotalWeight.toFixed(2)}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead className="w-24">Вес</TableHead>
                      <TableHead className="w-24">Макс. балл</TableHead>
                      <TableHead className="w-32">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deepCriteriaState.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {criterion.name}
                            {criterion.id === 'crit-unit-economics' && (
                              <span className="text-xs text-muted-foreground">(вес 1.5)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingCriterion === criterion.id ? (
                            <Input
                              type="number"
                              value={editingWeight}
                              onChange={(e) => setEditingWeight(parseFloat(e.target.value) || 0)}
                              step={0.05}
                              min={0}
                              max={1}
                              className="w-20 h-8"
                            />
                          ) : (
                            <span className="font-mono">{criterion.weight.toFixed(2)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{criterion.maxScore}</span>
                        </TableCell>
                        <TableCell>
                          {editingCriterion === criterion.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600"
                                onClick={() => saveWeight(criterion.id, false)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingCriterion(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditWeight(criterion.id, criterion.weight)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Изменить вес
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-dashed">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground text-center">
                Пороги — живые значения: при изменении порога все активные гипотезы мгновенно пересчитывают доступность кнопки перехода в статусе.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
