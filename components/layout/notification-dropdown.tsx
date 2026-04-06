"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Bell, RefreshCw, ArrowUpRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { mockNotifications } from "@/lib/mock-data"
import type { Notification, NotificationType } from "@/lib/types"

const notificationTypeConfig: Record<NotificationType, { icon: string; color: string; borderColor: string }> = {
  status_change: { icon: "refresh", color: "text-violet-500", borderColor: "border-l-violet-500" },
  responsible_assigned: { icon: "user", color: "text-blue-500", borderColor: "border-l-blue-500" },
  sla_violation: { icon: "alert", color: "text-red-500", borderColor: "border-l-red-500" },
  sla_warning: { icon: "clock", color: "text-yellow-500", borderColor: "border-l-yellow-500" },
  committee_voting_opened: { icon: "vote", color: "text-blue-500", borderColor: "border-l-blue-500" },
  committee_decision: { icon: "check", color: "text-green-500", borderColor: "border-l-green-500" },
  artifact_added: { icon: "file", color: "text-muted-foreground", borderColor: "border-l-muted-foreground" },
  comment_added: { icon: "comment", color: "text-muted-foreground", borderColor: "border-l-muted-foreground" },
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const config = notificationTypeConfig[type]
  
  return (
    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted", config.color)}>
      {type === "status_change" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      {type === "responsible_assigned" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
      {type === "sla_violation" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )}
      {type === "sla_warning" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {type === "committee_voting_opened" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )}
      {type === "committee_decision" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {type === "artifact_added" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      )}
      {type === "comment_added" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )}
    </div>
  )
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "только что"
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays === 1) return "вчера"
  if (diffDays < 7) return `${diffDays} дн. назад`
  
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length
  const displayCount = unreadCount > 99 ? "99+" : unreadCount

  // Get latest 5 notifications (unread first, then read)
  const latestNotifications = [...notifications]
    .sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 5)

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    )
  }, [])

  // Poll for new notifications (simulated)
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would fetch from API
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {displayCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[420px] p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Уведомления</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={markAllAsRead}
              >
                <Check className="mr-1 h-3 w-3" />
                Прочитать все
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {latestNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8" />
              <p className="text-sm">Нет уведомлений</p>
            </div>
          ) : (
            <div className="divide-y">
              {latestNotifications.map((notification) => {
                const config = notificationTypeConfig[notification.type]
                
                return (
                  <Link
                    key={notification.id}
                    href={`/hypotheses/${notification.hypothesisId}`}
                    onClick={() => {
                      markAsRead(notification.id)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "block border-l-4 pl-4 pr-5 py-3 transition-colors hover:bg-muted/50",
                      config.borderColor,
                      !notification.isRead && "bg-muted/30"
                    )}
                  >
                    <div className="flex gap-3">
                      <NotificationIcon type={notification.type} />
                      <div className="min-w-0 flex-1 pr-1">
                        <div className="flex items-start gap-3">
                          <p className={cn(
                            "text-sm line-clamp-1 flex-1 min-w-0",
                            !notification.isRead && "font-medium"
                          )}>
                            {notification.message}
                          </p>
                          <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {notification.hypothesisCode}: {notification.hypothesisTitle}
                        </p>
                        {notification.details && (
                          <p className={cn(
                            "mt-1 truncate text-xs",
                            notification.isRead ? "text-muted-foreground" : "text-foreground"
                          )}>
                            {notification.details}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {notification.initiator}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-2">
          <Link 
            href="/notifications" 
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-1 rounded-md py-2 text-sm text-primary hover:bg-muted transition-colors"
          >
            Открыть полный центр
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
