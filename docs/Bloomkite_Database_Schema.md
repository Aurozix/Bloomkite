# Bloomkite Database Schema Documentation

**Generated**: 2026-05-07  
**Database**: MySQL/MariaDB  
**Total Tables**: 60+ (15 core + supporting tables)

---

## Quick Reference: 15 Core Tables

| Layer | Table | Purpose |
|-------|-------|---------|
| **Users** | `investor` | Investor profiles |
| | `advisor` | Advisor profiles |
| | `party` | Party/user base for role management |
| | `admin` | Admin users |
| **Credentials** | `certificate` | Advisor certifications |
| | `education` | Advisor education |
| | `award` | Advisor awards |
| | `experience` | Advisor work experience |
| **Relationships** | `followers` | Advisor followers |
| | `invinterest` | Investor interests in products |
| **Financial Planning** | `goal` | Financial goals |
| | `plan` | Financial plans |
| | `cashflow` | Cash flow entries |
| **Content** | `articlepost` | Forum articles/posts |
| | `forumquery` | Forum Q&A queries |

---

## Detailed Table Schemas

### 1. INVESTOR (User Layer)

**Table**: `investor`  
**PK**: `invId` (VARCHAR(50))

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
invId               | VARCHAR(50)       | NO   |         | Primary Key
fullName            | VARCHAR(100)      | NO   |         | Full name
displayName         | VARCHAR(100)      | NO   |         | Display name
dob                 | VARCHAR(10)       | NO   |         | Date of birth (YYYY-MM-DD)
emailId             | VARCHAR(250)      | NO   |         | Email address
gender              | VARCHAR(1)        | NO   |         | M/F
password            | VARCHAR(100)      | NO   |         | Hashed password
userName            | VARCHAR(50)       |      |         | Username
phoneNumber         | VARCHAR(15)       |      |         | Phone number
pincode             | VARCHAR(6)        | NO   |         | Postal code
partyStatusId       | BIGINT(1)         |      |         | FK: party status
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
isVerified          | INT(11)           |      | 0       | Email verification status
verifiedBy          | VARCHAR(50)       |      | NULL    | Admin who verified
verified            | TIMESTAMP         |      | NULL    | Verification timestamp
isMobileVerified    | INT(2)            |      | 0       | Mobile verification status
created_by          | VARCHAR(50)       |      | NULL    | Created by user
updated_by          | VARCHAR(50)       |      | NULL    | Updated by user
```

**Related Tables**:
- `invinterest` (investor interests)
- `invriskprofile` (risk profile responses)
- `goal`, `cashflow`, `plan` (financial data)

---

### 2. ADVISOR (User Layer)

**Table**: `advisor`  
**PK**: `advId` (VARCHAR(20))

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
advId               | VARCHAR(20)       | NO   |         | Primary Key
advType             | INT(3)            | NO   | 0       | Advisor type (FK: advtypes)
name                | VARCHAR(100)      |      | NULL    | Advisor name
designation         | VARCHAR(100)      |      | NULL    | Professional designation
emailId             | VARCHAR(250)      |      | NULL    | Email address
password            | VARCHAR(50)       |      | NULL    | Hashed password
userName            | VARCHAR(50)       |      | NULL    | Username
phoneNumber         | VARCHAR(15)       |      | NULL    | Phone number
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
partyStatusId       | BIGINT(1)         | NO   | 0       | Party status
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
displayName         | VARCHAR(100)      |      | NULL    | Display name
dob                 | VARCHAR(10)       |      | NULL    | Date of birth
gender              | VARCHAR(1)        |      | NULL    | M/F
panNumber           | VARCHAR(10)       |      | NULL    | PAN (tax ID)
address1            | VARCHAR(300)      |      | NULL    | Primary address
address2            | VARCHAR(300)      |      | NULL    | Secondary address
state               | VARCHAR(50)       |      | NULL    | State
city                | VARCHAR(50)       |      | NULL    | City
pincode             | VARCHAR(6)        |      | NULL    | Postal code
aboutme             | VARCHAR(350)      |      | NULL    | Bio/about section
imagePath           | VARCHAR(350)      |      | NULL    | Profile image path
parentPartyId       | BIGINT(20)        | NO   | 0       | Parent party for corporate
firmType            | VARCHAR(200)      |      | NULL    | Firm type
corporateLabel      | VARCHAR(200)      |      | NULL    | Corporate label
website             | VARCHAR(200)      |      | NULL    | Website URL
isVerified          | INT(2)            |      | 0       | Email verification
verifiedBy          | VARCHAR(50)       |      | NULL    | Verified by
verified            | TIMESTAMP         |      | NULL    | Verification date
workFlowStatus      | INT(11)           |      | NULL    | Workflow status (FK: workflowstatus)
approvedDate        | TIMESTAMP         |      | NULL    | Approval date
approvedBy          | VARCHAR(50)       |      | NULL    | Approved by
revokedDate         | TIMESTAMP         |      | NULL    | Revocation date
revokedBy           | VARCHAR(50)       |      | NULL    | Revoked by
reason_for_revoked  | VARCHAR(150)      |      | NULL    | Revocation reason
isMobileVerified    | INT(2)            |      | 0       | Mobile verification
gst                 | VARCHAR(50)       |      | NULL    | GST number
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

**Related Tables**:
- `certificate`, `education`, `award`, `experience` (credentials)
- `advproduct` (products/expertise)
- `advbrandinfo`, `advbrandrank` (brand ratings)
- `followers` (follower tracking)
- `promotion` (video promotions)
- `public_advisor` (public profile copy)

---

### 3. PARTY (Role Management)

**Table**: `party`  
**PK**: `partyId` (BIGINT(20))

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
partyId             | BIGINT(20)        | NO   |         | Primary Key
partyStatusId       | INT(1)            |      | 0       | Status (active/inactive)
roleId              | INT(3)            |      | 0       | Role ID (FK: role)
roleBasedId         | VARCHAR(20)       |      | NULL    | Role-based ID
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
parentPartyId       | BIGINT(20)        |      | 0       | Parent party (hierarchical)
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
emailId             | VARCHAR(200)      |      | NULL    | Email
password            | VARCHAR(300)      |      | NULL    | Hashed password
userName            | VARCHAR(50)       |      | NULL    | Username
panNumber           | VARCHAR(10)       |      | NULL    | PAN
phoneNumber         | VARCHAR(10)       |      | NULL    | Phone
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

**Purpose**: Core party table linking advisors, investors, and admins to their roles and status.

**Related Tables**:
- `role` (role definitions)
- `user_role` (user-to-role mapping)

---

### 4. ADMIN (Admin Users)

**Table**: `admin`  
**PK**: `adminId` (VARCHAR(50))

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
adminId             | VARCHAR(50)       | NO   |         | Primary Key
emailId             | VARCHAR(250)      |      | NULL    | Admin email
name                | VARCHAR(100)      |      | NULL    | Admin name
partyStatusId       | BIGINT(1)         |      | NULL    | Status
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
password            | VARCHAR(50)       |      | NULL    | Hashed password
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

---

### 5. CERTIFICATE (Advisor Credentials)

**Table**: `certificate`  
**PK**: `certificateId` (BIGINT(10))  
**FK**: `advId` → `advisor`

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
certificateId       | BIGINT(10)        | NO   |         | Primary Key
imagePath           | VARCHAR(300)      |      | NULL    | Certificate image
issuedBy            | VARCHAR(100)      |      | NULL    | Issuing authority
title               | VARCHAR(100)      |      | NULL    | Certificate title (CFP, CFA, etc.)
year                | VARCHAR(4)        |      | NULL    | Year of issue
advId               | VARCHAR(20)       |      | NULL    | FK: advisor
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

---

### 6. EDUCATION (Advisor Credentials)

**Table**: `education`  
**PK**: `eduId` (BIGINT(20))  
**FK**: `advId` → `advisor`

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
eduId               | BIGINT(20)        | NO   |         | Primary Key
degree              | VARCHAR(150)      |      | NULL    | Degree name
field               | VARCHAR(100)      |      | NULL    | Field of study
fromYear            | VARCHAR(20)       |      | NULL    | Start year
toYear              | VARCHAR(20)       |      | NULL    | End year
institution         | VARCHAR(250)      |      | NULL    | Institute name
advId               | VARCHAR(50)       |      | NULL    | FK: advisor
imagePath           | VARCHAR(350)      |      | NULL    | Certificate image
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

---

### 7. AWARD (Advisor Credentials)

**Table**: `award`  
**PK**: `awardId` (BIGINT(20))  
**FK**: `advId` → `advisor`

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
awardId             | BIGINT(20)        | NO   |         | Primary Key
imagePath           | VARCHAR(350)      |      | NULL    | Award image
issuedBy            | VARCHAR(100)      |      | NULL    | Issuing organization
title               | VARCHAR(100)      |      | NULL    | Award title
year                | VARCHAR(4)        |      | NULL    | Year of award
advId               | VARCHAR(50)       |      | NULL    | FK: advisor
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

---

### 8. EXPERIENCE (Advisor Credentials)

**Table**: `experience`  
**PK**: `expId` (BIGINT(20))  
**FK**: `advId` → `advisor`

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
expId               | BIGINT(20)        | NO   |         | Primary Key
company             | VARCHAR(200)      |      | NULL    | Company name
designation         | VARCHAR(100)      |      | NULL    | Job designation
fromYear            | VARCHAR(20)       |      | NULL    | Start year
toYear              | VARCHAR(20)       |      | NULL    | End year
location            | VARCHAR(100)      |      | NULL    | Work location
advId               | VARCHAR(50)       |      | NULL    | FK: advisor
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

---

### 9. FOLLOWERS (Relationships)

**Table**: `followers`  
**PK**: `followersId` (BIGINT(20))

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
followersId         | BIGINT(20)        | NO   |         | Primary Key
advId               | VARCHAR(50)       |      | NULL    | Advisor ID
userId              | VARCHAR(50)       |      | NULL    | User ID (investor)
userType            | INT(5)            |      | NULL    | User type (1=investor, 2=advisor)
status              | INT(5)            |      | NULL    | Follower status (active/blocked)
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
byWhom              | VARCHAR(50)       |      | NULL    | Who initiated follow
```

