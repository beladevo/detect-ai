"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  onRowClick?: (item: T) => void
  loading?: boolean
  emptyMessage?: string
  selectable?: boolean
  onSelectionChange?: (selectedItems: T[]) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  loading = false,
  emptyMessage = "No data found",
  selectable = false,
  onSelectionChange,
  pagination,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = () => {
    if (selectedKeys.size === data.length) {
      setSelectedKeys(new Set())
      onSelectionChange?.([])
    } else {
      const allKeys = new Set(data.map(item => String(item[keyField])))
      setSelectedKeys(allKeys)
      onSelectionChange?.(data)
    }
  }

  const handleSelectRow = (item: T) => {
    const key = String(item[keyField])
    const newSelected = new Set(selectedKeys)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedKeys(newSelected)
    onSelectionChange?.(data.filter(d => newSelected.has(String(d[keyField]))))
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    const comparison = aVal < bVal ? -1 : 1
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card/50">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedKeys.size === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-border bg-card text-brand-purple focus:ring-brand-purple"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {column.label}
                      <span className="flex flex-col">
                        <svg
                          className={`h-3 w-3 ${sortKey === column.key && sortDirection === 'asc' ? 'text-brand-purple' : ''}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 4l-8 8h16z" />
                        </svg>
                        <svg
                          className={`-mt-1 h-3 w-3 ${sortKey === column.key && sortDirection === 'desc' ? 'text-brand-purple' : ''}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 20l8-8H4z" />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="py-12 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => (
                  <motion.tr
                    key={String(item[keyField])}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => onRowClick?.(item)}
                    className={`
                      border-b border-border/50 transition-colors
                      ${onRowClick ? 'cursor-pointer hover:bg-card/50' : ''}
                      ${selectedKeys.has(String(item[keyField])) ? 'bg-brand-purple/5' : ''}
                    `}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedKeys.has(String(item[keyField]))}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleSelectRow(item)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-border bg-card text-brand-purple focus:ring-brand-purple"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-sm text-foreground ${column.className || ''}`}
                      >
                        {column.render ? column.render(item) : String(item[column.key] ?? '')}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.page <= 3) {
                pageNum = i + 1
              } else if (pagination.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = pagination.page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors
                    ${pagination.page === pageNum
                      ? 'bg-brand-purple text-white'
                      : 'border border-border bg-card text-muted-foreground hover:bg-card/80 hover:text-foreground'
                    }
                  `}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
