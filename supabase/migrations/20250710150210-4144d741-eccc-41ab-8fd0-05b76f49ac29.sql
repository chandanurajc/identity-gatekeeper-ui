-- Make debit and credit account codes optional in accounting rule lines
ALTER TABLE public.accounting_rule_lines 
ALTER COLUMN debit_account_code DROP NOT NULL;

ALTER TABLE public.accounting_rule_lines 
ALTER COLUMN credit_account_code DROP NOT NULL;