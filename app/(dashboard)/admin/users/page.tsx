"use client"

import { useEffect, useState } from "react"
import { useUnit } from "effector-react"
import { Plus, Search, MoreHorizontal, UserCheck, UserX, AlertCircle } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Checkbox } from "@/components/ui/checkbox"
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
import { roleLabels } from "@/lib/mock-data"
import { $users, $usersLoading, createUserFx, fetchUsersFx, toggleUserActiveFx, updateUserFx, type AdminUser } from "@/lib/stores/admin/users"
import { $teams, fetchTeamsFx } from "@/lib/stores/admin/teams"
import type { UserRole } from "@/lib/types"

const roleOptions = Object.entries(roleLabels) as Array<[UserRole, string]>

const getApiErrorMessage = (error: unknown): string => {
  const response = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
    : undefined

  const validationErrors = response?.data?.errors
  const firstValidationError = validationErrors ? Object.values(validationErrors)[0]?.[0] : undefined

  return firstValidationError ?? response?.data?.message ?? "Не удалось выполнить действие."
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRoles, setFormRoles] = useState<UserRole[]>(["initiator"])
  const [editRoles, setEditRoles] = useState<UserRole[]>(["initiator"])
  const [formTeamId, setFormTeamId] = useState("none")
  const [pageError, setPageError] = useState("")
  const [formError, setFormError] = useState("")
  const [users, usersLoading, teams, createPending, updatePending, doFetchUsers, doFetchTeams, doCreateUser, doUpdateUser, doToggleUserActive] = useUnit([
    $users,
    $usersLoading,
    $teams,
    createUserFx.pending,
    updateUserFx.pending,
    fetchUsersFx,
    fetchTeamsFx,
    createUserFx,
    updateUserFx,
    toggleUserActiveFx,
  ])

  useEffect(() => {
    void doFetchUsers().catch((error: unknown) => setPageError(getApiErrorMessage(error)))
    void doFetchTeams().catch(() => undefined)
  }, [doFetchTeams, doFetchUsers])

  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormPassword("")
    setFormRoles(["initiator"])
    setFormTeamId("none")
    setFormError("")
  }

  const userRoles = (user: AdminUser): UserRole[] => {
    return user.roles?.length > 0 ? user.roles : [user.role]
  }

  const toggleRole = (roles: UserRole[], role: UserRole): UserRole[] => {
    if (roles.includes(role)) {
      return roles.length === 1 ? roles : roles.filter((item) => item !== role)
    }

    return [...roles, role]
  }

  const handleOpenRolesDialog = (user: AdminUser) => {
    setEditingUser(user)
    setEditRoles(userRoles(user))
    setFormError("")
    setIsRolesDialogOpen(true)
  }

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  })

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-[#EDE9FE] text-[#7C3AED]"
      case "pd_manager":
        return "bg-[#DBEAFE] text-[#2563EB]"
      case "initiator":
        return "bg-[#F3F4F6] text-[#6B7280]"
      case "analyst":
        return "bg-[#DCFCE7] text-[#166534]"
      case "tech_lead":
        return "bg-[#FEF3C7] text-[#92400E]"
      case "bizdev":
        return "bg-[#FCE7F3] text-[#9D174D]"
      case "committee":
        return "bg-[#F3E8FF] text-[#6B21A8]"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const handleRolesDialogOpenChange = (open: boolean) => {
    setIsRolesDialogOpen(open)
    if (!open) {
      setEditingUser(null)
      setFormError("")
    }
  }

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError("")

    try {
      await doCreateUser({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        roles: formRoles,
        team_id: formTeamId === "none" ? undefined : Number(formTeamId),
      })

      setIsDialogOpen(false)
      resetForm()
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error))
    }
  }

  const handleUpdateRoles = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError("")

    if (!editingUser) {
      return
    }

    try {
      await doUpdateUser({
        id: editingUser.id,
        roles: editRoles,
      })

      setIsRolesDialogOpen(false)
      setEditingUser(null)
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error))
    }
  }

  const handleToggleActive = async (id: number) => {
    setPageError("")

    try {
      await doToggleUserActive(id)
    } catch (error: unknown) {
      setPageError(getApiErrorMessage(error))
    }
  }

  return (
    <>
      <Header breadcrumbs={[{ title: "Admin" }, { title: "Users" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
              <p className="text-sm text-muted-foreground">
                Manage user accounts and permissions
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add User</DialogTitle>
                  <DialogDescription>
                    Create a new user account
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateUser}>
                  {formError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Full name"
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@company.com"
                      value={formEmail}
                      onChange={(event) => setFormEmail(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Temporary password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={formPassword}
                      onChange={(event) => setFormPassword(event.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Roles</Label>
                      <div className="grid gap-2">
                        {roleOptions.map(([value, label]) => (
                          <Label key={value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <Checkbox
                              checked={formRoles.includes(value)}
                              onCheckedChange={() => setFormRoles((roles) => toggleRole(roles, value))}
                            />
                            {label}
                          </Label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team">Team</Label>
                      <Select value={formTeamId} onValueChange={setFormTeamId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={String(team.id)}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPending}>
                      {createPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      Create User
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isRolesDialogOpen} onOpenChange={handleRolesDialogOpenChange}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Roles</DialogTitle>
                  <DialogDescription>
                    Assign roles for {editingUser?.name}
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleUpdateRoles}>
                  {formError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {roleOptions.map(([value, label]) => (
                      <Label key={value} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                        <Checkbox
                          checked={editRoles.includes(value)}
                          onCheckedChange={() => setEditRoles((roles) => toggleRole(roles, value))}
                        />
                        {label}
                      </Label>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsRolesDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updatePending}>
                      {updatePending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      Save Roles
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {pageError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{pageError}</AlertDescription>
            </Alert>
          )}

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <Spinner className="mx-auto mb-2 h-5 w-5" />
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {userRoles(user).map((role) => (
                            <Badge key={role} className={getRoleBadgeColor(role)}>
                              {roleLabels[role]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.team?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="outline" className="text-[#22C55E] border-[#22C55E]/30">
                            <UserCheck className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <UserX className="mr-1 h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.last_login_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenRolesDialog(user)}>
                              Roles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleToggleActive(user.id)}>
                              {user.is_active ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </>
  )
}
