-- Financial Plans table for storing calculator results
CREATE TABLE IF NOT EXISTS public.financial_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  calculator_type VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_financial_plans_user_id ON public.financial_plans(user_id);
CREATE INDEX idx_financial_plans_calculator_type ON public.financial_plans(calculator_type);
CREATE INDEX idx_financial_plans_is_draft ON public.financial_plans(is_draft);

-- Row-Level Security
ALTER TABLE public.financial_plans ENABLE ROW LEVEL SECURITY;

-- Users can only select their own financial plans
CREATE POLICY "Users can view their own financial plans"
  ON public.financial_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own financial plans
CREATE POLICY "Users can insert their own financial plans"
  ON public.financial_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own financial plans
CREATE POLICY "Users can update their own financial plans"
  ON public.financial_plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own financial plans
CREATE POLICY "Users can delete their own financial plans"
  ON public.financial_plans
  FOR DELETE
  USING (auth.uid() = user_id);
