'use client'

import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { listDomains } from '@/lib/admin-master-data'

const DOMAINS = listDomains()

export default function AdminMasterDataIndex() {
  return (
    <div className="min-h-screen bg-paper">
      <PageShell bucket="detail" surface="list">
        <Link
          href="/admin"
          className="text-sm text-forest-500 font-semibold hover:underline inline-block mb-6"
        >
          ← Back to Admin
        </Link>
        <PageHeader
          eyebrow="Admin"
          title="Master data"
          subtitle="Edit the lookup tables that power profile pickers, calculators, and search facets."
        />

        <div className="grid md:grid-cols-2 gap-4">
          {DOMAINS.map((d) => (
            <Link
              key={d.slug}
              href={`/admin/master-data/${d.slug}`}
              className="card p-5 hover:shadow-md transition flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-forest-700">{d.label}</h3>
                <p className="text-xs text-ink-400 mt-1 font-data">{d.slug}</p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-ink-400 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </PageShell>
    </div>
  )
}
