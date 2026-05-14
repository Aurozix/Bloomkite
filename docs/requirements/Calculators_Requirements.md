# Financial Calculators - Detailed Requirements Document

**Document Purpose**: Complete specifications for all 15 financial calculators in bloomkite platform  
**Use Case**: Development reference for rebuilding calculators with new tech stack  
**Scope**: Formulas, inputs, outputs, validations, business rules

---

## CALCULATOR INDEX

| # | Name | Category | Complexity | Status |
|---|------|----------|-----------|--------|
| 1 | Goal Planner | Savings/Goals | Medium | Active |
| 2 | Cash Flow Analyzer | Budget/Liquidity | Medium | Active |
| 3 | Net Worth Calculator | Assets/Liability | Low | Active |
| 4 | Priority Ranker | Goals/Planning | Low | Active |
| 5 | Insurance Needs | Insurance | Low | Active |
| 6 | Risk Profiler | Investment | Medium | Active |
| 7 | Future Value | Investments | Low | Active |
| 8 | Target Value | Investments | Low | Active |
| 9 | Rate Finder | Investments | Low | Active |
| 10 | Tenure Finder | Investments | Low | Active |
| 11 | EMI Calculator | Loans | Medium | Active |
| 12 | EMI Capacity | Loans | High | Active |
| 13 | Partial Payment | Loans | High | Active |
| 14 | EMI Change Impact | Loans | High | Active |
| 15 | Rate Change Impact | Loans | High | Active |

---

## 1. GOAL PLANNER CALCULATOR

**Category**: Savings & Goals Planning  
**Endpoint**: `POST /calculateGoal`  
**Complexity**: Medium  
**Use Case**: Calculate monthly/annual investment needed to achieve a financial goal

---

### 1.1 BUSINESS LOGIC

**Scenario**: An investor wants to save ₹50 lakhs for a home down payment in 10 years, considering inflation of 5% per annum and existing savings of ₹10 lakhs growing at 8% per annum.

**What happens**:
1. Current ₹10L grows at 8% for 10 years → becomes more valuable
2. Target ₹50L is inflated at 5% for 10 years → costs more due to inflation
3. Gap = Inflated target - Grown current savings
4. Monthly investment needed fills this gap

---

### 1.2 INPUT REQUIREMENTS

| Field | Type | Range | Required | Example |
|-------|------|-------|----------|---------|
| `goalName` | String | Max 100 chars | Yes | "Home Down Payment" |
| `goalAmount` | Double | > 0 | Yes | 5000000 (₹50L) |
| `tenure` | Integer | 1-60 | Yes | 10 |
| `tenureType` | String | MONTH, YEAR | Yes | "YEAR" |
| `inflationRate` | Double | 0-20 | Yes | 5.0 (5% p.a.) |
| `currentAmount` | Double | >= 0 | Yes | 1000000 (₹10L) |
| `growthRate` | Double | 0-30 | Yes | 8.0 (8% p.a.) |
| `annualInvestmentRate` | Double | 0-30 | Yes | 10.0 (10% p.a.) |

---

### 1.3 PROCESSING & FORMULAS

**Step 1: Convert tenure to years**
```
tenureYears = (tenureType == "YEAR") ? tenure : tenure / 12
```

**Step 2: Calculate future cost (goal amount adjusted for inflation)**
```
futureCost = goalAmount × (1 + inflationRate/100)^tenureYears
```

**Example**: ₹50L * (1.05)^10 = ₹81,44,745

**Step 3: Calculate future value of current investment**
```
futureValue = currentAmount × (1 + growthRate/100)^tenureYears
```

**Example**: ₹10L * (1.08)^10 = ₹21,58,925

**Step 4: Calculate gap to be filled**
```
finalCorpus = futureCost - futureValue
```

**Example**: ₹81,44,745 - ₹21,58,925 = ₹59,85,820

**Step 5: Calculate monthly investment needed**
```
monthlyRate = annualInvestmentRate / 100 / 12
numMonths = tenureYears × 12

monthlyInv = finalCorpus / [Σ (1 + monthlyRate)^-n for n=1 to numMonths]
           = finalCorpus × monthlyRate × (1 + monthlyRate)^numMonths / 
             ((1 + monthlyRate)^numMonths - 1)
```

**Step 6: Calculate annual investment**
```
annualInv = monthlyInv × 12
```

---

### 1.4 OUTPUT SPECIFICATION

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `futureCost` | Double | Goal amount inflated to future date | 8,144,745 |
| `futureValue` | Double | Current investment grown over tenure | 2,158,925 |
| `finalCorpus` | Double | Gap to be filled with new investments | 5,985,820 |
| `monthlyInv` | Double | Monthly investment required | 44,124.56 |
| `annualInv` | Double | Annual investment required | 529,495 |
| `rateOfReturn` | Double | Monthly rate (for reference) | 0.00833 |

**Output Format**: All amounts to 2 decimal places

---

### 1.5 VALIDATIONS & CONSTRAINTS

✓ **Must Validate**:
- `goalAmount` > 0
- `tenure` between 1 and 60
- `inflationRate` between 0 and 20
- `currentAmount` >= 0
- `growthRate` between 0 and 30
- `annualInvestmentRate` between 0 and 30

