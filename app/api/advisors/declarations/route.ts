import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// PUT semantics: payload is the canonical state. We delete + recreate inside
// one transaction (Cascade FKs make this cheap), so omitting an id removes
// that row; reordering means re-sending with new priorities.
//
// Priority rules:
//   - products + services have a `priority` int (1 = highest). Defaults to
//     row position if the client doesn't include one — lets a simple
//     drag-only UI just send an ordered array.
//   - brands have no priority.

const productSchema = z.object({
  productId: z.string().uuid(),
  priority: z.number().int().min(1).max(999).optional(),
})

const serviceSchema = z.object({
  serviceId: z.string().uuid(),
  priority: z.number().int().min(1).max(999).optional(),
})

const brandSchema = z.object({
  brandId: z.string().uuid(),
})

const bodySchema = z.object({
  products: z.array(productSchema).max(100).optional(),
  services: z.array(serviceSchema).max(100).optional(),
  brands: z.array(brandSchema).max(100).optional(),
})

export async function GET(_request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const [products, services, brands] = await Promise.all([
    prisma.advisorProduct.findMany({
      where: { userId: user.id },
      orderBy: { priority: 'asc' },
      include: { product: { select: { id: true, slug: true, name: true } } },
    }),
    prisma.advisorService.findMany({
      where: { userId: user.id },
      orderBy: { priority: 'asc' },
      include: { service: { select: { id: true, slug: true, name: true } } },
    }),
    prisma.advisorBrand.findMany({
      where: { userId: user.id },
      include: { brand: { select: { id: true, slug: true, name: true } } },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      products: products.map((p) => ({
        productId: p.productId,
        slug: p.product.slug,
        name: p.product.name,
        priority: p.priority,
      })),
      services: services.map((s) => ({
        serviceId: s.serviceId,
        slug: s.service.slug,
        name: s.service.name,
        priority: s.priority,
      })),
      brands: brands.map((b) => ({
        brandId: b.brandId,
        slug: b.brand.slug,
        name: b.brand.name,
      })),
    },
  })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error
  const { user } = auth

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { products, services, brands } = parsed.data

  // Deduplicate by id within each list — a client that ships the same row
  // twice would otherwise trigger a primary-key violation on createMany.
  const dedupBy = <T extends Record<string, unknown>>(rows: T[], key: keyof T) => {
    const seen = new Set<unknown>()
    return rows.filter((r) => {
      if (seen.has(r[key])) return false
      seen.add(r[key])
      return true
    })
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (products !== undefined) {
        await tx.advisorProduct.deleteMany({ where: { userId: user.id } })
        const deduped = dedupBy(products, 'productId')
        if (deduped.length > 0) {
          await tx.advisorProduct.createMany({
            data: deduped.map((p, idx) => ({
              userId: user.id,
              productId: p.productId,
              priority: p.priority ?? idx + 1,
            })),
          })
        }
      }

      if (services !== undefined) {
        await tx.advisorService.deleteMany({ where: { userId: user.id } })
        const deduped = dedupBy(services, 'serviceId')
        if (deduped.length > 0) {
          await tx.advisorService.createMany({
            data: deduped.map((s, idx) => ({
              userId: user.id,
              serviceId: s.serviceId,
              priority: s.priority ?? idx + 1,
            })),
          })
        }
      }

      if (brands !== undefined) {
        await tx.advisorBrand.deleteMany({ where: { userId: user.id } })
        const deduped = dedupBy(brands, 'brandId')
        if (deduped.length > 0) {
          await tx.advisorBrand.createMany({
            data: deduped.map((b) => ({ userId: user.id, brandId: b.brandId })),
          })
        }
      }
    })
  } catch (err) {
    console.error('Advisor declarations PUT failed:', err)
    return NextResponse.json({ error: 'Failed to save declarations' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
