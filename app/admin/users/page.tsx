'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'react-aria-components'
import { api } from '@/lib/api/client'
import { keys } from '@/lib/api/keys'
import { Surface } from '@/components/ui/Surface'
import { Loading } from '@/components/ui/ResourceState'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import type { User } from '@/lib/api/types'

/* §6.6 Data tables. Real th scope, a caption, sortable columns as buttons
 * with aria-sort on the th, and a focusable named scroll container — the
 * one real axe finding recorded against /admin/users, not reintroduced.
 * Row actions are never hover-only; destructive ones confirm and name the
 * object. Below md, stacked definition rows (handled in CSS). */

type SortKey = 'name' | 'email' | 'role'

export default function AdminUsersPage() {
  const { data, isPending } = useQuery({ queryKey: keys.adminUsers(), queryFn: () => api.users() })
  const [sort, setSort] = useState<{ key: SortKey; dir: 'ascending' | 'descending' }>({
    key: 'name',
    dir: 'ascending',
  })
  const toast = useToast()

  const rows: User[] = [...(data ?? [])].sort((a, b) => {
    const v = a[sort.key].localeCompare(b[sort.key])
    return sort.dir === 'ascending' ? v : -v
  })

  function header(key: SortKey, label: string) {
    const active = sort.key === key
    return (
      <th scope="col" aria-sort={active ? sort.dir : 'none'}>
        <button
          type="button"
          className="k-table__sort"
          onClick={() =>
            setSort({
              key,
              dir: active && sort.dir === 'ascending' ? 'descending' : 'ascending',
            })
          }
        >
          {label}
          {active ? (sort.dir === 'ascending' ? ' ↑' : ' ↓') : ''}
        </button>
      </th>
    )
  }

  return (
    <Surface title="Users" orientation="Manage accounts and roles.">
      {isPending ? (
        <Loading label="Loading users" />
      ) : (
        <div
          className="k-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Users table, scrollable"
        >
          <table className="k-table">
            <caption className="k-visually-hidden">All accounts, with role.</caption>
            <thead>
              <tr>
                {header('name', 'Name')}
                {header('email', 'Email')}
                {header('role', 'Role')}
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <th scope="row" data-label="Name">
                    {u.name}
                  </th>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Role">{u.role}</td>
                  <td data-label="Actions">
                    <ConfirmDialog
                      trigger={
                        <Button className="k-btn k-btn--destructive k-press">Remove</Button>
                      }
                      title={`Remove ${u.name}?`}
                      body={
                        <p>
                          This removes {u.name}’s account and their enrolments.
                          Their notes are deleted with it and cannot be recovered.
                        </p>
                      }
                      confirmLabel="Remove account"
                      destructive
                      onConfirm={() =>
                        toast.push({
                          tone: 'info',
                          message: `${u.name} was removed.`,
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Surface>
  )
}