✓ **Edge Cases**:
- currentAmount = 0: No current savings
- inflationRate = 0: No inflation considered
- growthRate = 0: Savings don't earn returns
- tenure = 1: Single year goal

---

### 1.6 BUSINESS RULES

| Rule | Logic |
|------|-------|
| **Minimum Tenure** | At least 1 month |
| **Maximum Tenure** | 60 years (practical limit) |
| **Inflation Assumption** | Applied annually on goal amount |
| **Growth Assumption** | Applied annually on current investment |
| **Investment Timing** | Assumed monthly investments at month start |
| **Interest Compounding** | Monthly compounding on new investments |

---

## 2. CASH FLOW ANALYZER

**Category**: Budget & Liquidity Analysis  
**Endpoint**: `POST /calculateCashFlow`  
**Complexity**: Medium  
**Use Case**: Analyze monthly and annual income vs expenses

---

### 2.1 BUSINESS LOGIC

**Scenario**: Investor tracks monthly income and expenses to understand cash position - can they save money or are they in deficit?

**What happens**:
1. Sum all recurring income (salary, rental, dividends)
2. Sum all recurring expenses (rent, groceries, utilities, loans)
3. Calculate net cash flow (income - expenses)
4. Project to annual basis

---

### 2.2 INPUT REQUIREMENTS

```json
{
  "referenceId": "INV123",
  "date": "2024-05-15",
  "cashFlowItemReq": [
    {
      "cashFlowItemId": 1,
      "actualAmt": 50000,
      "budgetAmt": 50000,
      "isRecurring": true,
      "type": "INCOME"
    },
    {
      "cashFlowItemId": 2,
      "actualAmt": 15000,
      "budgetAmt": 15000,
      "isRecurring": true,
      "type": "EXPENSE"
    }
  ]
}
```

**Field Details**:

| Field | Type | Description | Valid Values |
|-------|------|-------------|---------------|
| `referenceId` | String | User identifier | Any valid user ID |
| `date` | String | Calculation reference date | Any valid date |
| `cashFlowItemId` | Long | Category identifier | From master data |
| `actualAmt` | Double | Actual amount for the month | Any positive number |
| `budgetAmt` | Double | Budgeted amount | Any positive number |
| `isRecurring` | Boolean | Is this recurring/monthly | true/false |
| `type` | String | Income or Expense | "INCOME", "EXPENSE" |

---

### 2.3 PROCESSING & FORMULAS

**Step 1: Filter recurring items**
```
recurringIncome = SUM(actualAmt where type="INCOME" AND isRecurring=true)
recurringExpense = SUM(actualAmt where type="EXPENSE" AND isRecurring=true)
```

**Step 2: Calculate monthly cash flow**
```
monthlyNetCashFlow = recurringIncome - recurringExpense
```

**Step 3: Project to annual**
```
yearlyIncome = recurringIncome × 12
yearlyExpense = recurringExpense × 12
yearlyNetCashFlow = monthlyNetCashFlow × 12
```

---

### 2.4 OUTPUT SPECIFICATION

| Field | Type | Description | Logic |
|-------|------|-------------|-------|
| `monthlyIncome` | Double | Sum of recurring monthly income | SUM of income items |
| `yearlyIncome` | Double | Projected annual income | monthlyIncome × 12 |
| `monthlyExpense` | Double | Sum of recurring monthly expenses | SUM of expense items |
| `yearlyExpense` | Double | Projected annual expense | monthlyExpense × 12 |
| `monthlyNetCashFlow` | Double | Monthly surplus/deficit | monthlyIncome - monthlyExpense |
| `yearlyNetCashFlow` | Double | Annual surplus/deficit | yearlyIncome - yearlyExpense |

**Interpretation**:
- Positive value = Surplus (can save/invest)
- Negative value = Deficit (spending more than earning)
- Zero = Break-even

---

### 2.5 VALIDATIONS

✓ **Must Validate**:
- All amounts >= 0
- At least one income item exists
- At least one expense item exists
- Type is either "INCOME" or "EXPENSE"

✓ **Business Rules**:
- Only recurring items counted (non-recurring ignored)
- Both actual and budget tracked separately
- Can be used for budget vs actual analysis

---

## 3. NET WORTH CALCULATOR

**Category**: Assets & Liabilities  
**Endpoint**: `POST /calculateNetworth`  
**Complexity**: Low  
**Use Case**: Calculate total net worth (assets - liabilities)

---

### 3.1 BUSINESS LOGIC

**Scenario**: Track all personal assets (home, car, investments, cash) and liabilities (mortgages, loans, credit cards) to get true net worth picture.

**Categories**:
- **Assets**: Emergency Fund, Equity Shares, Mutual Funds, Fixed Deposits, Retirement Funds, Real Estate, Gold
- **Liabilities**: Home Loan, Car Loan, Personal Loans, Credit Card Debt

---

### 3.2 INPUT REQUIREMENTS

```json
{
  "referenceId": "INV123",
  "networthReq": [
    {
      "accountEntryId": 1,
      "itemName": "Home",
      "value": 5000000,
      "futureValue": 5500000,
      "type": "ASSET"
    },
    {
      "accountEntryId": 8,
      "itemName": "Home Loan",
      "value": 2000000,
      "futureValue": 1800000,
      "type": "LIABILITY"
    }
  ]
}
```

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `accountEntryId` | Long | Category ID from master data | 1, 2, 8, etc. |
| `itemName` | String | Name of asset/liability | "Home", "Car" |
| `value` | Double | Current value | 5000000 |
| `futureValue` | Double | Projected future value | 5500000 |
| `type` | String | ASSET or LIABILITY | "ASSET" |

