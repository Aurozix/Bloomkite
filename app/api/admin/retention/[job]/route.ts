import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth-helpers'
import { recordAdminAudit, type AdminAuditAction } from '@/lib/admin-audit'
import { runPurgeJob, type PurgeJobName } from '@/lib/data-retention'

// POST /api/admin/retention/:job
// Manually trigger a retention-purge job (BRD §13.3). Intended fallback
// until a real scheduler is wired up; admin clicks "run now" on
// /admin/retention.
//
// :job must be one of: purge-otps | purge-closed-forum | purge-deleted-accounts.
// Each invocation writes an audit row with the affected counts in metadata.

const VALID_JOBS: PurgeJobName[] = [
  'purge-otps',
  'purge-closed-forum',
  'purge-deleted-accounts',
]

const AUDIT_ACTION: Record<PurgeJobName, AdminAuditAction> = {
  'purge-otps': 'retention.purge_otps',
  'purge-closed-forum': 'retention.purge_chat',
  'purge-deleted-accounts': 'retention.purge_deleted_accounts',
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { job: string } },
) {
  const auth = await requireRole('admin')
  if ('error' in auth) return auth.error

  if (!VALID_JOBS.includes(params.job as PurgeJobName)) {
    return NextResponse.json(
      { error: 'Unknown job', valid: VALID_JOBS },
      { status: 400 },
    )
  }

  const job = params.job as PurgeJobName
  const result = await runPurgeJob(job)

  await recordAdminAudit({
    actorUserId: auth.user.id,
    action: AUDIT_ACTION[job],
    targetType: 'retention_job',
    targetId: job,
    metadata: { result: result as Record<string, unknown> },
  })

  return NextResponse.json({ success: true, job, result })
}
