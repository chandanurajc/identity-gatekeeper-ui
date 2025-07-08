-- Create enums for finance module
CREATE TYPE account_type AS ENUM ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense');
CREATE TYPE rule_source_type AS ENUM ('Invoice', 'PO', 'Payment');
CREATE TYPE rule_action AS ENUM ('Invoice Approved', 'PO Created', 'Payment Processed');
CREATE TYPE party_type AS ENUM ('Bill To', 'Remit To');
CREATE TYPE filter_logic_type AS ENUM ('AND', 'OR');
CREATE TYPE journal_status AS ENUM ('Draft', 'Posted', 'Reversed');
CREATE TYPE subledger_status AS ENUM ('Open', 'Settled');

-- Create Chart of Accounts table
CREATE TABLE public.chart_of_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    account_code VARCHAR NOT NULL,
    account_name TEXT NOT NULL,
    account_type account_type NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_on TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    UNIQUE(organization_id, account_code)
);

-- Create Accounting Rules table
CREATE TABLE public.accounting_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    rule_name TEXT NOT NULL,
    source_type rule_source_type NOT NULL,
    source_reference TEXT NOT NULL,
    triggering_action rule_action NOT NULL,
    debit_account_code VARCHAR NOT NULL,
    credit_account_code VARCHAR NOT NULL,
    amount_source TEXT NOT NULL,
    enable_subledger BOOLEAN NOT NULL DEFAULT false,
    party_type party_type,
    party_name TEXT,
    party_code TEXT,
    filter_logic_type filter_logic_type DEFAULT 'AND',
    filter_criteria JSONB,
    status VARCHAR NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_on TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    UNIQUE(organization_id, rule_name)
);

-- Create Journal Header table
CREATE TABLE public.journal_header (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    journal_date DATE NOT NULL,
    source_type rule_source_type,
    source_reference TEXT,
    status journal_status NOT NULL DEFAULT 'Draft',
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_on TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL,
    updated_by TEXT
);

-- Create Journal Line table
CREATE TABLE public.journal_line (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_id UUID NOT NULL REFERENCES public.journal_header(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    account_code VARCHAR NOT NULL,
    debit_amount DECIMAL,
    credit_amount DECIMAL,
    narration TEXT,
    sl_reference_id UUID,
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CHECK (
        (debit_amount IS NOT NULL AND credit_amount IS NULL) OR 
        (debit_amount IS NULL AND credit_amount IS NOT NULL)
    )
);

-- Create Subledger table
CREATE TABLE public.subledger (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    journal_id UUID REFERENCES public.journal_line(id),
    party_name TEXT NOT NULL,
    party_code TEXT NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL NOT NULL,
    source_reference TEXT,
    status subledger_status NOT NULL DEFAULT 'Open',
    created_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_on TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL,
    updated_by TEXT
);

-- Create indexes for performance
CREATE INDEX idx_chart_of_accounts_organization ON public.chart_of_accounts(organization_id);
CREATE INDEX idx_chart_of_accounts_code ON public.chart_of_accounts(organization_id, account_code);
CREATE INDEX idx_accounting_rules_organization ON public.accounting_rules(organization_id);
CREATE INDEX idx_journal_header_organization ON public.journal_header(organization_id);
CREATE INDEX idx_journal_header_date ON public.journal_header(journal_date);
CREATE INDEX idx_journal_line_journal ON public.journal_line(journal_id);
CREATE INDEX idx_subledger_organization ON public.subledger(organization_id);
CREATE INDEX idx_subledger_party ON public.subledger(party_code);

-- Insert new permissions for finance modules
INSERT INTO public.permissions (name, module, component, description)
VALUES
    ('View COA', 'Master Data', 'Chart of Accounts', 'View COA list and detail'),
    ('Create COA', 'Master Data', 'Chart of Accounts', 'Add a new account'),
    ('Edit COA', 'Master Data', 'Chart of Accounts', 'Modify an existing account'),
    ('View Rules', 'Finance', 'Accounting Rules', 'View existing accounting rules'),
    ('Create Rules', 'Finance', 'Accounting Rules', 'Add new rules'),
    ('Edit Rules', 'Finance', 'Accounting Rules', 'Modify existing rules'),
    ('Delete Rules', 'Finance', 'Accounting Rules', 'Archive/remove accounting rules'),
    ('View Journal', 'Finance', 'Journal', 'View journal headers and lines'),
    ('Post Journal', 'Finance', 'Journal', 'Post journal entries'),
    ('Reverse Journal', 'Finance', 'Journal', 'Reverse existing journal entries'),
    ('View Subledger', 'Finance', 'Subledger', 'View subledger entries per party')
ON CONFLICT (name) DO NOTHING;