---

### 3.3 PROCESSING & FORMULAS

**Step 1: Sum current assets**
```
currentAssetValue = SUM(value where type="ASSET")
```

**Step 2: Sum current liabilities**
```
currentLiability = SUM(value where type="LIABILITY")
```

**Step 3: Calculate current net worth**
```
currentNetworth = currentAssetValue - currentLiability
```

**Step 4: Project future values**
```
futureAssetValue = SUM(futureValue where type="ASSET")
futureLIABILITY = SUM(futureValue where type="LIABILITY")
```

**Step 5: Calculate future net worth**
```
futureNetworth = futureAssetValue - futureLIABILITY
```

**Step 6: Calculate wealth growth**
```
wealthGrowth = futureNetworth - currentNetworth
growthRate = (wealthGrowth / currentNetworth) × 100%
```

---

### 3.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `currentAssetValue` | Double | Total current assets |
| `currentLiability` | Double | Total current liabilities |
| `currentNetworth` | Double | Current net worth (assets - liabilities) |
| `futureAssetValue` | Double | Projected future assets |
| `futureLIABILITY` | Double | Projected future liabilities |
| `futureNetworth` | Double | Projected future net worth |
| `wealthGrowth` | Double | Increase in net worth |
| `growthPercentage` | Double | % growth in net worth |

---

### 3.5 NET WORTH CATEGORIES

**Standard Asset Categories**:
1. Emergency Fund (Cash reserves)
2. Equity Shares (Stock holdings)
3. Fixed Deposits (FDs)
4. Retirement Funds (401k, pension)
5. Mutual Funds
6. Real Estate (properties)
7. Gold/Precious Metals
8. Other Assets

**Standard Liability Categories**:
1. Home Loan Outstanding
2. Car Loan Outstanding
3. Personal Loan Outstanding
4. Credit Card Debt
5. Other Liabilities

---

## 4. PRIORITY RANKER

**Category**: Goals & Planning  
**Endpoint**: `POST /calculatePriorities`  
**Complexity**: Low  
**Use Case**: Rank financial goals by urgency

---

### 4.1 BUSINESS LOGIC

**Scenario**: Investor has 5 financial goals but limited resources. System ranks them by urgency to show which goals to focus on first.

**Ranking Logic**:
1. Primary: Sort by urgency level (1=highest urgency, 9=lowest)
2. Secondary: Alphabetical order within same urgency

---

### 4.2 INPUT REQUIREMENTS

```json
{
  "referenceId": "INV123",
  "priorityReq": [
    {
      "priorityItemId": 1,
      "itemName": "Education Fund",
      "urgencyId": 2
    },
    {
      "priorityItemId": 2,
      "itemName": "Retirement",
      "urgencyId": 5
    },
    {
      "priorityItemId": 3,
      "itemName": "Emergency Fund",
      "urgencyId": 1
    }
  ]
}
```

| Field | Type | Description | Valid Values |
|-------|------|-------------|---------------|
| `priorityItemId` | Long | Goal/item ID | Any valid ID |
| `itemName` | String | Goal description | Any string |
| `urgencyId` | Integer | Urgency level | 1-9 (1=highest) |

---

### 4.3 PROCESSING & FORMULA

**Sorting Algorithm**:
```
1. Sort by urgencyId (ascending - lower ID = higher priority)
2. If urgencyId same, sort by itemName (alphabetical)

Result: Ordered list with priority rank
```

---

### 4.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `priorityOrder` | Integer | Ranking (1=highest priority) |
| `priorityItem` | String | Goal name |
| `urgency` | String | Urgency level description |
| `urgencyId` | Integer | Urgency ID |

**Example Output**:
```
Priority 1: Emergency Fund (Urgency: Critical - ID: 1)
Priority 2: Education Fund (Urgency: High - ID: 2)
Priority 3: Retirement (Urgency: Medium - ID: 5)
```

---

## 5. INSURANCE NEEDS CALCULATOR

**Category**: Insurance Planning  
**Endpoint**: `POST /calculateInsurance`  
**Complexity**: Low  
**Use Case**: Determine required life insurance coverage

---

### 5.1 BUSINESS LOGIC

**Scenario**: Determine how much life insurance is needed based on income stability and predictability.

**Concept**: 
- More stable/predictable income = lower multiplier
- Less stable/unpredictable income = higher multiplier
- Coverage is multiple of annual income

---

### 5.2 INPUT REQUIREMENTS

| Field | Type | Description | Valid Values |
|-------|------|-------------|---------------|
| `referenceId` | String | User ID | Any user ID |
| `annualIncome` | Double | Annual income | > 0 |
| `stability` | String | Income stability | "STABLE", "FLUCTUATING" |
| `predictability` | String | Income predictability | "PREDICTABLE", "UNPREDICTABLE" |
| `existingInsurance` | Double | Current insurance coverage | >= 0 |

---

### 5.3 PROCESSING & FORMULAS

**Step 1: Determine coverage multiplier**

