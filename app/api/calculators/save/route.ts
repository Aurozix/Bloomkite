import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

interface SaveCalculatorRequest {
  calculator_type: string
  name?: string
  inputs: Record<string, unknown>
  results: Record<string, unknown>
  is_draft: boolean
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    const { user } = auth

    const body: SaveCalculatorRequest = await request.json()

    if (!body.calculator_type || !body.inputs || !body.results) {
      return NextResponse.json(
        { error: 'Missing required fields: calculator_type, inputs, results' },
        { status: 400 }
      )
    }

    let data
    try {
      data = await prisma.financialPlan.create({
        data: {
          userId: user.id,
          calculatorType: body.calculator_type,
          name: body.name || `${body.calculator_type} - ${new Date().toLocaleString()}`,
          inputs: body.inputs as any,
          results: body.results as any,
          isDraft: body.is_draft,
        },
      })
    } catch (error) {
      console.error('Error saving calculator result:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        { error: 'Failed to save calculator result', details: message },
        { status: 500 }
      )
    }

    // Mirror Risk Profiler's final category back to the investor profile so
    // it can be displayed on /profile/investor and used as defaults elsewhere
    // (e.g., calculator pre-fill). Only on explicit save (not auto-save draft).
    if (
      body.calculator_type === 'risk-profiler' &&
      body.is_draft === false &&
      typeof (body.results as { riskCategory?: unknown }).riskCategory === 'string'
    ) {
      const riskCategory = (body.results as { riskCategory: string }).riskCategory
      try {
        await prisma.investorProfile.update({
          where: { userId: user.id },
          data: {
            riskProfile: riskCategory,
            updatedAt: new Date(),
          },
        })
      } catch (profileError) {
        // Don't fail the whole request — the plan is saved; profile mirroring
        // is best-effort. Log so we notice if it stops working.
        console.error('Failed to sync risk_profile to investor_profile:', profileError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Calculator result saved as ${body.is_draft ? 'draft' : 'final'}`,
      data,
    })
  } catch (error) {
    console.error('Save calculator error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
