import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface SaveCalculatorRequest {
  calculator_type: string
  name?: string
  inputs: Record<string, unknown>
  results: Record<string, unknown>
  is_draft: boolean
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SaveCalculatorRequest = await request.json()

    if (!body.calculator_type || !body.inputs || !body.results) {
      return NextResponse.json(
        { error: 'Missing required fields: calculator_type, inputs, results' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.from('financial_plans').insert({
      user_id: user.id,
      calculator_type: body.calculator_type,
      name: body.name || `${body.calculator_type} - ${new Date().toLocaleString()}`,
      inputs: body.inputs,
      results: body.results,
      is_draft: body.is_draft,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error saving calculator result:', error)
      return NextResponse.json(
        { error: 'Failed to save calculator result', details: error.message },
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
      const { error: profileError } = await supabase
        .from('investor_profiles')
        .update({
          risk_profile: riskCategory,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (profileError) {
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
