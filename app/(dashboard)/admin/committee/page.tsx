"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Users2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  mockProductCommitteeMembers, 
  mockUsers,
  getUserById 
} from "@/lib/mock-data"
import type { ProductCommitteeMember } from "@/lib/types"

export default function AdminCommitteePage() {
  const [members, setMembers] = useState<ProductCommitteeMember[]>(mockProductCommitteeMembers)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<ProductCommitteeMember | null>(null)
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState("")
  const [displayRole, setDisplayRole] = useState("")

  const sortedMembers = [...members].sort((a, b) => a.order - b.order)

  // Get users that are not already in the committee
  const availableUsers = mockUsers.filter(
    user => !members.find(m => m.userId === user.id && m.isActive)
  )

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleAddMember = () => {
    if (!selectedUserId || !displayRole) return

    const newMember: ProductCommitteeMember = {
      id: `pc-${Date.now()}`,
      userId: selectedUserId,
      displayRole,
      order: members.length + 1,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    }

    setMembers([...members, newMember])
    setSelectedUserId("")
    setDisplayRole("")
    setIsAddDialogOpen(false)
  }

  const handleEditMember = () => {
    if (!editingMember || !displayRole) return

    setMembers(members.map(m => 
      m.id === editingMember.id 
        ? { ...m, displayRole, userId: selectedUserId || m.userId } 
        : m
    ))
    setEditingMember(null)
    setDisplayRole("")
    setSelectedUserId("")
    setIsEditDialogOpen(false)
  }

  const handleDeleteMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id))
  }

  const handleToggleActive = (id: string) => {
    setMembers(members.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive } : m
    ))
  }

  const handleMoveUp = (id: string) => {
    const index = sortedMembers.findIndex(m => m.id === id)
    if (index <= 0) return
    
    const prevMember = sortedMembers[index - 1]
    const currentMember = sortedMembers[index]
    
    setMembers(members.map(m => {
      if (m.id === currentMember.id) return { ...m, order: prevMember.order }
      if (m.id === prevMember.id) return { ...m, order: currentMember.order }
      return m
    }))
  }

  const handleMoveDown = (id: string) => {
    const index = sortedMembers.findIndex(m => m.id === id)
    if (index >= sortedMembers.length - 1) return
    
    const nextMember = sortedMembers[index + 1]
    const currentMember = sortedMembers[index]
    
    setMembers(members.map(m => {
      if (m.id === currentMember.id) return { ...m, order: nextMember.order }
      if (m.id === nextMember.id) return { ...m, order: currentMember.order }
      return m
    }))
  }

  const openEditDialog = (member: ProductCommitteeMember) => {
    setEditingMember(member)
    setDisplayRole(member.displayRole)
    setSelectedUserId(member.userId)
    setIsEditDialogOpen(true)
  }

  const activeCount = members.filter(m => m.isActive).length

  return (
    <>
      <Header breadcrumbs={[{ title: "Admin" }, { title: "Продуктовый комитет" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Продуктовый комитет</h1>
              <p className="text-sm text-muted-foreground">
                Состав продуктового комитета. Участники отображаются на вкладке «Решение ПК» в карточке гипотезы.
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить участника
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить участника</DialogTitle>
                  <DialogDescription>
                    Выберите пользователя и укажите его роль в комитете
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="user">Пользователь</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите пользователя" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <span>{user.name}</span>
                              <span className="text-muted-foreground text-xs">({user.email})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayRole">Отображаемая роль</Label>
                    <Input 
                      id="displayRole"
                      placeholder="например: CPO, CEO, Tech Lead"
                      value={displayRole}
                      onChange={(e) => setDisplayRole(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Эта роль будет отображаться в интерфейсе вместо системной роли пользователя
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button 
                      onClick={handleAddMember}
                      disabled={!selectedUserId || !displayRole}
                    >
                      Добавить
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Состав комитета</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-sm text-muted-foreground">Активных участников</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">{members.length - activeCount}</p>
                  <p className="text-sm text-muted-foreground">Неактивных</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Порядок</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Отображаемая роль</TableHead>
                  <TableHead className="w-[100px]">Активен</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMembers.map((member, index) => {
                  const user = getUserById(member.userId)
                  return (
                    <TableRow key={member.id} className={!member.isActive ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <span className="text-muted-foreground">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {user ? getInitials(user.name) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user?.name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {member.displayRole}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={member.isActive}
                          onCheckedChange={() => handleToggleActive(member.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMoveUp(member.id)}
                              disabled={index === 0}
                            >
                              Переместить выше
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleMoveDown(member.id)}
                              disabled={index === sortedMembers.length - 1}
                            >
                              Переместить ниже
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteMember(member.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {sortedMembers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Нет участников комитета. Добавьте первого участника.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать участника</DialogTitle>
            <DialogDescription>
              Измените роль участника в комитете
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="editUser">Пользователь</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.name}</span>
                        <span className="text-muted-foreground text-xs">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDisplayRole">Отображаемая роль</Label>
              <Input 
                id="editDisplayRole"
                placeholder="например: CPO, CEO, Tech Lead"
                value={displayRole}
                onChange={(e) => setDisplayRole(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button 
                onClick={handleEditMember}
                disabled={!displayRole}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
