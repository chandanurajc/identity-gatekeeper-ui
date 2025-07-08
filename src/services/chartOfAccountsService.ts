import { supabase } from "@/integrations/supabase/client";
import type { ChartOfAccount, ChartOfAccountFormData } from "@/types/chartOfAccounts";

class ChartOfAccountsService {
  async getChartOfAccounts(organizationId: string): Promise<ChartOfAccount[]> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('account_code', { ascending: true });

    if (error) {
      console.error('Error fetching chart of accounts:', error);
      throw new Error(`Failed to fetch chart of accounts: ${error.message}`);
    }

    return data?.map(this.transformFromDb) || [];
  }

  async getChartOfAccountById(id: string, organizationId: string): Promise<ChartOfAccount | null> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching chart of account:', error);
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch chart of account: ${error.message}`);
    }

    return data ? this.transformFromDb(data) : null;
  }

  async createChartOfAccount(
    accountData: ChartOfAccountFormData,
    organizationId: string,
    createdBy: string
  ): Promise<ChartOfAccount> {
    const accountToCreate = {
      organization_id: organizationId,
      account_code: accountData.accountCode,
      account_name: accountData.accountName,
      account_type: accountData.accountType,
      status: accountData.status,
      created_by: createdBy,
    };

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert(accountToCreate)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create chart of account: ${error.message}`);
    }

    return this.transformFromDb(data);
  }

  async updateChartOfAccount(
    id: string,
    accountData: ChartOfAccountFormData,
    organizationId: string,
    updatedBy: string
  ): Promise<ChartOfAccount> {
    const accountToUpdate = {
      account_code: accountData.accountCode,
      account_name: accountData.accountName,
      account_type: accountData.accountType,
      status: accountData.status,
      updated_by: updatedBy,
      updated_on: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .update(accountToUpdate)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update chart of account: ${error.message}`);
    }

    return this.transformFromDb(data);
  }

  async deleteChartOfAccount(id: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('chart_of_accounts')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to delete chart of account: ${error.message}`);
    }
  }

  private transformFromDb(dbAccount: any): ChartOfAccount {
    return {
      id: dbAccount.id,
      organizationId: dbAccount.organization_id,
      accountCode: dbAccount.account_code,
      accountName: dbAccount.account_name,
      accountType: dbAccount.account_type,
      status: dbAccount.status,
      createdOn: new Date(dbAccount.created_on),
      updatedOn: dbAccount.updated_on ? new Date(dbAccount.updated_on) : undefined,
      createdBy: dbAccount.created_by,
      updatedBy: dbAccount.updated_by,
    };
  }
}

export const chartOfAccountsService = new ChartOfAccountsService();