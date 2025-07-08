import { supabase } from "@/integrations/supabase/client";
import type { JournalHeader, JournalFormData } from "@/types/journal";

class JournalService {
  async getJournals(organizationId: string): Promise<JournalHeader[]> {
    const { data, error } = await supabase
      .from('journal_header')
      .select(`
        *,
        journal_line (*)
      `)
      .eq('organization_id', organizationId)
      .order('journal_date', { ascending: false });

    if (error) {
      console.error('Error fetching journals:', error);
      throw new Error(`Failed to fetch journals: ${error.message}`);
    }

    return data?.map(this.transformFromDb) || [];
  }

  async getJournalById(id: string, organizationId: string): Promise<JournalHeader | null> {
    const { data, error } = await supabase
      .from('journal_header')
      .select(`
        *,
        journal_line (*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching journal:', error);
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch journal: ${error.message}`);
    }

    return data ? this.transformFromDb(data) : null;
  }

  async createJournal(
    journalData: JournalFormData,
    organizationId: string,
    createdBy: string
  ): Promise<JournalHeader> {
    const journalToCreate = {
      organization_id: organizationId,
      journal_date: journalData.journalDate,
      source_type: journalData.sourceType,
      source_reference: journalData.sourceReference,
      created_by: createdBy,
    };

    const { data: journal, error } = await supabase
      .from('journal_header')
      .insert(journalToCreate)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create journal: ${error.message}`);
    }

    // Create journal lines
    if (journalData.journalLines.length > 0) {
      const linesToCreate = journalData.journalLines.map(line => ({
        journal_id: journal.id,
        line_number: line.lineNumber,
        account_code: line.accountCode,
        debit_amount: line.debitAmount,
        credit_amount: line.creditAmount,
        narration: line.narration,
      }));

      const { error: linesError } = await supabase
        .from('journal_line')
        .insert(linesToCreate);

      if (linesError) {
        throw new Error(`Failed to create journal lines: ${linesError.message}`);
      }
    }

    return this.getJournalById(journal.id, organizationId) as Promise<JournalHeader>;
  }

  async postJournal(id: string, organizationId: string, updatedBy: string): Promise<void> {
    const { error } = await supabase
      .from('journal_header')
      .update({
        status: 'Posted',
        updated_by: updatedBy,
        updated_on: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to post journal: ${error.message}`);
    }
  }

  async reverseJournal(id: string, organizationId: string, updatedBy: string): Promise<void> {
    const { error } = await supabase
      .from('journal_header')
      .update({
        status: 'Reversed',
        updated_by: updatedBy,
        updated_on: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to reverse journal: ${error.message}`);
    }
  }

  private transformFromDb(dbJournal: any): JournalHeader {
    return {
      id: dbJournal.id,
      organizationId: dbJournal.organization_id,
      journalDate: dbJournal.journal_date,
      sourceType: dbJournal.source_type,
      sourceReference: dbJournal.source_reference,
      status: dbJournal.status,
      createdOn: new Date(dbJournal.created_on),
      updatedOn: dbJournal.updated_on ? new Date(dbJournal.updated_on) : undefined,
      createdBy: dbJournal.created_by,
      updatedBy: dbJournal.updated_by,
      journalLines: dbJournal.journal_line?.map((line: any) => ({
        id: line.id,
        journalId: line.journal_id,
        lineNumber: line.line_number,
        accountCode: line.account_code,
        debitAmount: line.debit_amount,
        creditAmount: line.credit_amount,
        narration: line.narration,
        slReferenceId: line.sl_reference_id,
        createdOn: new Date(line.created_on),
      })) || [],
    };
  }
}

export const journalService = new JournalService();