| Stability | Predictability | Multiplier |
|-----------|---|-----------|
| STABLE | PREDICTABLE | 10x |
| STABLE | UNPREDICTABLE | 15x |
| FLUCTUATING | PREDICTABLE | 10x |
| FLUCTUATING | UNPREDICTABLE | 15x |

**Logic**:
```javascript
if (stability == "STABLE" && predictability == "PREDICTABLE") {
  multiplier = 10;
} else if (stability == "STABLE" && predictability == "UNPREDICTABLE") {
  multiplier = 15;
} else if (stability == "FLUCTUATING" && predictability == "PREDICTABLE") {
  multiplier = 10;
} else if (stability == "FLUCTUATING" && predictability == "UNPREDICTABLE") {
  multiplier = 15;
}
```

**Step 2: Calculate required insurance**
```
requiredInsurance = annualIncome × multiplier
```

**Step 3: Calculate gap**
```
additionalInsurance = requiredInsurance - existingInsurance
```

---

### 5.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `requiredInsurance` | Double | Total insurance needed |
| `additionalInsurance` | Double | Insurance gap to cover |
| `coverageMultiplier` | Integer | Multiplier used (10x or 15x) |
| `existingInsurance` | Double | Current coverage (echoed) |

**Example**:
- Annual Income: ₹10L
- Stability: FLUCTUATING, Predictability: UNPREDICTABLE
- Multiplier: 15x
- Required Insurance: ₹1.5Cr
- Existing Insurance: ₹25L
- Gap: ₹1.25Cr

---

## 6. RISK PROFILER

**Category**: Investment Planning  
**Endpoint**: `POST /calculateRiskProfile`  
**Complexity**: Medium  
**Use Case**: Assess risk tolerance and recommend asset allocation

---

### 6.1 BUSINESS LOGIC

**Scenario**: Investor answers questionnaire about financial knowledge, investment experience, and risk appetite. System calculates risk score and recommends portfolio allocation.

**Risk Scoring**:
- Multiple-choice questions
- Each answer has point value
- Total score maps to risk category
- Category maps to asset allocation %

---

### 6.2 INPUT REQUIREMENTS