**Purpose**: Tracks investor followers of advisors.

---

### 10. INVINTEREST (Investor Interests)

**Table**: `invinterest`  
**PK**: `interestId` (BIGINT(20))  
**FK**: `invId` → `investor`

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
interestId          | BIGINT(20)        | NO   |         | Primary Key
prodId              | INT(3)            | NO   |         | Product ID
invId               | VARCHAR(20)       | NO   |         | FK: investor
scale               | INT(1)            | NO   |         | Interest level (1-5)
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

**Purpose**: Tracks investor interests in financial products (insurance, investments, etc.).

---

### 11. GOAL (Financial Planning)

**Table**: `goal`  
**PK**: `goalId` (BIGINT(20))

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
goalId              | BIGINT(20)        | NO   |         | Primary Key
goalName            | VARCHAR(50)       |      | NULL    | Goal name (e.g., "Buy Home")
referenceId         | VARCHAR(50)       | NO   |         | Reference ID (plan)
tenure              | INT(3)            | NO   |         | Time horizon (in years)
tenureType          | VARCHAR(5)        |      | NULL    | Y=years, M=months
goalAmount          | DECIMAL(15,2)     | NO   |         | Target amount (₹)
inflationRate       | DOUBLE            | NO   |         | Expected inflation (%)
currentAmount       | DECIMAL(15,2)     | NO   |         | Current savings (₹)
growthRate          | DOUBLE            | NO   |         | Growth rate on savings (%)
rateOfReturn        | DOUBLE            | NO   |         | Investment return rate (%)
annualInvestmentRate| DOUBLE            | NO   |         | Annual investment rate (%)
futureCost          | DECIMAL(15,2)     | NO   |         | Inflation-adjusted cost (₹)
futureValue         | DECIMAL(15,2)     | NO   |         | Projected value at target (₹)
finalCorpus         | DECIMAL(15,2)     | NO   |         | Final corpus needed (₹)
monthlyInv          | DECIMAL(15,2)     | NO   |         | Monthly investment needed (₹)
annualInv           | DECIMAL(15,2)     | NO   |         | Annual investment needed (₹)
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

