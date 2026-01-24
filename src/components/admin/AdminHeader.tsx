"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAdmin } from "@/src/context/AdminContext"

interface AdminHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export default function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  const { admin } = useAdmin()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <AnimatePresence>
            {searchOpen ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card/50 px-4 py-2 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-purple focus:outline-none focus:ring-1 focus:ring-brand-purple"
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false)
                  }}
                />
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-purple" />
          </button>

          {/* Actions */}
          {actions}

          {/* Admin badge */}
          {admin && (
            <div className="flex items-center gap-2 rounded-xl bg-brand-purple/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-purple" />
              <span className="text-xs font-medium text-brand-purple">{admin.adminRole}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