```json
{
  "referenceId": "INV123",
  "riskProfileReq": [
    {
      "questionId": "Q1",
      "questionText": "What is your investment experience?",
      "answerId": 3,
      "answerText": "5+ years",
      "pointValue": 5
    },
    {
      "questionId": "Q2",
      "questionText": "Can you handle 30% portfolio loss?",
      "answerId": 2,
      "answerText": "Yes",
      "pointValue": 10
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `questionId` | String | Question identifier |
| `answerId` | Long | Answer selected |
| `pointValue` | Integer | Points awarded for answer |

---

### 6.3 SCORING & CATEGORIES

**Risk Score Calculation**:
```
totalRiskScore = SUM(pointValue for all answers)
```

**Risk Categories**:

| Score Range | Category | Equity | Debt | Cash |
|---|---|---|---|---|
| 0-30 | Conservative | 30% | 50% | 20% |
| 31-40 | Moderately Conservative | 40% | 45% | 15% |
| 41-51 | Moderate | 50% | 40% | 10% |
| 52-61 | Moderately Aggressive | 65% | 30% | 5% |
| 62+ | Aggressive | 80% | 15% | 5% |

---

### 6.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `riskScore` | Integer | Total calculated score |
| `behaviour` | String | Risk category name |
| `eqty_alloc` | Double | Equity allocation % |
| `debt_alloc` | Double | Debt allocation % |
| `cash_alloc` | Double | Cash allocation % |
| `description` | String | Category description |

**Validation**: `eqty_alloc + debt_alloc + cash_alloc == 100%`

---

## 7. FUTURE VALUE CALCULATOR

**Category**: Investment Growth  
**Endpoint**: `POST /IP-FutureValue`  
**Complexity**: Low  
**Use Case**: Calculate future value of lump sum investment

---

### 7.1 BUSINESS LOGIC

**Scenario**: Investor has ₹10L to invest for 10 years at 12% annual return. What will it grow to?

**Formula**: `FV = PV × (1 + r)^n`

---

### 7.2 INPUT REQUIREMENTS

| Field | Type | Description | Valid Values |
|-------|------|-------------|---------------|
| `referenceId` | String | User ID | Any user ID |
| `invAmount` | Double | Initial investment | > 0 |
| `annualGrowth` | Double | Annual growth rate % | 0-100 |
| `duration` | Integer | Investment period | 1-100 |
| `durationType` | String | MONTH or YEAR | "MONTH", "YEAR" |
| `invType` | String | LUMSUM (SIP commented out) | "LUMSUM" |

---

### 7.3 PROCESSING & FORMULAS

**Step 1: Convert duration to years**
```
durationYears = (durationType == "YEAR") ? duration : duration / 12
```

**Step 2: Calculate future value (lump sum)**
```
rate = annualGrowth / 100
futureValue = invAmount × (1 + rate)^durationYears
```

**Example**:
- Investment: ₹10,00,000
- Rate: 12% p.a.
- Duration: 10 years
- FV = 10,00,000 × (1.12)^10 = 31,05,846

---

### 7.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `totalPayment` | Double | Future value after growth |
| `gain` | Double | Profit (FV - PV) |
| `gainPercentage` | Double | % gain |
| `invAmount` | Double | Initial investment (echoed) |
| `investmentPeriod` | String | Period description |

---

## 8. TARGET VALUE CALCULATOR

**Category**: Investment Planning  
**Endpoint**: `POST /IP-TargetValue`  
**Complexity**: Low  
**Use Case**: Calculate investment needed to achieve a target amount

---

### 8.1 BUSINESS LOGIC

**Scenario**: Investor needs ₹50L after 10 years. If they can get 12% annual return, how much should they invest today?

**Formula**: `PV = FV / (1 + r)^n`

---

### 8.2 INPUT REQUIREMENTS

| Field | Type | Description | Valid Values |
|-------|------|-------------|---------------|
| `referenceId` | String | User ID | Any user ID |
| `futureValue` | Double | Target amount needed | > 0 |
| `rateOfInterest` | Double | Expected annual return % | 0-100 |
| `duration` | Integer | Investment period | 1-100 |
| `durationType` | String | MONTH or YEAR | "MONTH", "YEAR" |

---

### 8.3 PROCESSING & FORMULAS

**Step 1: Convert duration**
```
durationYears = (durationType == "YEAR") ? duration : duration / 12
```

**Step 2: Calculate required investment**
```
rate = rateOfInterest / 100
presentValue = futureValue / (1 + rate)^durationYears
```

**Example**:
- Target: ₹50,00,000
- Rate: 12% p.a.
- Duration: 10 years
- PV = 50,00,000 / (1.12)^10 = 16,07,417

---

### 8.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `totalPayment` | Double | Investment needed today |
| `futureValue` | Double | Target amount (echoed) |
| `gain` | Double | Expected gain |
| `investmentPeriod` | String | Period description |

---

## 9. RATE FINDER CALCULATOR

**Category**: Investment Analysis  
**Endpoint**: `POST /IP-RateFinder`  
**Complexity**: Low  
**Use Case**: Find required rate of return

---

### 9.1 BUSINESS LOGIC

**Scenario**: Investor has ₹10L today and wants ₹31L after 10 years. What annual return rate is needed?

**Formula**: `r = (FV/PV)^(1/n) - 1`

---

### 9.2 INPUT REQUIREMENTS

| Field | Type | Description | Valid Values |
|-------|------|-------------|---------------|
| `referenceId` | String | User ID | Any user ID |
| `presentValue` | Double | Current amount | > 0 |
| `futureValue` | Double | Target amount | > presentValue |
| `duration` | Integer | Time period | 1-100 |
| `durationType` | String | MONTH or YEAR | "MONTH", "YEAR" |

---

### 9.3 PROCESSING & FORMULAS

**Step 1: Convert duration**
```
durationYears = (durationType == "YEAR") ? duration : duration / 12
```

**Step 2: Calculate required rate**
```
rate = ((futureValue / presentValue)^(1/durationYears) - 1) × 100
```

**Example**:
- Present Value: ₹10,00,000
- Future Value: ₹31,05,846
- Duration: 10 years
- Rate = ((31,05,846 / 10,00,000)^(1/10) - 1) × 100 = 12%

---

### 9.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `rateOfInterest` | Double | Required annual rate % |
| `presentValue` | Double | Current amount (echoed) |
| `futureValue` | Double | Target amount (echoed) |

---

## 10. TENURE FINDER CALCULATOR

**Category**: Investment Planning  
**Endpoint**: `POST /IP-TenureFinder`  
**Complexity**: Low  
**Use Case**: Calculate time needed to reach target amount

---

### 10.1 BUSINESS LOGIC

**Scenario**: Investor has ₹10L and expects 12% return. How long to reach ₹31L?

**Formula**: `n = log(FV/PV) / log(1+r)`

---

### 10.2 INPUT REQUIREMENTS

| Field | Type | Description | Valid Values |
|-------|------|-------------|---------------|
| `referenceId` | String | User ID | Any user ID |
| `presentValue` | Double | Current amount | > 0 |
| `futureValue` | Double | Target amount | > presentValue |
| `rateOfInterest` | Double | Annual return rate % | 0-100 |

---

### 10.3 PROCESSING & FORMULAS

**Step 1: Calculate tenure**
```
rate = rateOfInterest / 100
tenure = log(futureValue / presentValue) / log(1 + rate)
```

**Example**:
- Present Value: ₹10L
- Future Value: ₹31L
- Rate: 12%
- Tenure = log(3.1) / log(1.12) = 9.69 years ≈ 10 years

---

### 10.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `tenure` | Double | Years needed |
| `tenureMonths` | Double | Total months |
| `presentValue` | Double | Current amount (echoed) |
| `futureValue` | Double | Target amount (echoed) |

---

## 11. EMI CALCULATOR

**Category**: Loan Analysis  
**Endpoint**: `POST /calculateEmi`  
**Complexity**: Medium  
**Use Case**: Calculate loan EMI and generate amortization schedule

---

### 11.1 BUSINESS LOGIC

**Scenario**: Home loan of ₹30L at 8% interest for 20 years. What's the monthly EMI and how much interest will be paid?

**Key Outputs**:
- Monthly EMI amount
- Total interest paid
- Amortization schedule (month-by-month breakdown)

---

### 11.2 INPUT REQUIREMENTS

| Field | Type | Description | Valid Values |
|-------|------|-------------|---------------|
| `loanAmount` | Double | Principal loan amount | > 0 |
| `tenure` | Integer | Loan duration | 1-60 |
| `tenureType` | String | MONTH or YEAR | "MONTH", "YEAR" |
| `interestRate` | Double | Annual interest rate % | 0-30 |
| `date` | String | Loan start date | MMM-yyyy format |

---

### 11.3 PROCESSING & FORMULAS

**Step 1: Convert tenure to months**
```
nMonths = (tenureType == "YEAR") ? tenure × 12 : tenure
```

**Step 2: Calculate monthly interest rate**
```
monthlyRate = interestRate / 100 / 12
```

**Step 3: Calculate EMI**
```
EMI = loanAmount × [monthlyRate × (1 + monthlyRate)^nMonths] / 
      [(1 + monthlyRate)^nMonths - 1]