**Purpose**: Goal Planner calculator output - stores financial goals and calculations.

---

### 12. PLAN (Financial Planning)

**Table**: `plan`  
**PK**: `planId` (BIGINT(20))

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
planId              | BIGINT(20)        | NO   |         | Primary Key
partyId             | BIGINT(20)        | NO   | 0       | Party ID (investor)
parentPartyId       | BIGINT(20)        | NO   | 0       | Parent party ID
referenceId         | VARCHAR(20)       |      | NULL    | Reference ID
name                | VARCHAR(100)      |      | NULL    | Plan name
age                 | INT(3)            | NO   | 0       | Age of person
selectedPlan        | VARCHAR(300)      |      | NULL    | Selected calculators/plans
spouse              | VARCHAR(5)        |      | NULL    | Has spouse (Y/N)
father              | VARCHAR(5)        |      | NULL    | Has father (Y/N)
mother              | VARCHAR(5)        |      | NULL    | Has mother (Y/N)
others              | VARCHAR(5)        |      | NULL    | Has others (Y/N)
inLaws              | VARCHAR(5)        |      | NULL    | Has in-laws (Y/N)
grandParent         | VARCHAR(5)        |      | NULL    | Has grandparents (Y/N)
child1              | VARCHAR(5)        |      | NULL    | Has child 1 (Y/N)
child2              | VARCHAR(50)       |      | NULL    | Has child 2 (Y/N)
child3              | VARCHAR(5)        |      | NULL    | Has child 3 (Y/N)
sibilings           | VARCHAR(5)        |      | NULL    | Has siblings (Y/N)
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

