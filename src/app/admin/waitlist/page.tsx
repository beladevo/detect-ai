"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { AdminHeader, DataTable, Badge, Column } from "@/src/components/admin"
import GlassCard from "@/src/components/ui/GlassCard"
import GlowButton from "@/src/components/ui/GlowButton"
import Modal from "@/src/components/ui/Modal"
import { useAdmin } from "@/src/context/AdminContext"

interface WaitlistEntry extends Record<string, unknown> {
  id: string
  email: string
  source: string
  ipAddress: string | null
  userAgent: string | null
  status: "PENDING" | "INVITED" | "CONVERTED" | "REMOVED"
  invitedAt: string | null
  convertedAt: string | null
  createdAt: string
}

interface WaitlistResponse {
  entries: WaitlistEntry[]
  total: number
  page: number
  pageSize: number
  stats: {
    pending: number
    invited: number
    converted: number
  }
}

export default function WaitlistPage() {
  const { canModifyUsers } = useAdmin()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)
  const [selectedEntries, setSelectedEntries] = useState<WaitlistEntry[]>([])
  const [stats, setStats] = useState({ pending: 0, invited: 0, converted: 0 })
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviting, setInviting] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchWaitlist = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (searchQuery) params.set("search", searchQuery)

      const response = await fetch(`/api/admin/waitlist?${params}`)
      if (response.ok) {
        const data: WaitlistResponse = await response.json()
        setEntries(data.entries)
        setTotal(data.total)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to fetch waitlist:", error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, searchQuery])

  useEffect(() => {
    fetchWaitlist()
  }, [fetchWaitlist])

  const handleInvite = async () => {
    if (selectedEntries.length === 0) return
    setInviting(true)

    try {
      const response = await fetch("/api/admin/waitlist/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedEntries.map((e) => e.id),
        }),
      })

      if (response.ok) {
        setSelectedEntries([])
        setShowInviteModal(false)
        fetchWaitlist()
      }
    } catch (error) {
      console.error("Failed to invite users:", error)
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/waitlist/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchWaitlist()
      }
    } catch (error) {
      console.error("Failed to remove entry:", error)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/waitlist/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Failed to export:", error)
    }
  }

  const getStatusBadge = (status: WaitlistEntry["status"]) => {
    const config = {
      PENDING: { variant: "warning" as const, label: "Pending" },
      INVITED: { variant: "info" as const, label: "Invited" },
      CONVERTED: { variant: "success" as const, label: "Converted" },
      REMOVED: { variant: "default" as const, label: "Removed" },
    }
    const { variant, label } = config[status]
    return <Badge variant={variant} dot>{label}</Badge>
  }

  const columns: Column<WaitlistEntry>[] = [
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (entry) => (
        <span className="font-medium text-foreground">{entry.email}</span>
      ),
    },
    {
      key: "source",
      label: "Source",
      sortable: true,
      render: (entry) => (
        <Badge variant="outline">{entry.source}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (entry) => getStatusBadge(entry.status),
    },
    {
      key: "createdAt",
      label: "Signed Up",
      sortable: true,
      render: (entry) => (
        <span className="text-muted-foreground">
          {new Date(entry.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "invitedAt",
      label: "Invited",
      render: (entry) => (
        <span className="text-muted-foreground">
          {entry.invitedAt
            ? new Date(entry.invitedAt).toLocaleDateString()
            : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (entry) => (
        <div className="flex items-center gap-2">
          {entry.status === "PENDING" && canModifyUsers && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEntries([entry])
                  setShowInviteModal(true)
                }}
                className="rounded-lg p-2 text-brand-purple hover:bg-brand-purple/10"
                title="Invite"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(entry.id)
                }}
                className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                title="Remove"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Waitlist"
        description={`${total.toLocaleString()} total entries`}
        actions={
          <div className="flex items-center gap-2">
            <GlowButton variant="ghost" size="sm" onClick={handleExport}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </GlowButton>
          </div>
        }
      />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.invited}</p>
                <p className="text-sm text-muted-foreground">Invited</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4" hover={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.converted}</p>
                <p className="text-sm text-muted-foreground">Converted</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassCard className="mb-6 p-4" hover={false}>
          <div className="flex flex-wrap items-center gap-4">
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
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card/50 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-purple focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-foreground focus:border-brand-purple focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="INVITED">Invited</option>
              <option value="CONVERTED">Converted</option>
              <option value="REMOVED">Removed</option>
            </select>

            {selectedEntries.length > 0 && canModifyUsers && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-muted-foreground">
                  {selectedEntries.length} selected
                </span>
                <GlowButton size="sm" onClick={() => setShowInviteModal(true)}>
                  Invite Selected
                </GlowButton>
              </motion.div>
            )}
          </div>
        </GlassCard>

        {/* Table */}
        <DataTable<WaitlistEntry>
          columns={columns}
          data={entries}
          keyField="id"
          loading={loading}
          selectable={canModifyUsers}
          onSelectionChange={setSelectedEntries}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
          }}
          emptyMessage="No waitlist entries found"
        />
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Send Invitations"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send invitation emails to {selectedEntries.length} user
            {selectedEntries.length > 1 ? "s" : ""}?
          </p>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-card/30 p-3">
            {selectedEntries.map((entry) => (
              <p key={entry.id} className="text-sm text-foreground">
                {entry.email}
              </p>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <GlowButton variant="ghost" onClick={() => setShowInviteModal(false)}>
              Cancel
            </GlowButton>
            <GlowButton onClick={handleInvite} disabled={inviting}>
              {inviting ? "Sending..." : "Send Invitations"}
            </GlowButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}
