"use client"

import { useEffect, useState } from "react"
import { useUnit } from "effector-react"
import { AlertCircle, MoreHorizontal, Pencil, Plus, Search, Trash2, Users } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
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
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  $teams,
  $teamsLoading,
  createTeamFx,
  deleteTeamFx,
  fetchTeamsFx,
  updateTeamFx,
} from "@/lib/stores/admin/teams"

const getApiErrorMessage = (error: unknown): string => {
  const response = typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
    : undefined

  const validationErrors = response?.data?.errors
  const firstValidationError = validationErrors ? Object.values(validationErrors)[0]?.[0] : undefined

  return firstValidationError ?? response?.data?.message ?? "Не удалось выполнить действие."
}

export default function AdminTeamsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null)
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [pageError, setPageError] = useState("")
  const [formError, setFormError] = useState("")
  const [
    teams,
    teamsLoading,
    createPending,
    updatePending,
    deletePending,
    doFetchTeams,
    doCreateTeam,
    doUpdateTeam,
    doDeleteTeam,
  ] = useUnit([
    $teams,
    $teamsLoading,
    createTeamFx.pending,
    updateTeamFx.pending,
    deleteTeamFx.pending,
    fetchTeamsFx,
    createTeamFx,
    updateTeamFx,
    deleteTeamFx,
  ])

  useEffect(() => {
    void doFetchTeams().catch((error: unknown) => setPageError(getApiErrorMessage(error)))
  }, [doFetchTeams])

  const resetForm = () => {
    setEditingTeamId(null)
    setFormName("")
    setFormDescription("")
    setFormError("")
  }

  const filteredTeams = teams.filter((team) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()

    return (
      team.name.toLowerCase().includes(query) ||
      (team.description?.toLowerCase().includes(query) ?? false)
    )
  })

  const deleteTeam = deleteTeamId === null
    ? undefined
    : teams.find((team) => team.id === deleteTeamId)

  const submitPending = editingTeamId === null ? createPending : updatePending

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (id: number) => {
    const team = teams.find((item) => item.id === id)

    if (!team) {
      return
    }

    setEditingTeamId(team.id)
    setFormName(team.name)
    setFormDescription(team.description ?? "")
    setFormError("")
    setIsDialogOpen(true)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return "-"
    }

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleSubmitTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError("")
    setPageError("")

    const name = formName.trim()
    const description = formDescription.trim() || null

    if (!name) {
      setFormError("Укажите название команды.")
      return
    }

    try {
      if (editingTeamId === null) {
        await doCreateTeam({ name, description })
      } else {
        await doUpdateTeam({ id: editingTeamId, name, description })
      }

      setIsDialogOpen(false)
      resetForm()
    } catch (error: unknown) {
      setFormError(getApiErrorMessage(error))
    }
  }

  const handleDeleteTeam = async () => {
    if (deleteTeamId === null) {
      return
    }

    setPageError("")

    try {
      await doDeleteTeam(deleteTeamId)
      setDeleteTeamId(null)
    } catch (error: unknown) {
      setPageError(getApiErrorMessage(error))
      setDeleteTeamId(null)
    }
  }

  return (
    <>
      <Header breadcrumbs={[{ title: "Admin" }, { title: "Teams" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
              <p className="text-sm text-muted-foreground">
                Manage teams and their members
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTeamId === null ? "Create Team" : "Edit Team"}</DialogTitle>
                  <DialogDescription>
                    {editingTeamId === null
                      ? "Add a new team to the organization"
                      : "Update team name and description"}
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmitTeam}>
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
                      placeholder="Team name"
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What does this team do?"
                      rows={3}
                      value={formDescription}
                      onChange={(event) => setFormDescription(event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitPending || formName.trim().length === 0}>
                      {submitPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                      {editingTeamId === null ? "Create Team" : "Save Changes"}
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
              placeholder="Search teams..."
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

          {/* Teams Grid */}
          {teamsLoading ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              <Spinner className="mx-auto mb-2 h-5 w-5" />
              Loading teams...
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              No teams found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTeams.map((team) => (
                <Card key={team.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{team.name}</CardTitle>
                          <CardDescription className="text-xs">
                            Created {formatDate(team.created_at)}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(team.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTeamId(team.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {team.description}
                      </p>
                    )}
                    <div className="flex gap-6">
                      <div>
                        <p className="text-2xl font-bold">{team.member_count ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Members</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{team.hypotheses_count ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Hypotheses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <AlertDialog open={deleteTeamId !== null} onOpenChange={(open) => {
            if (!open) {
              setDeleteTeamId(null)
            }
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete team?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteTeam
                    ? `Team "${deleteTeam.name}" will be removed. Teams with assigned users cannot be deleted.`
                    : "This team will be removed. Teams with assigned users cannot be deleted."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deletePending}
                  onClick={(event) => {
                    event.preventDefault()
                    void handleDeleteTeam()
                  }}
                >
                  {deletePending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </>
  )
}