**Purpose**: Master financial plan - can be shared with advisors for feedback.

---

### 13. CASHFLOW (Financial Planning)

**Table**: `cashflow`  
**PK**: `cashFlowId` (BIGINT(20))  
**FK**: `cashFlowItemId` → `cashflowitem`

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
cashFlowId          | BIGINT(20)        | NO   |         | Primary Key
referenceId         | VARCHAR(50)       |      | NULL    | Plan reference ID
cashFlowItemId      | INT(3)            |      | NULL    | FK: cashflow item type
budgetAmt           | DECIMAL(15,2)     |      | NULL    | Budgeted amount (₹)
actualAmt           | DECIMAL(15,2)     |      | NULL    | Actual amount (₹)
date                | VARCHAR(20)       |      | NULL    | Date (YYYY-MM-DD)
cashFlowItemTypeId  | INT(3)            |      | NULL    | Income=1, Expense=2
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

**Purpose**: Cash Flow Analyzer - individual income/expense items.

**Related Tables**:
- `cashflowitem` (item definitions)
- `cashflowsummary` (summary totals)

---

### 14. ARTICLEPOST (Content - Articles)

**Table**: `articlepost`  
**PK**: `articleId` (BIGINT(20))

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
articleId           | BIGINT(20)        | NO   |         | Primary Key
partyId             | BIGINT(20)        |      | NULL    | Author (party ID)
name                | VARCHAR(50)       |      | NULL    | Author name
designation         | VARCHAR(50)       |      | NULL    | Author designation
imagePath           | VARCHAR(500)      |      | NULL    | Article/author image
forumCategoryId     | INT(3)            | NO   | 0       | Category (FK: forumcategory)
forumSubCategoryId  | INT(3)            | NO   | 0       | Sub-category (FK: forumsubcategory)
prodId              | INT(3)            |      | 0       | Related product
content             | TEXT              |      | NULL    | Article content
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
forumStatusId       | INT(2)            |      | NULL    | Status (draft/pending/approved)
adminId             | VARCHAR(50)       |      | NULL    | Admin who moderated
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
reason              | VARCHAR(750)      |      | NULL    | Rejection/moderation reason
articleStatusId     | INT(11)           |      | NULL    | Article status
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
url                 | VARCHAR(100)      |      | NULL    | Article URL
```

**Purpose**: Advisor articles/insights published on platform. Must be approved before publication.

**Related Tables**:
- `articlevote` (up/down votes)
- `articlecomment` (comments)
- `articlefavorite` (saved articles)

---

### 15. FORUMQUERY (Content - Q&A)

**Table**: `forumquery`  
**PK**: `queryId` (BIGINT(20))

```sql
Column Name         | Type              | Null | Default | Notes
--------------------|-------------------|------|---------|-------
queryId             | BIGINT(20)        | NO   |         | Primary Key
query               | TEXT              |      | NULL    | Question text
partyId             | BIGINT(20)        | NO   | 0       | Asker (party ID)
postedToPartyId     | BIGINT(20)        | NO   | 0       | Advisor ID (if targeted)
forumSubCategoryId  | INT(11)           | NO   | 0       | Sub-category
forumCategoryId     | INT(11)           | NO   | 0       | Category
created             | TIMESTAMP         |      | NULL    | Created timestamp
updated             | TIMESTAMP         |      | NULL    | Updated timestamp
delete_flag         | VARCHAR(1)        |      | NULL    | Soft delete
created_by          | VARCHAR(50)       |      | NULL    | Created by
updated_by          | VARCHAR(50)       |      | NULL    | Updated by
```

**Purpose**: Q&A queries for advisors and community. Answers in `forumanswer` table.

**Related Tables**:
- `forumanswer` (answers to queries)

---

## Supporting Tables Reference

### Master Data Tables

| Table | Purpose |
|-------|---------|
| `products` | Financial products (insurance, mutual funds, etc.) |
| `service` | Services offered under products |
| `brand` | Brand names for products |
| `license` | Professional licenses (CFP, CFA, etc.) |
| `remuneration` | Remuneration types |
| `state`, `city` | Geographic data |
| `category`, `categorytype` | Categories for various features |

### Lookup/Status Tables

| Table | Purpose |
|-------|---------|
| `workflowstatus` | Advisor approval status |
| `forumstatus` | Forum post status (draft, approved, rejected) |
| `articlestatus` | Article status |
| `followerstatus` | Follower status (active, blocked) |
| `partystatus` | Party account status (active, inactive) |
| `usertype` | User type classification |
| `votetype` | Vote type (upvote, downvote) |

### Calculator Supporting Tables

| Table | Purpose |
|-------|---------|
| `cashflowitem`, `cashflowitemtype` | Cash flow item definitions |
| `account`, `accounttype` | Asset/liability account types |
| `priorityitem`, `urgency` | Priority rankings |
| `riskquestionaire`, `riskportfolio` | Risk profiling |
| `insuranceitem` | Insurance types |
| `networth`, `networthsummary` | Net worth calculations |
| `insurance` | Insurance needs calculations |
| `riskprofile`, `risksummary` | Risk assessment results |
| `emicalculator`, `emicapacity` | EMI calculations |
| `partialpayment`, `emichange`, `interestchange` | EMI variations |
| `futurevalue`, `targetvalue` | Investment value calculations |

### Forum/Community Tables

| Table | Purpose |
|-------|---------|
| `forumcategory`, `forumsubcategory` | Forum organization |
| `forumthread`, `forumpost` | Discussion threads |
| `articlevote`, `articlevoteaddress` | Article voting |
| `articlecomment` | Comments on articles |
| `articlefavorite` | Saved/bookmarked articles |
| `forumanswer` | Answers to forum queries |

### Advisor-Related Tables

| Table | Purpose |
|-------|---------|
| `advproduct` | Advisor's product expertise |
| `advbrandinfo`, `advbrandrank` | Advisor's brand rankings |
| `promotion` | Advisor promotional videos |
| `public_advisor` | Public profile copy of advisor |
| `public_award`, `public_certificate`, etc. | Public credential copies |
| `serviceplan` | Service plans for products |

### Role & Permission Tables

| Table | Purpose |
|-------|---------|
| `role` | Role definitions |
| `user_role` | User-to-role mapping |
| `screen_reference` | UI screens |
| `screen_field_reference` | Screen fields |
| `role_screen_rights` | Screen access rights |
| `role_field_rights` | Field-level access rights |

### Utility Tables

| Table | Purpose |
|-------|---------|
| `mailmessage` | Transactional email queue |
| `generated_otp` | OTP storage for signup |
| `activation_link` | Email activation links |
| `signin_verification` | Sign-in verification |
| `chatuser` | Chat user mapping |
| `keypeople` | Key people in organization |
| `planreferenceid` | Plan ID generation |
| `calcquery` | Calculator query logging |

---

## Key Relationships Map

```
INVESTOR (investor)
  ├─ → party (partyId)
  ├─ → invinterest (product interests)
  ├─ → invriskprofile (risk questionnaire)
  ├─ → goal (financial goals)
  ├─ → plan (financial plans)
  ├─ → cashflow (cash flow data)
  └─ → followers (follows advisors)

