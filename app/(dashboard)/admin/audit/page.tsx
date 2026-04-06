"use client"

import { useState } from "react"
import { Search, Filter, Download, ArrowRight, PlusCircle, Pencil, Trash2, RefreshCw } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockAuditLog, statusDisplayInfo } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")

  const filteredEntries = mockAuditLog.filter(entry => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!entry.userName.toLowerCase().includes(query) && 
          !entry.entityId.toLowerCase().includes(query)) {
        return false
      }
    }
    if (entityTypeFilter !== "all" && entry.entityType !== entityTypeFilter) {
      return false
    }
    if (actionFilter !== "all" && entry.action !== actionFilter) {
      return false
    }
    return true
  })

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create": return <PlusCircle className="h-4 w-4" />
      case "update": return <Pencil className="h-4 w-4" />
      case "delete": return <Trash2 className="h-4 w-4" />
      case "status_change": return <RefreshCw className="h-4 w-4" />
      default: return null
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-[#DCFCE7] text-[#16A34A]"
      case "update": return "bg-[#DBEAFE] text-[#2563EB]"
      case "delete": return "bg-[#FEE2E2] text-[#DC2626]"
      case "status_change": return "bg-[#EDE9FE] text-[#7C3AED]"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const formatChanges = (entry: typeof mockAuditLog[0]) => {
    if (entry.action === "status_change" && entry.changes.status) {
      const oldStatus = entry.changes.status.old as string
      const newStatus = entry.changes.status.new as string
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {statusDisplayInfo[oldStatus]?.label || oldStatus}
          </Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge variant="outline" className="text-xs">
            {statusDisplayInfo[newStatus]?.label || newStatus}
          </Badge>
        </div>
      )
    }
    
    if (entry.action === "create") {
      return <span className="text-sm text-muted-foreground">Created new {entry.entityType}</span>
    }
    
    const fields = Object.keys(entry.changes)
    if (fields.length === 0) {
      return <span className="text-sm text-muted-foreground">-</span>
    }
    
    return <span className="text-sm text-muted-foreground">Updated {fields.join(", ")}</span>
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <Header breadcrumbs={[{ title: "Admin" }, { title: "Audit Log" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
              <p className="text-sm text-muted-foreground">
                Track all changes and activities in the system
              </p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hypothesis">Hypothesis</SelectItem>
                <SelectItem value="experiment">Experiment</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="status_change">Status Change</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            {filteredEntries.length} entries found
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No audit entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {getInitials(entry.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{entry.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1 font-normal", getActionColor(entry.action))}>
                          {getActionIcon(entry.action)}
                          <span className="capitalize">{entry.action.replace("_", " ")}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="capitalize text-sm">{entry.entityType}</span>
                          <p className="text-xs text-muted-foreground font-mono">
                            {entry.entityId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatChanges(entry)}
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
