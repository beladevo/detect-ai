"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  AdminHeader,
  DataTable,
  TierBadge,
  StatusBadge,
  Column,
} from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"
import Modal from "@/src/components/ui/Modal"
import { useAdmin } from "@/src/context/AdminContext"

interface User extends Record<string, unknown> {
  id: string
  email: string
  name: string | null
  tier: "FREE" | "PREMIUM" | "ENTERPRISE"
  status: "active" | "locked" | "suspended" | "deleted"
  emailVerified: boolean
  monthlyDetections: number
  totalDetections: number
  createdAt: string
  lastLoginAt: string | null
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
}

export default function UsersPage() {
  const router = useRouter()
  const { canModifyUsers, canDeleteUsers } = useAdmin()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<string | null>(null)

  // Filters
  const [tierFilter, setTierFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      if (tierFilter !== "all") params.set("tier", tierFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (searchQuery) params.set("search", searchQuery)

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data: UsersResponse = await response.json()
        setUsers(data.users)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, tierFilter, statusFilter, searchQuery])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return

    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          userIds: selectedUsers.map((u) => u.id),
        }),
      })

      if (response.ok) {
        setSelectedUsers([])
        setShowBulkModal(false)
        setBulkAction(null)
        fetchUsers()
      }
    } catch (error) {
      console.error("Bulk action failed:", error)
    }
  }

  const columns: Column<User>[] = [
    {
      key: "user",
      label: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-sm font-bold text-white">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{user.name || "No name"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          {user.emailVerified && (
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      ),
    },
    {
      key: "tier",
      label: "Tier",
      sortable: true,
      render: (user) => <TierBadge tier={user.tier} />,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: "detections",
      label: "Detections",
      sortable: true,
      render: (user) => (
        <div>
          <p className="font-medium text-foreground">{user.monthlyDetections}</p>
          <p className="text-xs text-muted-foreground">{user.totalDetections} total</p>
        </div>
      ),
    },
    {
      key: "lastLoginAt",
      label: "Last Active",
      sortable: true,
      render: (user) => (
        <span className="text-muted-foreground">
          {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "Never"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (user) => (
        <span className="text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (user) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/admin/users/${user.id}`)
            }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-card hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Users"
        description={`${total.toLocaleString()} total users`}
        actions={
          canModifyUsers && (
            <GlowButton size="sm" onClick={() => router.push("/admin/users/new")}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </GlowButton>
          )
        }
      />

      <div className="p-6">
        {/* Filters */}
        <GlassCard className="mb-6 p-4" hover={false}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card/50 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-purple focus:outline-none"
              />
            </div>

            {/* Tier Filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
            >
              <option value="all">All Tiers</option>
              <option value="FREE">Free</option>
              <option value="PREMIUM">Premium</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && canModifyUsers && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} selected
                </span>
                <button
                  onClick={() => {
                    setBulkAction("lock")
                    setShowBulkModal(true)
                  }}
                  className="rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-500 hover:bg-yellow-500/20"
                >
                  Lock
                </button>
                <button
                  onClick={() => {
                    setBulkAction("unlock")
                    setShowBulkModal(true)
                  }}
                  className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/20"
                >
                  Unlock
                </button>
                {canDeleteUsers && (
                  <button
                    onClick={() => {
                      setBulkAction("delete")
                      setShowBulkModal(true)
                    }}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </GlassCard>

        {/* Users Table */}
        <DataTable<User>
          columns={columns}
          data={users}
          keyField="id"
          loading={loading}
          onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
          selectable={canModifyUsers}
          onSelectionChange={setSelectedUsers}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
          }}
          emptyMessage="No users found"
        />
      </div>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false)
          setBulkAction(null)
        }}
        title={`${bulkAction?.charAt(0).toUpperCase()}${bulkAction?.slice(1)} Users`}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to {bulkAction} {selectedUsers.length} user
            {selectedUsers.length > 1 ? "s" : ""}?
          </p>
          <div className="flex justify-end gap-3">
            <GlowButton
              variant="ghost"
              onClick={() => {
                setShowBulkModal(false)
                setBulkAction(null)
              }}
            >
              Cancel
            </GlowButton>
            <GlowButton
              onClick={handleBulkAction}
              className={
                bulkAction === "delete" ? "!bg-red-500 hover:!bg-red-600" : ""
              }
            >
              Confirm
            </GlowButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