```

**Example**:
- Loan: ₹30,00,000
- Rate: 8% p.a. (0.667% monthly)
- Tenure: 20 years (240 months)
- EMI = 30,00,000 × [0.00667 × (1.00667)^240] / [(1.00667)^240 - 1]
- EMI ≈ ₹27,748

**Step 4: Generate amortization schedule**

For each month:
```
Interest = Opening Balance × monthlyRate
Principal = EMI - Interest
Closing = Opening - Principal
```

**Step 5: Calculate totals**
```
totalInterest = (EMI × nMonths) - loanAmount
totalPayable = loanAmount + totalInterest
```

---

### 11.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `emi` | Double | Monthly EMI amount |
| `interestPayable` | Double | Total interest over loan life |
| `total` | Double | Total amount payable |
| `loanAmount` | Double | Principal (echoed) |
| `tenure` | Integer | Tenure in months |
| `rate` | Double | Annual interest rate |
| `amortisationResponse` | Array | Month-by-month details |

**Amortization Details (each month)**:

| Field | Description |
|-------|-------------|
| `monthNumber` | Month sequence |
| `date` | Payment date |
| `openingBalance` | Loan balance at month start |
| `interest` | Interest portion of EMI |
| `principal` | Principal portion of EMI |
| `closingBalance` | Loan balance at month end |
| `loanPaid` | % of loan paid off |
| `totalPaid` | Cumulative amount paid |

---

### 11.5 EXAMPLE OUTPUT

```
Monthly EMI: ₹27,748.12
Total Interest: ₹36,63,747.68
Total Payable: ₹66,63,747.68

Month | Opening Balance | Interest | Principal | Closing Balance | % Paid
------|-----------------|----------|-----------|-----------------|-------
1     | 30,00,000       | 20,000   | 7,748     | 29,92,252      | 0.26%
2     | 29,92,252       | 19,948   | 7,800     | 29,84,452      | 0.52%
...   | ...             | ...      | ...       | ...            | ...
240   | 27,666          | 185      | 27,563    | 0              | 100%
```

---

## 12. EMI CAPACITY CALCULATOR

**Category**: Loan Affordability  
**Endpoint**: `POST /calculateEmiCapacity`  
**Complexity**: High  
**Use Case**: Determine maximum affordable loan amount

---

### 12.1 BUSINESS LOGIC

**Scenario**: Investor is 35 years old, earns ₹10L/year, has ₹5L existing EMI, spends ₹4L/year on expenses. How much additional loan can they afford?

**Concept**:
- Calculate available monthly surplus
- Adjust for stability (stable income can borrow more)
- Apply maximum tenure (20 years typical for home loans)
- Convert to affordable loan amount at market rates

---

### 12.2 INPUT REQUIREMENTS

| Field | Type | Description | Valid Values |
|-------|------|-------------|---------------|
| `currentAge` | Integer | Current age | 18-75 |
| `retirementAge` | Integer | Retirement age | currentAge+1 to 75 |
| `netFamilyIncome` | Double | Monthly family income | > 0 |
| `existingEmi` | Double | Current EMI obligations | >= 0 |
| `houseHoldExpense` | Double | Monthly household expenses | > 0 |
| `additionalIncome` | Double | Other income sources | >= 0 |
| `stability` | String | Income stability | "HIGH", "MEDIUM" |
| `backUp` | String | Emergency backup available | "YES", "NO" |
| `interestRate` | Double | Current lending rate % | 5-15 |

---

### 12.3 PROCESSING & FORMULAS

**Step 1: Calculate available monthly surplus**
```
monthlySurplus = netFamilyIncome - existingEmi - houseHoldExpense
```

**Step 2: Adjust for stability & backup**

| Stability | Backup | Multiplier |
|-----------|--------|-----------|
| HIGH | YES | 100% |
| MEDIUM | YES | 90% |
| HIGH | NO | 90% |
| MEDIUM | NO | 80% |

```
adjustedSurplus = monthlySurplus × multiplier
```

**Step 3: Add additional income**
```
emiCapacity = adjustedSurplus + additionalIncome
```

**Step 4: Calculate maximum loan tenure**
```
maxTenure = min(20, retirementAge - currentAge)
tenureMonths = maxTenure × 12
```

**Step 5: Calculate maximum loan amount**
```
monthlyRate = interestRate / 100 / 12
maxLoanAmount = emiCapacity × [(1 + monthlyRate)^tenureMonths - 1] / 
                [monthlyRate × (1 + monthlyRate)^tenureMonths]
