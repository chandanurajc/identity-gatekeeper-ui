import { supabase } from "@/integrations/supabase/client";
import type { AccountingRule, AccountingRuleFormData, AccountingRuleLine } from "@/types/accountingRules";

class AccountingRulesService {
  async getAccountingRules(organizationId: string): Promise<AccountingRule[]> {
    const { data, error } = await supabase
      .from('accounting_rules')
      .select(`
        *,
        accounting_rule_lines (*)
      `)
      .eq('organization_id', organizationId)
      .order('rule_name', { ascending: true });

    if (error) {
      console.error('Error fetching accounting rules:', error);
      throw new Error(`Failed to fetch accounting rules: ${error.message}`);
    }

    return data?.map(this.transformFromDb) || [];
  }

  async getAccountingRuleById(id: string, organizationId: string): Promise<AccountingRule | null> {
    const { data, error } = await supabase
      .from('accounting_rules')
      .select(`
        *,
        accounting_rule_lines (*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching accounting rule:', error);
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch accounting rule: ${error.message}`);
    }

    return data ? this.transformFromDb(data) : null;
  }

  async createAccountingRule(
    ruleData: AccountingRuleFormData,
    organizationId: string,
    createdBy: string
  ): Promise<AccountingRule> {
    const ruleToCreate = {
      organization_id: organizationId,
      rule_name: ruleData.ruleName,
      transaction_category: ruleData.transactionCategory,
      transaction_reference: ruleData.transactionReference,
      transaction_type: ruleData.transactionType,
      triggering_action: ruleData.triggeringAction,
      status: ruleData.status,
      created_by: createdBy,
    };

    const { data: createdRule, error: ruleError } = await supabase
      .from('accounting_rules')
      .insert(ruleToCreate)
      .select()
      .single();

    if (ruleError) {
      throw new Error(`Failed to create accounting rule: ${ruleError.message}`);
    }

    // Create rule lines
    if (ruleData.lines && ruleData.lines.length > 0) {
      const linesToCreate = ruleData.lines.map(line => ({
        rule_id: createdRule.id,
        line_number: line.lineNumber,
        debit_account_code: line.debitAccountCode,
        credit_account_code: line.creditAccountCode,
        amount_source: line.amountSource,
        enable_subledger: line.enableSubledger,
      }));

      const { error: linesError } = await supabase
        .from('accounting_rule_lines')
        .insert(linesToCreate);

      if (linesError) {
        throw new Error(`Failed to create accounting rule lines: ${linesError.message}`);
      }
    }

    return this.getAccountingRuleById(createdRule.id, organizationId) as Promise<AccountingRule>;
  }

  async updateAccountingRule(
    id: string,
    ruleData: AccountingRuleFormData,
    organizationId: string,
    updatedBy: string
  ): Promise<AccountingRule> {
    const ruleToUpdate = {
      rule_name: ruleData.ruleName,
      transaction_category: ruleData.transactionCategory,
      transaction_reference: ruleData.transactionReference,
      transaction_type: ruleData.transactionType,
      triggering_action: ruleData.triggeringAction,
      status: ruleData.status,
      updated_by: updatedBy,
      updated_on: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('accounting_rules')
      .update(ruleToUpdate)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update accounting rule: ${error.message}`);
    }

    // Delete existing lines
    await supabase
      .from('accounting_rule_lines')
      .delete()
      .eq('rule_id', id);

    // Create new lines
    if (ruleData.lines && ruleData.lines.length > 0) {
      const linesToCreate = ruleData.lines.map(line => ({
        rule_id: id,
        line_number: line.lineNumber,
        debit_account_code: line.debitAccountCode,
        credit_account_code: line.creditAccountCode,
        amount_source: line.amountSource,
        enable_subledger: line.enableSubledger,
      }));

      const { error: linesError } = await supabase
        .from('accounting_rule_lines')
        .insert(linesToCreate);

      if (linesError) {
        throw new Error(`Failed to create accounting rule lines: ${linesError.message}`);
      }
    }

    return this.getAccountingRuleById(id, organizationId) as Promise<AccountingRule>;
  }

  async deleteAccountingRule(id: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('accounting_rules')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to delete accounting rule: ${error.message}`);
    }
  }

  private transformFromDb(dbRule: any): AccountingRule {
    const lines: AccountingRuleLine[] = (dbRule.accounting_rule_lines || [])
      .sort((a: any, b: any) => a.line_number - b.line_number)
      .map((line: any) => ({
        id: line.id,
        lineNumber: line.line_number,
        debitAccountCode: line.debit_account_code,
        creditAccountCode: line.credit_account_code,
        amountSource: line.amount_source,
        enableSubledger: line.enable_subledger,
      }));

    return {
      id: dbRule.id,
      organizationId: dbRule.organization_id,
      ruleName: dbRule.rule_name,
      transactionCategory: dbRule.transaction_category,
      transactionReference: dbRule.transaction_reference,
      transactionType: dbRule.transaction_type,
      triggeringAction: dbRule.triggering_action,
      lines,
      partyType: dbRule.party_type,
      partyName: dbRule.party_name,
      partyCode: dbRule.party_code,
      filterLogicType: dbRule.filter_logic_type,
      filterCriteria: dbRule.filter_criteria ? JSON.parse(dbRule.filter_criteria) : undefined,
      status: dbRule.status,
      createdOn: new Date(dbRule.created_on),
      updatedOn: dbRule.updated_on ? new Date(dbRule.updated_on) : undefined,
      createdBy: dbRule.created_by,
      updatedBy: dbRule.updated_by,
    };
  }
}

export const accountingRulesService = new AccountingRulesService();