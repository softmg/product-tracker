"use client"

import { useState } from "react"
import { GripVertical, Pencil, ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/hypotheses/status-badge"
import { mockStatusConfigs } from "@/lib/mock-data"
import type { HypothesisStatus } from "@/lib/types"

export default function AdminStatusesPage() {
  const [statuses, setStatuses] = useState(mockStatusConfigs)

  const toggleActive = (id: string) => {
    setStatuses(prev => prev.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ))
  }

  const activeStatuses = statuses.filter(s => s.isActive)

  return (
    <>
      <Header breadcrumbs={[{ title: "Admin" }, { title: "Status Settings" }]} />
      
      <main className="flex-1 overflow-auto">
        <div className="container pl-8 pr-8 py-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Status Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure the hypothesis workflow statuses
            </p>
          </div>

          {/* Workflow Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow Preview</CardTitle>
              <CardDescription>
                The current status flow for hypotheses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                {activeStatuses.map((status, index) => (
                  <div key={status.id} className="flex items-center gap-2">
                    <StatusBadge status={status.id as HypothesisStatus} />
                    {index < activeStatuses.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statuses List */}
          <div className="space-y-4">
            {statuses.map((status) => (
              <Card key={status.id} className={!status.isActive ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-lg border bg-muted">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={status.id as HypothesisStatus} />
                          <span className="text-sm text-muted-foreground">
                            Step {status.order}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${status.id}`} className="text-sm text-muted-foreground">
                              Active
                            </Label>
                            <Switch
                              id={`active-${status.id}`}
                              checked={status.isActive}
                              onCheckedChange={() => toggleActive(status.id)}
                            />
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2">
                        {status.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info */}
          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Drag and drop to reorder statuses. Changes will be saved automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