```

---

### 12.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `surplusMoney` | Double | Gross monthly surplus (before adjustments) |
| `surplus` | Double | Adjusted surplus (after stability factor) |
| `emiCapacity` | Double | Total EMI capacity |
| `termOfLoan` | Double | Maximum loan tenure in years |
| `advisableLoanAmount` | Double | Maximum affordable loan |
| `monthlyEmiAffordable` | Double | Max monthly EMI affordable |

**Business Rules**:
- EMI should not exceed 40-50% of gross income
- Tenure capped at 20 years (standard home loan max)
- Includes buffer for stability of income

---

### 12.5 EXAMPLE CALCULATION

**Given**:
- Monthly Income: ₹83,333 (₹10L annual)
- Existing EMI: ₹5,000
- Household Expense: ₹33,333
- Stability: HIGH, Backup: YES (100% multiplier)
- Interest Rate: 8%
- Age: 35, Retirement: 65 (30 years max)

**Calculation**:
- Gross Surplus: ₹83,333 - ₹5,000 - ₹33,333 = ₹45,000
- Adjusted: ₹45,000 × 100% = ₹45,000
- Max Tenure: min(20, 30) = 20 years = 240 months
- Max Loan: ₹45,000 × [(1.00667)^240 - 1] / [0.00667 × (1.00667)^240]
- Max Loan ≈ ₹48,45,000 (≈ ₹48.45L)

---

## 13. PARTIAL PAYMENT CALCULATOR

**Category**: Loan Optimization  
**Endpoint**: `POST /calculatePartialPayment`  
**Complexity**: High  
**Use Case**: Impact of early/partial payments on loan tenure

---

### 13.1 BUSINESS LOGIC

**Scenario**: Home loan ₹30L at 8%. After 5 years, investor gets bonus of ₹5L. What happens if they make partial payment?

**Impact**:
- Reduces principal outstanding
- Tenure reduces significantly
- Interest saved
- New amortization schedule generated

---

### 13.2 INPUT REQUIREMENTS

```json
{
  "loanAmount": 3000000,
  "interestRate": 8,
  "tenure": 20,
  "tenureType": "YEAR",
  "loanDate": "Jan-2024",
  "partialPaymentReq": [
    {
      "partPayDate": "Jun-2029",
      "partPayAmount": 500000
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `loanAmount` | Double | Original loan amount |
| `interestRate` | Double | Annual interest rate % |
| `tenure` | Integer | Original tenure |
| `loanDate` | String | Loan start date (MMM-yyyy) |
| `partPayDate` | String | Date of partial payment |
| `partPayAmount` | Double | Amount being prepaid |

---

### 13.3 PROCESSING & FORMULAS

**Step 1: Generate original amortization schedule** (same as EMI Calculator)

**Step 2: For each partial payment date:**
- Identify month in schedule
- Calculate outstanding principal at that date
- Reduce principal by partial payment amount
- Recalculate remaining tenure with new outstanding

**Step 3: Generate revised schedule**

**Formula for new tenure after partial payment**:
```
newOutstanding = previousOutstanding - partialPayment
monthlyRate = interestRate / 100 / 12
newMonthsRemaining = -log(1 - (newOutstanding × monthlyRate / sameEMI)) / 
                     log(1 + monthlyRate)
```

---

### 13.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `originalTenure` | Double | Original tenure in years |
| `revisedTenure` | Double | New tenure after partial payment |
| `tenureReduction` | Double | Months/years saved |
| `interestSaved` | Double | Interest saved due to prepayment |
| `totalInterestNow` | Double | Revised total interest |
| `newAmortisation` | Array | Revised month-by-month schedule |

---

## 14. EMI CHANGE IMPACT CALCULATOR

**Category**: Loan Optimization  
**Endpoint**: `POST /calculateEmiChange`  
**Complexity**: High  
**Use Case**: Impact of increasing EMI during loan tenure

---

### 14.1 BUSINESS LOGIC

**Scenario**: Home loan with ₹27,748 EMI. After 5 years, investor wants to increase EMI to ₹35,000 to pay off loan faster. What's the new tenure?

---

### 14.2 INPUT REQUIREMENTS

```json
{
  "loanAmount": 3000000,
  "interestRate": 8,
  "tenure": 20,
  "loanDate": "Jan-2024",
  "emiChangeReq": [
    {
      "emiChangedDate": "Jun-2029",
      "increasedEmi": 35000
    }
  ]
}
```

---

### 14.3 PROCESSING & FORMULAS

**Step 1**: Generate original amortization schedule

**Step 2**: At EMI change date:
- Find outstanding principal
- Calculate new tenure with increased EMI

**Formula**:
```
newMonthlyRate = interestRate / 100 / 12
outstandingAtChangeDate = previousOutstanding
newMonthsRemaining = -log(1 - (outstanding × monthlyRate / newEMI)) / 
                     log(1 + monthlyRate)
newTenureYears = newMonthsRemaining / 12
```

---

### 14.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `originalTenure` | Double | Original tenure in years |
| `revisedTenure` | Double | New tenure after EMI increase |
| `revisedEmi` | Double | New EMI amount |
| `tenureReduction` | Double | Time saved (years/months) |
| `interestSaved` | Double | Interest saved |
| `newAmortisation` | Array | Revised schedule |

---

## 15. INTEREST RATE CHANGE CALCULATOR

**Category**: Loan Analysis  
**Endpoint**: `POST /calculateInterestChange`  
**Complexity**: High  
**Use Case**: Impact of interest rate changes during loan tenure

---

### 15.1 BUSINESS LOGIC

**Scenario**: Home loan with 8% interest rate. After 5 years, RBI cuts rates to 7%. What's the impact on tenure and interest?

**Two Approaches**:
- **Option A**: EMI constant, tenure reduces
- **Option B**: Tenure constant, EMI reduces

---

### 15.2 INPUT REQUIREMENTS

```json
{
  "loanAmount": 3000000,
  "interestRate": 8,
  "tenure": 20,
  "loanDate": "Jan-2024",
  "interestChangeReq": [
    {
      "interestChangedDate": "Jun-2029",
      "changedRate": 7.5
    }
  ]
}
```

---

### 15.3 PROCESSING & FORMULAS

**Approach A: Constant EMI (Tenure Adjusts)**

```
outstandingAtChangeDate = outstanding principal at rate change date
newRate = new interest rate
sameEMI = existing EMI amount

newMonthlyRate = newRate / 100 / 12
newMonthsRemaining = -log(1 - (outstanding × newMonthlyRate / sameEMI)) / 
                     log(1 + newMonthlyRate)
newTenureYears = newMonthsRemaining / 12
```

**Approach B: Constant Tenure (EMI Adjusts)**

```
newMonthlyRate = newRate / 100 / 12
remainingMonths = months left in tenure
newEMI = outstanding × [newMonthlyRate × (1 + newMonthlyRate)^remainingMonths] / 
         [(1 + newMonthlyRate)^remainingMonths - 1]
```

---

### 15.4 OUTPUT SPECIFICATION

| Field | Type | Description |
|-------|------|-------------|
| `revisedTenure` | Double | New tenure (if EMI constant) |
| `revisedEmi` | Double | New EMI (if tenure constant) |
| `tenureChange` | Double | Change in tenure (years) |
| `emiChange` | Double | Change in EMI (amount) |
| `interestSaved` | Double | Interest saved with rate change |
| `rateChangeType` | String | "TENURE_ADJUSTS" or "EMI_ADJUSTS" |
| `newAmortisation` | Array | Revised schedule |

---

## VALIDATION RULES (All Calculators)

✓ **Common Validations**:

| Validation | Rule | Error Message |
|---|---|---|
| Amount Check | All amounts > 0 | "Amount must be positive" |
| Rate Validation | 0 <= rate <= 100 | "Rate must be 0-100%" |
| Tenure Validation | 1 <= tenure <= 1000 | "Invalid tenure" |
| Date Format | MMM-yyyy format | "Invalid date format" |
| Tenure Type | MONTH or YEAR | "Invalid tenure type" |
| Decimal Places | Max 2 decimal places | Auto-rounded |

---

## OUTPUT FORMATTING STANDARDS

**All Amounts**:
- Rounded to 2 decimal places
- In base currency (assumed INR)
- Format: `String.format("%.2f", amount)`

**All Percentages**:
- 2 decimal places
- Example: 12.50%

**All Dates**:
- Input: MMM-yyyy (e.g., "Jan-2024")
- Output: DD-MMM-yyyy (e.g., "15-Jan-2024")

**Null Handling**:
- Null inputs: Return error response
- Null optional fields: Use default (0 for numbers, empty for strings)

---

## TESTING CHECKLIST

Before deploying each calculator:

- [ ] Happy path tests (normal scenario)
- [ ] Edge cases (zero values, max values)
- [ ] Boundary tests (min/max inputs)
- [ ] Formula accuracy verified manually
- [ ] Amortization totals match (no rounding errors)
- [ ] Date handling correct (month boundaries)
- [ ] Output decimals correct (2 places)
- [ ] Error messages meaningful
- [ ] Performance acceptable (<1 second)
- [ ] Results match Excel/expected values

---

## CALCULATOR INTERDEPENDENCIES

| Calculator | Depends On | Can Feed Into |
|---|---|---|
| Goal Planner | None | Financial Plan |
| Cash Flow | None | EMI Capacity, Priority |
| Net Worth | None | Financial Plan |
| Priorities | None | Plan, Goal Planner |
| Insurance | None | Financial Plan |
| Risk Profiler | None | Investment Plans |
| Future Value | None | Goal Calculator |
| Target Value | None | Savings Goals |
| Rate Finder | None | Investment Analysis |
| Tenure Finder | None | Savings Goals |
| EMI Calc | None | EMI Capacity |
| EMI Capacity | EMI, Cash Flow | Loan Planning |
| Partial Payment | EMI Calc | Revised Plan |
| EMI Change | EMI Calc | Revised Plan |
| Rate Change | EMI Calc | Revised Plan |

---

## IMPLEMENTATION NOTES FOR DEVELOPERS

1. **Database Schema**: Store calculation history for audit trail
2. **Caching**: Cache master data (rates, terms, categories)
3. **API Design**: Each calculator as separate endpoint (already designed)
4. **Error Handling**: Return meaningful error messages with codes
5. **Performance**: Pre-calculate amortization arrays, don't generate on-demand
6. **Security**: Validate all inputs, don't trust user data
7. **Precision**: Use high-precision numbers (BigDecimal) for financial calculations
8. **Localization**: Support multiple currencies and date formats

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Use For**: Development, QA Testing, Business Analysis