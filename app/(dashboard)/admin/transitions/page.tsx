"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/hypotheses/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { mockStatusConfigs, mockStatusTransitions, roleLabels } from "@/lib/mock-data"
import type { HypothesisStatus, StatusTransition, UserRole, TransitionConditionType } from "@/lib/types"
import { toast } from "sonner"

const conditionLabels: Record<TransitionConditionType, string> = {
  required_fields: "Обязательные поля заполнены",
  scoring_threshold: "Скоринг выше порога",
  checklist_closed: "Чеклист закрыт",
  none: "Без условий",
}

export default function AdminTransitionsPage() {
  const [statuses, setStatuses] = useState(mockStatusConfigs)
  const [transitions, setTransitions] = useState(mockStatusTransitions)
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false)
  const [isAddTransitionOpen, setIsAddTransitionOpen] = useState(false)
  const [isEditTransitionOpen, setIsEditTransitionOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<typeof statuses[0] | null>(null)
  const [selectedTransition, setSelectedTransition] = useState<StatusTransition | null>(null)
  
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  
  const [transFromStatus, setTransFromStatus] = useState<HypothesisStatus | "">("")
  const [transToStatus, setTransToStatus] = useState<HypothesisStatus | "">("")
  const [transRoles, setTransRoles] = useState<UserRole[]>([])
  const [transCondition, setTransCondition] = useState<TransitionConditionType>("none")
  const [transConditionValue, setTransConditionValue] = useState("")

  const handleEditStatus = (status: typeof statuses[0]) => {
    setSelectedStatus(status)
    setEditName(status.name)
    setEditColor(status.color)
    setIsEditStatusOpen(true)
  }

  const handleSaveStatus = () => {
    if (!selectedStatus) return
    setStatuses(prev => prev.map(s => 
      s.id === selectedStatus.id 
        ? { ...s, name: editName, color: editColor }
        : s
    ))
    setIsEditStatusOpen(false)
    toast.success("Статус обновлён")
  }

  const handleAddTransition = () => {
    setTransFromStatus("")
    setTransToStatus("")
    setTransRoles([])
    setTransCondition("none")
    setTransConditionValue("")
    setIsAddTransitionOpen(true)
  }

  const handleEditTransition = (trans: StatusTransition) => {
    setSelectedTransition(trans)
    setTransFromStatus(trans.fromStatus)
    setTransToStatus(trans.toStatus)
    setTransRoles(trans.allowedRoles)
    setTransCondition(trans.conditionType)
    setTransConditionValue(trans.conditionValue || "")
    setIsEditTransitionOpen(true)
  }

  const handleSaveNewTransition = () => {
    if (!transFromStatus || !transToStatus || transRoles.length === 0) {
      toast.error("Заполните все обязательные поля")
      return
    }
    const newTransition: StatusTransition = {
      id: `trans-${Date.now()}`,
      fromStatus: transFromStatus as HypothesisStatus,
      toStatus: transToStatus as HypothesisStatus,
      allowedRoles: transRoles,
      conditionType: transCondition,
      conditionValue: transConditionValue || undefined,
      isActive: true,
    }
    setTransitions(prev => [...prev, newTransition])
    setIsAddTransitionOpen(false)
    toast.success("Переход добавлен")
  }

  const handleSaveEditTransition = () => {
    if (!selectedTransition || !transFromStatus || !transToStatus || transRoles.length === 0) {
      toast.error("Заполните все обязательные поля")
      return
    }
    setTransitions(prev => prev.map(t => 
      t.id === selectedTransition.id
        ? {
            ...t,
            fromStatus: transFromStatus as HypothesisStatus,
            toStatus: transToStatus as HypothesisStatus,
            allowedRoles: transRoles,
            conditionType: transCondition,
            conditionValue: transConditionValue || undefined,
          }
        : t
    ))
    setIsEditTransitionOpen(false)
    toast.success("Переход обновлён")
  }

  const handleDeleteTransition = (id: string) => {
    setTransitions(prev => prev.filter(t => t.id !== id))
    toast.success("Переход удалён")
  }

  const toggleTransitionActive = (id: string) => {
    setTransitions(prev => prev.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ))
  }

  const toggleRole = (role: UserRole) => {
    setTransRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const handleSaveAll = () => {
    toast.success("Настройки сохранены")
  }

  return (
    <>
      <Header breadcrumbs={[{ title: "Admin" }, { title: "Статусы и переходы" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Статусы и переходы</h1>
              <p className="text-sm text-muted-foreground">
                Настройка статусов гипотез и разрешённых переходов между ними
              </p>
            </div>
            <Button onClick={handleSaveAll}>Сохранить настройки</Button>
          </div>

          {/* Statuses Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Справочник статусов</CardTitle>
              <CardDescription>
                Порядок статусов влияет на отображение в системе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Цвет</TableHead>
                    <TableHead className="w-32">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.sort((a, b) => a.order - b.order).map((status) => (
                    <TableRow key={status.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        {status.order}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status.id as HypothesisStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full border"
                            style={{ backgroundColor: status.color }}
                          />
                          <code className="text-xs text-muted-foreground">{status.color}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditStatus(status)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Изменить
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Transitions Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Таблица переходов</CardTitle>
                  <CardDescription>
                    Разрешённые переходы между статусами с условиями
                  </CardDescription>
                </div>
                <Button onClick={handleAddTransition} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить переход
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Из статуса</TableHead>
                    <TableHead></TableHead>
                    <TableHead>В статус</TableHead>
                    <TableHead>Роли</TableHead>
                    <TableHead>Условие</TableHead>
                    <TableHead className="w-24">Активен</TableHead>
                    <TableHead className="w-24">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transitions.map((trans) => (
                    <TableRow key={trans.id} className={!trans.isActive ? "opacity-50" : ""}>
                      <TableCell>
                        <StatusBadge status={trans.fromStatus} />
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={trans.toStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {trans.allowedRoles.map(role => (
                            <Badge key={role} variant="outline" className="text-xs">
                              {roleLabels[role]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-muted-foreground">{conditionLabels[trans.conditionType]}</span>
                          {trans.conditionValue && (
                            <code className="ml-1 text-xs bg-muted px-1 rounded">
                              {trans.conditionValue}
                            </code>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={trans.isActive}
                          onCheckedChange={() => toggleTransitionActive(trans.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditTransition(trans)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteTransition(trans.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Status Dialog */}
      <Dialog open={isEditStatusOpen} onOpenChange={setIsEditStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать статус</DialogTitle>
            <DialogDescription>
              Измените название или цвет статуса
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Цвет (HEX)</Label>
              <div className="flex gap-2">
                <Input 
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  placeholder="#000000"
                />
                <div 
                  className="w-10 h-10 rounded border shrink-0"
                  style={{ backgroundColor: editColor }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStatusOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveStatus}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Transition Dialog */}
      <Dialog open={isAddTransitionOpen || isEditTransitionOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddTransitionOpen(false)
          setIsEditTransitionOpen(false)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAddTransitionOpen ? "Добавить переход" : "Редактировать переход"}
            </DialogTitle>
            <DialogDescription>
              Настройте разрешённый переход между статусами
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Из статуса</Label>
                <Select value={transFromStatus} onValueChange={(v) => setTransFromStatus(v as HypothesisStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>В статус</Label>
                <Select value={transToStatus} onValueChange={(v) => setTransToStatus(v as HypothesisStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Роли, которые могут выполнить переход</Label>
              <div className="flex gap-4">
                {(["admin", "po", "viewer"] as UserRole[]).map(role => (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox 
                      id={`role-${role}`}
                      checked={transRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm font-normal">
                      {roleLabels[role]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Условие перехода</Label>
              <Select value={transCondition} onValueChange={(v) => setTransCondition(v as TransitionConditionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без условий</SelectItem>
                  <SelectItem value="required_fields">Обязательные поля заполнены</SelectItem>
                  <SelectItem value="scoring_threshold">Скоринг выше порога</SelectItem>
                  <SelectItem value="checklist_closed">Чеклист закрыт</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transCondition !== "none" && transCondition !== "checklist_closed" && (
              <div className="space-y-2">
                <Label>
                  {transCondition === "required_fields" 
                    ? "Список полей (через запятую)" 
                    : "Пороговое значение"}
                </Label>
                <Input 
                  value={transConditionValue}
                  onChange={(e) => setTransConditionValue(e.target.value)}
                  placeholder={transCondition === "required_fields" ? "title,description" : "7.0"}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddTransitionOpen(false)
              setIsEditTransitionOpen(false)
            }}>
              Отмена
            </Button>
            <Button onClick={isAddTransitionOpen ? handleSaveNewTransition : handleSaveEditTransition}>
              {isAddTransitionOpen ? "Добавить" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
