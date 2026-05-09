import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Extract user ID from JWT
    const parts = accessToken.split('.')
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Decode JWT payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
    const userId = payload.sub

    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    const body: SaveCalculatorRequest = await request.json()

    if (!body.calculator_type || !body.inputs || !body.results) {
      return NextResponse.json(
        { error: 'Missing required fields: calculator_type, inputs, results' },
        { status: 400 }
      )
    }

    // Insert or update financial plan
    const { data, error } = await supabase.from('financial_plans').insert({
      user_id: userId,
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
