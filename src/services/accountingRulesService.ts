import { supabase } from "@/integrations/supabase/client";
import type { AccountingRule, AccountingRuleFormData } from "@/types/accountingRules";

class AccountingRulesService {
  async getAccountingRules(organizationId: string): Promise<AccountingRule[]> {
    const { data, error } = await supabase
      .from('accounting_rules')
      .select('*')
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
      .select('*')
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
      transaction_type: ruleData.transactionType,
      transaction_reference: ruleData.transactionReference,
      transaction_type_text: ruleData.transactionTypeText,
      triggering_action: ruleData.triggeringAction,
      debit_account_code: ruleData.debitAccountCode,
      credit_account_code: ruleData.creditAccountCode,
      amount_source: ruleData.amountSource,
      enable_subledger: ruleData.enableSubledger,
      party_type: ruleData.partyType,
      party_name: ruleData.partyName,
      party_code: ruleData.partyCode,
      filter_logic_type: ruleData.filterLogicType,
      filter_criteria: ruleData.filterCriteria ? JSON.stringify(ruleData.filterCriteria) : null,
      status: ruleData.status,
      created_by: createdBy,
    };

    const { data, error } = await supabase
      .from('accounting_rules')
      .insert(ruleToCreate)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create accounting rule: ${error.message}`);
    }

    return this.transformFromDb(data);
  }

  async updateAccountingRule(
    id: string,
    ruleData: AccountingRuleFormData,
    organizationId: string,
    updatedBy: string
  ): Promise<AccountingRule> {
    const ruleToUpdate = {
      rule_name: ruleData.ruleName,
      transaction_type: ruleData.transactionType,
      transaction_reference: ruleData.transactionReference,
      transaction_type_text: ruleData.transactionTypeText,
      triggering_action: ruleData.triggeringAction,
      debit_account_code: ruleData.debitAccountCode,
      credit_account_code: ruleData.creditAccountCode,
      amount_source: ruleData.amountSource,
      enable_subledger: ruleData.enableSubledger,
      party_type: ruleData.partyType,
      party_name: ruleData.partyName,
      party_code: ruleData.partyCode,
      filter_logic_type: ruleData.filterLogicType,
      filter_criteria: ruleData.filterCriteria ? JSON.stringify(ruleData.filterCriteria) : null,
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

    return this.transformFromDb(data);
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
    return {
      id: dbRule.id,
      organizationId: dbRule.organization_id,
      ruleName: dbRule.rule_name,
      transactionType: dbRule.transaction_type,
      transactionReference: dbRule.transaction_reference,
      transactionTypeText: dbRule.transaction_type_text,
      triggeringAction: dbRule.triggering_action,
      debitAccountCode: dbRule.debit_account_code,
      creditAccountCode: dbRule.credit_account_code,
      amountSource: dbRule.amount_source,
      enableSubledger: dbRule.enable_subledger,
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