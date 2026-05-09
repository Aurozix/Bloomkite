-- ============================================================================
-- SPRINT 3: ADVISOR SYSTEM, ARTICLES, FORUM
-- ============================================================================

-- ============================================================================
-- ADVISOR CREDENTIALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.advisor_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  credential_type VARCHAR(100) NOT NULL,
  issuer VARCHAR(255),
  license_number VARCHAR(100),
  expiry_date DATE,
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_advisor_credentials_user_id ON public.advisor_credentials(user_id);
CREATE INDEX idx_advisor_credentials_status ON public.advisor_credentials(status);

-- ============================================================================
-- ADVISOR EXPERTISE TABLE (simple tag system)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.advisor_expertise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialization VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, specialization)
);

CREATE INDEX idx_advisor_expertise_user_id ON public.advisor_expertise(user_id);
CREATE INDEX idx_advisor_expertise_specialization ON public.advisor_expertise(specialization);

-- ============================================================================
-- ADVISOR FOLLOWERS TABLE (Investor → Advisor relationships)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.advisor_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(investor_id, advisor_id)
);

CREATE INDEX idx_advisor_followers_investor_id ON public.advisor_followers(investor_id);
CREATE INDEX idx_advisor_followers_advisor_id ON public.advisor_followers(advisor_id);

-- ============================================================================
-- ARTICLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  featured_image_url TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
  rejection_reason TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_articles_author_id ON public.articles(author_id);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_published_at ON public.articles(published_at);
CREATE INDEX idx_articles_category ON public.articles(category);

-- ============================================================================
-- FORUM QUESTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.forum_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  answer_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forum_questions_author_id ON public.forum_questions(author_id);
CREATE INDEX idx_forum_questions_status ON public.forum_questions(status);
CREATE INDEX idx_forum_questions_created_at ON public.forum_questions(created_at DESC);

-- ============================================================================
-- FORUM ANSWERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.forum_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  votes_count INT DEFAULT 0,
  is_best_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forum_answers_author_id ON public.forum_answers(author_id);
CREATE INDEX idx_forum_answers_question_id ON public.forum_answers(question_id);
CREATE INDEX idx_forum_answers_is_best_answer ON public.forum_answers(is_best_answer);
CREATE INDEX idx_forum_answers_votes_count ON public.forum_answers(votes_count DESC);

-- ============================================================================
-- FORUM ANSWER VOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.forum_answer_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES public.forum_answers(id) ON DELETE CASCADE,
  vote_type VARCHAR(50) NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, answer_id)
);

CREATE INDEX idx_forum_answer_votes_user_id ON public.forum_answer_votes(user_id);
CREATE INDEX idx_forum_answer_votes_answer_id ON public.forum_answer_votes(answer_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.advisor_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answer_votes ENABLE ROW LEVEL SECURITY;

-- Advisor Credentials: Owner can CRUD, public can view approved
CREATE POLICY "advisor_credentials_owner_crud" ON public.advisor_credentials
  USING (auth.uid() = user_id);

CREATE POLICY "advisor_credentials_public_approved" ON public.advisor_credentials
  FOR SELECT USING (status = 'approved');

-- Advisor Expertise: Owner can CRUD, public can view all
CREATE POLICY "advisor_expertise_owner_crud" ON public.advisor_expertise
  USING (auth.uid() = user_id);

CREATE POLICY "advisor_expertise_public_read" ON public.advisor_expertise
  FOR SELECT USING (true);

-- Advisor Followers: Authenticated can manage own, public can view all
CREATE POLICY "advisor_followers_insert_delete" ON public.advisor_followers
  USING (auth.uid() = investor_id);

CREATE POLICY "advisor_followers_public_read" ON public.advisor_followers
  FOR SELECT USING (true);

-- Articles: Author can CRUD own, public can view published
CREATE POLICY "articles_author_crud" ON public.articles
  USING (auth.uid() = author_id);

CREATE POLICY "articles_public_published" ON public.articles
  FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

-- Forum Questions: Authenticated can INSERT, public can view all, author can UPDATE
CREATE POLICY "forum_questions_insert" ON public.forum_questions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "forum_questions_public_read" ON public.forum_questions
  FOR SELECT USING (true);

CREATE POLICY "forum_questions_author_update" ON public.forum_questions
  FOR UPDATE USING (auth.uid() = author_id);

-- Forum Answers: Authenticated can INSERT, public can view all, author can UPDATE
CREATE POLICY "forum_answers_insert" ON public.forum_answers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "forum_answers_public_read" ON public.forum_answers
  FOR SELECT USING (true);

CREATE POLICY "forum_answers_author_update" ON public.forum_answers
  FOR UPDATE USING (auth.uid() = author_id);

-- Forum Answer Votes: Authenticated users manage own votes, public can view all
CREATE POLICY "forum_answer_votes_insert_delete" ON public.forum_answer_votes
  USING (auth.uid() = user_id);

CREATE POLICY "forum_answer_votes_public_read" ON public.forum_answer_votes
  FOR SELECT USING (true);
