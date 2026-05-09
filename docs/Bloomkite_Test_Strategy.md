# Bloomkite Automated Test Strategy

**Version**: 1.0  
**Last Updated**: May 2026  
**Status**: Ready for Implementation  
**Audience**: Development Team, QA Engineers, Architects  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Coverage Targets by Layer](#2-coverage-targets-by-layer)
3. [Test Pyramid](#3-test-pyramid-for-bloomkite)
4. [Priority Coverage Areas](#4-priority-coverage-areas)
5. [Coverage Quality Standards](#5-coverage-quality-standards)
6. [Testing Toolchain](#6-testing-toolchain)
7. [Sprint 1 & 2 Test Plan](#7-sprint-1--2-test-plan)
8. [Coverage Enforcement](#8-coverage-enforcement--ci)
9. [Review Cadence](#9-review-cadence)
10. [Success Criteria](#10-success-criteria)

---

## 1. Overview

Bloomkite's automated testing strategy ensures:

- **High Reliability**: Financial calculations and transactions are verifiable and correct
- **Fast, Safe Deployments**: Confident code changes with predictable regression detection
- **Scalable Automation**: Test suite grows with platform without becoming a maintenance burden
- **Risk-Based Approach**: Coverage targets prioritize critical paths over vanity metrics

---

## 2. Coverage Targets by Layer

### 2.1 Unit Tests

**Purpose**: Verify individual functions in isolation

**Target Coverage**:
- **Financial Calculators**: 100% (goal-planner, cash-flow, net-worth, priority-ranker, insurance-needs, risk-profiler)
- **Utility Functions**: 90%+
- **Business Logic**: 85%+

**Tool**: Jest (with TypeScript support)

**Example Coverage**:
```
lib/calculators/
├── goalPlanner.ts         100% (all formulas, edge cases)
├── cashFlow.ts            100% (income/expense logic)
├── netWorth.ts            100% (asset calculations)
├── priorityRanker.ts      100% (urgency sorting)
├── insuranceNeeds.ts      100% (multiplier logic)
└── riskProfiler.ts        100% (score inversion, category mapping)
```

### 2.2 Integration Tests

**Purpose**: Verify API routes, database operations, and inter-component interactions

**Target Coverage**:
- **Authentication Routes**: 100% (signup, login, logout, session, role-selection)
- **Calculator Save Routes**: 100% (persistence layer)
- **Database Queries**: 80%+ (RLS policies, joins, filters)

**Tool**: Jest + Supertest + Supabase test database

**Example Coverage**:
```
app/api/
├── auth/                   100% (all auth flows)
├── calculators/save        100% (persistence, permissions)
└── [future routes]         80%+ (CRUD operations)
```

### 2.3 End-to-End (E2E) Tests

**Purpose**: Verify critical user journeys from start to finish

**Target Coverage**:
- **Critical Paths**: 100% (user signup → calculator → save result)
- **Role-Specific Flows**: 100% (investor flow, advisor flow)
- **Error Scenarios**: 80%+ (auth failures, validation errors, network issues)

**Tool**: Playwright

**Example Coverage**:
```
Journeys:
├── Investor: Signup → Role Selection → Dashboard → Calculator → Save
├── Advisor: Signup → Profile Setup → Verification → Dashboard
└── Error Cases: Invalid login, duplicate account, network timeout
```

---

## 3. Test Pyramid for Bloomkite

```
                    /\
                   /  \                    (10-15%)
                  / E2E \              Expensive, slow,
                 /______\         validate full journeys
                
              /\        /\
             /  \      /  \                (25-35%)
            / INT\    / INT\           Moderate cost,
           /______\  /______\    verify integrations
          
    /\    /\    /\    /\    /\
   /  \  /  \  /  \  /  \  /  \        (50-60%)
  /UNIT\/UNIT\/UNIT\/UNIT\/UNIT\   Fast, cheap,
 /______\/____\/____\/____\/____\  foundation
```

**Ratio**: 50:35:15 (Unit : Integration : E2E)

---

## 4. Priority Coverage Areas

### 4.1 Phase 1: Sprint 1 & 2 (Immediate - Must Cover)

**High Risk, High Value**:

- ✅ **Financial Calculators** (Sprint 2)
  - All 6 calculator functions with 100% coverage
  - Edge cases: zero values, large numbers, negative inputs
  - Decimal.js precision (rounding, comparison)

- ✅ **Authentication** (Sprint 1)
  - Session creation and validation
  - JWT token handling
  - RLS policy enforcement

- ✅ **Persistence** (Sprint 2)
  - Calculator result saving
  - Draft vs final save distinction
  - User data isolation via RLS

### 4.2 Phase 2: Sprint 3+ (Important)

**Medium Risk, Core Features**:

- Advisor discovery & search
- Plan sharing & feedback
- Article publishing & moderation
- Subscription & payment flows

### 4.3 Phase 3: Sprint 4+ (Nice-to-Have)

**Low Risk, Supportive Features**:

- UI component interactions
- Notification delivery
- Settings & preferences
- Analytics events

---

## 5. Coverage Quality Standards

### 5.1 Every Test Must

- **Be Deterministic**: Same input → same output, no flakiness
- **Avoid Over-Mocking**: Only mock external systems (Supabase Auth, payment providers)
- **Test Both Paths**: Happy path AND error/edge cases
- **Include Boundaries**: Zero, negative, max values, empty arrays
- **Use Realistic Data**: Currency in INR, proper date formats, valid UUIDs

### 5.2 Test Code Quality

- Descriptive test names: `should calculate goal plan with inflation adjustment` (not `test1`)
- Clear AAA structure: Arrange (setup) → Act (execute) → Assert (verify)
- No test interdependencies (each test runs independently)
- Focused assertions (test one thing per test, or group related assertions)

### 5.3 PR Requirements

- ✅ Every new feature includes unit tests
- ✅ Every API endpoint includes integration tests
- ✅ Critical flows have E2E tests
- ✅ No decrease in overall coverage %
- ✅ All new tests pass locally and in CI

---

## 6. Testing Toolchain

### Frontend & API Testing

| Layer | Tool | Purpose |
|-------|------|---------|
| **Unit** | Jest | Fast unit tests for calc functions, utilities |
| **Integration** | Supertest + Jest | API route testing with real/mock database |
| **E2E** | Playwright | User journey testing in real browser |
| **Coverage** | Istanbul (built into Jest) | Coverage reports & metrics |

### Database Testing

| Component | Approach |
|-----------|----------|
| **RLS Policies** | Integration tests with real Supabase test DB |
| **Migrations** | Manual verification (schema tests can follow) |
| **Queries** | Integration tests with fixture data |

### CI/CD

| Stage | Tool | Action |
|-------|------|--------|
| **Lint** | Next.js lint | ESLint, TypeScript errors |
| **Type Check** | TypeScript | `tsc --noEmit` |
| **Unit Tests** | Jest | `jest --coverage` |
| **Integration** | Jest + Supertest | `jest --testPathPattern=__tests__/api` |
| **E2E** | Playwright | `playwright test` |
| **Coverage Gate** | GitHub Actions | Fail if coverage < threshold |

---

## 7. Sprint 1 & 2 Test Plan

### Sprint 1: Authentication & Setup

| Component | Type | Tests | Target | Priority |
|-----------|------|-------|--------|----------|
| **Session Route** | Integration | Get user, JWT validation, RLS | 100% | 🔴 Critical |
| **Auth Middleware** | Unit | Token extraction, validation | 100% | 🔴 Critical |
| **Login Flow** | E2E | Email/password + Google OAuth | 100% | 🔴 Critical |

**Scope**: 8-10 tests, ~2 hours implementation

### Sprint 2: Financial Calculators

| Calculator | Type | Test Cases | Target | Priority |
|------------|------|-----------|--------|----------|
| **Goal Planner** | Unit | Formula accuracy, inflation, edge cases | 100% | 🔴 Critical |
| **Cash Flow** | Unit | Income/expense aggregation, rates | 100% | 🔴 Critical |
| **Net Worth** | Unit | Asset/liability totals, percentages | 100% | 🔴 Critical |
| **Priority Ranker** | Unit | Urgency sorting, alphabetical, delete logic | 100% | 🔴 Critical |
| **Insurance Needs** | Unit | Multiplier matrix, gap calculation | 100% | 🔴 Critical |
| **Risk Profiler** | Unit | Score inversion, category mapping, allocation | 100% | 🔴 Critical |
| **Save Endpoint** | Integration | Auth check, RLS, draft vs final | 100% | 🔴 Critical |
| **Hub Page** | E2E | Navigation, session check, grid load | 80% | 🟡 Important |
| **Calculator Pages** | E2E | Input → Calculate → Save flow (1 per calc) | 60% | 🟡 Important |

**Scope**: 40-50 tests, ~8-10 hours implementation

**Test Distribution**:
- Unit: 35 tests (calculators + utilities)
- Integration: 5 tests (API routes, database)
- E2E: 8 tests (critical journeys)

---

## 8. Coverage Enforcement & CI

### Coverage Thresholds

| Layer | Threshold | Enforcement |
|-------|-----------|-------------|
| **Financial Logic** | 100% | Hard fail if lower |
| **Core Backend** | 90% | Hard fail if lower |
| **Utilities** | 85% | Hard fail if lower |
| **Overall** | 80% | Hard fail if lower |

### GitHub Actions Workflow

```yaml
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:unit -- --coverage
      - run: npm run test:integration
      
      - name: Coverage Gate
        run: |
          npm run coverage:check -- --threshold 80
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

---

## 9. Review Cadence

### Per Pull Request
- ✅ All tests pass
- ✅ No coverage decrease
- ✅ New tests included for new logic

### Monthly
- Review coverage gaps in dashboard
- Identify flaky tests and fix root causes
- Optimize slow tests (> 1 second)

### Quarterly
- Audit test pyramid balance (aiming for 50:35:15)
- Evaluate new testing tools/frameworks
- Plan additional coverage for new features

### Per Release
- Validate critical user journeys have E2E tests
- Ensure all financial logic is 100% covered
- Document test coverage in release notes

---

## 10. Success Criteria

### By End of Sprint 2

✅ **Metrics**:
- 100% coverage on all 6 calculators
- 90%+ coverage on auth/session logic
- 80%+ overall codebase coverage
- 0 flaky tests
- All tests pass in < 3 minutes

✅ **Artifacts**:
- Jest config with coverage thresholds
- GitHub Actions CI workflow
- Test infrastructure (fixtures, utilities)
- 40-50 passing tests
- Coverage report in PR checks

✅ **Developer Experience**:
- `npm run test` runs all tests locally
- `npm run test:watch` for TDD
- `npm run test:coverage` shows coverage report
- Clear test failure messages guide fixes

---

## Summary

Bloomkite's testing strategy prioritizes **high-confidence deployments** through:

- **100% coverage** of financial logic (no room for calculation errors)
- **90%+ coverage** of authentication (no room for security gaps)
- **80%+ overall** (sustainable, risk-based approach)
- **Balanced pyramid** with fast unit tests as foundation
- **Automated enforcement** in CI (no manual coverage tracking)

This ensures trust in the platform without over-engineering or maintenance debt.

---

## Appendix: Test File Structure

```
Bloomkite/
├── __tests__/
│   ├── unit/
│   │   ├── lib/calculators/
│   │   │   ├── goalPlanner.test.ts
│   │   │   ├── cashFlow.test.ts
│   │   │   ├── netWorth.test.ts
│   │   │   ├── priorityRanker.test.ts
│   │   │   ├── insuranceNeeds.test.ts
│   │   │   └── riskProfiler.test.ts
│   │   └── lib/utils/
│   │
│   ├── integration/
│   │   ├── api/auth/
│   │   │   └── session.test.ts
│   │   └── api/calculators/
│   │       └── save.test.ts
│   │
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── calculators.spec.ts
│   │   └── user-journey.spec.ts
│   │
│   └── fixtures/
│       ├── users.ts
│       ├── calculators.ts
│       └── database.ts
│
├── jest.config.js
├── jest.setup.ts
└── playwright.config.ts
```

---

**Document Control**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 2026 | Initial test strategy - tailored for Next.js, Supabase, TypeScript stack |

**Next Review**: After Sprint 2 implementation (end of May 2026)
