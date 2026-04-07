"use client"

import { useState } from "react"
import { Plus, GripVertical, Pencil, Trash2, Save, X, CheckCircle2, Circle, Users } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { mockDeepDiveStages, roleLabels } from "@/lib/mock-data"
import type { DeepDiveStageConfig, UserRole } from "@/lib/types"

export default function AdminDeepDivePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [stages, setStages] = useState<DeepDiveStageConfig[]>(mockDeepDiveStages)
  const [editingStage, setEditingStage] = useState<DeepDiveStageConfig | null>(null)
  
  // Form state for new/edit dialog
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formIsRequired, setFormIsRequired] = useState(true)
  const [formResponsibleRole, setFormResponsibleRole] = useState<UserRole>("pd_manager")

  const toggleActive = (id: string) => {
    setStages(prev => prev.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ))
  }

  const toggleRequired = (id: string) => {
    setStages(prev => prev.map(s => 
      s.id === id ? { ...s, isRequired: !s.isRequired } : s
    ))
  }

  const openAddDialog = () => {
    setEditingStage(null)
    setFormName("")
    setFormDescription("")
    setFormIsRequired(true)
    setFormResponsibleRole("pd_manager")
    setIsDialogOpen(true)
  }

  const openEditDialog = (stage: DeepDiveStageConfig) => {
    setEditingStage(stage)
    setFormName(stage.name)
    setFormDescription(stage.description)
    setFormIsRequired(stage.isRequired)
    setFormResponsibleRole(stage.responsibleRole)
    setIsDialogOpen(true)
  }

  const handleSaveStage = () => {
    if (!formName.trim()) return

    if (editingStage) {
      // Update existing
      setStages(prev => prev.map(s => 
        s.id === editingStage.id 
          ? { 
              ...s, 
              name: formName, 
              description: formDescription, 
              isRequired: formIsRequired,
              responsibleRole: formResponsibleRole 
            } 
          : s
      ))
    } else {
      // Add new
      const newStage: DeepDiveStageConfig = {
        id: `stage-${Date.now()}`,
        name: formName,
        description: formDescription,
        order: stages.length + 1,
        isRequired: formIsRequired,
        responsibleRole: formResponsibleRole,
        isActive: true,
      }
      setStages(prev => [...prev, newStage])
    }
    
    setIsDialogOpen(false)
  }

  const handleDeleteStage = (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id))
  }

  const moveStage = (id: string, direction: 'up' | 'down') => {
    setStages(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const index = sorted.findIndex(s => s.id === id)
      if (direction === 'up' && index > 0) {
        const temp = sorted[index].order
        sorted[index].order = sorted[index - 1].order
        sorted[index - 1].order = temp
      } else if (direction === 'down' && index < sorted.length - 1) {
        const temp = sorted[index].order
        sorted[index].order = sorted[index + 1].order
        sorted[index + 1].order = temp
      }
      return sorted.sort((a, b) => a.order - b.order)
    })
  }

  const activeStages = stages.filter(s => s.isActive)
  const requiredStages = stages.filter(s => s.isActive && s.isRequired)

  const getRoleBadgeClassName = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-destructive text-white"
      case "pd_manager":
        return "bg-primary text-primary-foreground"
      case "initiator":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <>
      <Header breadcrumbs={[{ title: "Админка" }, { title: "Настройки Deep Dive" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Настройки Deep Dive</h1>
              <p className="text-sm text-muted-foreground">
                Управление подэтапами глубокого анализа гипотез
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить подэтап
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingStage ? 'Редактировать подэтап' : 'Добавить подэтап'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingStage 
                      ? 'Измените параметры подэтапа Deep Dive' 
                      : 'Создайте новый подэтап для глубокого анализа'
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название</Label>
                    <Input 
                      id="name" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="например, Интервью с клиентами" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea 
                      id="description" 
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Что нужно сделать на этом этапе?" 
                      rows={2} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Ответственная роль</Label>
                    <Select 
                      value={formResponsibleRole} 
                      onValueChange={(value) => setFormResponsibleRole(value as UserRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Администратор</SelectItem>
                        <SelectItem value="pd_manager">PD Manager</SelectItem>
                        <SelectItem value="initiator">Инициатор</SelectItem>
                        <SelectItem value="analyst">Аналитик</SelectItem>
                        <SelectItem value="tech_lead">Техлид</SelectItem>
                        <SelectItem value="bizdev">BizDev</SelectItem>
                        <SelectItem value="committee">Комитет</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Обязательный этап</Label>
                      <p className="text-xs text-muted-foreground">
                        Блокирует переход на следующую стадию
                      </p>
                    </div>
                    <Switch 
                      checked={formIsRequired}
                      onCheckedChange={setFormIsRequired}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleSaveStage} disabled={!formName.trim()}>
                    {editingStage ? 'Сохранить' : 'Добавить'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Условия перехода на стадию Эксперимент
              </CardTitle>
              <CardDescription>
                Для перехода должны быть выполнены все обязательные подэтапы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="text-muted-foreground">Всего активных подэтапов:</span>{" "}
                  <span className="font-mono font-medium">{activeStages.length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Обязательных:</span>{" "}
                  <span className="font-mono font-medium text-amber-600">{requiredStages.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stages List */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Подэтапы Deep Dive</h2>
            
            {stages.sort((a, b) => a.order - b.order).map((stage, index) => (
              <Card key={stage.id} className={!stage.isActive ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <div 
                        className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-lg border bg-muted"
                        title="Перетащите для изменения порядка"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex h-6 w-10 items-center justify-center text-xs text-muted-foreground">
                        #{stage.order}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{stage.name}</h3>
                            {stage.isRequired ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Обязательный
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Circle className="mr-1 h-3 w-3" />
                                Опциональный
                              </Badge>
                            )}
                            <Badge className={getRoleBadgeClassName(stage.responsibleRole)}>
                              <Users className="mr-1 h-3 w-3" />
                              {roleLabels[stage.responsibleRole]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${stage.id}`} className="text-sm text-muted-foreground">
                              Активен
                            </Label>
                            <Switch
                              id={`active-${stage.id}`}
                              checked={stage.isActive}
                              onCheckedChange={() => toggleActive(stage.id)}
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openEditDialog(stage)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteStage(stage.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`required-${stage.id}`}
                            checked={stage.isRequired}
                            onCheckedChange={() => toggleRequired(stage.id)}
                            disabled={!stage.isActive}
                          />
                          <Label 
                            htmlFor={`required-${stage.id}`} 
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            Обязательный для перехода
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Role Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Распределение по ролям</CardTitle>
              <CardDescription>
                Количество подэтапов, закреплённых за каждой ролью
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(['admin', 'pd_manager', 'initiator', 'analyst', 'tech_lead', 'bizdev', 'committee'] as UserRole[]).map((role) => {
                  const roleStages = activeStages.filter(s => s.responsibleRole === role)
                  const roleRequired = roleStages.filter(s => s.isRequired)
                  return (
                    <div key={role} className="flex items-center gap-4">
                      <span className="text-sm w-32">{roleLabels[role]}</span>
                      <div className="flex-1">
                        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all" 
                            style={{ width: activeStages.length > 0 ? `${(roleStages.length / activeStages.length) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-mono w-24 text-right">
                        {roleStages.length} ({roleRequired.length} обяз.)
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