ADVISOR (advisor)
  ├─ → party (partyId)
  ├─ → certificate (credentials)
  ├─ → education (education)
  ├─ → award (awards)
  ├─ → experience (experience)
  ├─ → advproduct (product expertise)
  ├─ → advbrandinfo/advbrandrank (brand expertise)
  ├─ → promotion (video promotions)
  ├─ → articlepost (published articles)
  ├─ → followers (follower tracking)
  └─ → public_advisor (public profile)

ARTICLEPOST (articlepost)
  ├─ → forumcategory (category)
  ├─ → forumsubcategory (sub-category)
  ├─ → articlevote (vote counts)
  ├─ → articlecomment (comments)
  └─ → articlefavorite (saved by users)

PLAN (plan)
  ├─ → goal (financial goals)
  ├─ → cashflow (cash flow entries)
  ├─ → riskprofile (risk assessment)
  ├─ → networth (net worth items)
  ├─ → insurance (insurance needs)
  └─ → emicalculator (loan calculations)

FORUMQUERY (forumquery)
  ├─ → forumanswer (answers)
  ├─ → forumcategory (category)
  └─ → forumsubcategory (sub-category)
```

---

## Data Type Summary

| Type | Usage |
|------|-------|
| **VARCHAR(N)** | String fields (names, emails, text) |
| **TEXT** | Long text (article content, queries) |
| **INT/BIGINT** | IDs, counts, status codes |
| **DOUBLE** | Percentages, rates (inflation, interest) |
| **DECIMAL(15,2)** | Monetary values (always with 2 decimal places) |
| **TIMESTAMP** | Created/updated audit fields |

---

## Important Constraints

### Naming Conventions
- **IDs**: Mix of BIGINT (auto-increment) and VARCHAR (smart IDs like "INV001", "ADV001")
- **Timestamps**: All tables have `created`, `updated` fields
- **Audit Trail**: `created_by`, `updated_by` fields on most tables
- **Soft Delete**: `delete_flag` VARCHAR(1) ('Y' = deleted)

### Key Design Patterns

1. **Hierarchical Structure**: `parentPartyId` for multi-level organizations
2. **Reference IDs**: Smart IDs (INV001, ADV001) plus BIGINT auto-increment primary keys
3. **Audit Trail**: Every record tracks creator, updater, timestamps
4. **Soft Deletes**: Records marked with `delete_flag` instead of actual deletion
5. **Status Tracking**: `workFlowStatus`, `partyStatusId`, `forumStatusId` for state management
6. **Public Copies**: `public_advisor`, `public_certificate`, etc. for cached public data

---

## Notes

- **Currency**: All amounts in INR (₹), stored as DECIMAL(15,2)
- **Calculations**: Financial calculators store both inputs and outputs
- **Verification**: Multi-step (email, mobile, advisor approval)
- **Moderation**: Content requires approval before publication
- **Smart IDs**: Advisor/Investor IDs like "ADV001", "INV001" generated from `advisorsmartid`, `investorsmartid` tables
- **Multi-tenancy**: `parentPartyId` supports corporate/team setups

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-07
