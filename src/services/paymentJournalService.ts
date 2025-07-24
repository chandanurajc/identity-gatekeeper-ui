import { supabase } from '@/integrations/supabase/client';
import { journalService } from './journalService';
import { accountingRulesService } from './accountingRulesService';
import { subledgerService } from './subledgerService';
import type { Payment, PaymentStatus } from '@/types/payment';
import type { AccountingRule, AccountingRuleLine } from '@/types/accountingRules';
import type { JournalFormData } from '@/types/journal';

export class PaymentJournalService {
  
  /**
   * Manually creates journal for an existing payment (for payments created before journal integration)
   */
  async createJournalForExistingPayment(paymentId: string): Promise<void> {
    try {
      // Get payment details
      const { data: paymentData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('Error fetching payment:', error);
        throw new Error(`Failed to fetch payment: ${error.message}`);
      }

      const payment: Payment = {
        id: paymentData.id,
        paymentNumber: paymentData.payment_number,
        paymentDate: paymentData.payment_date,
        paymentType: paymentData.payment_type,
        organizationId: paymentData.organization_id,
        divisionId: paymentData.division_id,
        payeeOrganizationId: paymentData.payee_organization_id,
        paymentMode: paymentData.payment_mode,
        referenceNumber: paymentData.reference_number,
        amount: paymentData.amount,
        currency: paymentData.currency,
        linkedInvoiceId: paymentData.linked_invoice_id,
        notes: paymentData.notes,
        status: paymentData.status,
        createdBy: paymentData.created_by,
        createdOn: new Date(paymentData.created_on),
        updatedBy: paymentData.updated_by,
        updatedOn: paymentData.updated_on ? new Date(paymentData.updated_on) : undefined,
      };

      // Create journal for current status
      await this.createPaymentJournal(payment, payment.status, payment.createdBy);
    } catch (error) {
      console.error('Error creating journal for existing payment:', error);
      throw error;
    }
  }
  
  /**
   * Creates journal entries for payment based on accounting rules
   */
  async createPaymentJournal(
    payment: Payment,
    status: PaymentStatus,
    createdBy: string
  ): Promise<void> {
    try {
      console.log('Creating payment journal for:', payment.paymentNumber, 'status:', status);
      
      // Find matching accounting rules for Payment category
      const accountingRules = await accountingRulesService.getAccountingRules(payment.organizationId);
      console.log('Found accounting rules:', accountingRules.length);
      
      const matchingRules = accountingRules.filter(rule => 
        rule.transactionCategory === 'Payment' &&
        this.matchesTriggeringAction(rule, status) &&
        this.matchesDivision(rule, payment.divisionId) &&
        this.matchesTransactionType(rule, payment.paymentMode) &&
        rule.status === 'Active'
      );

      console.log('Matching rules found:', matchingRules.length, matchingRules.map(r => r.ruleName));

      if (matchingRules.length === 0) {
        console.warn(`No matching accounting rules found for payment ${payment.paymentNumber} with status ${status}`);
        return;
      }

      // Create journal entries for each matching rule
      for (const rule of matchingRules) {
        console.log('Processing rule:', rule.ruleName);
        await this.createJournalFromRule(payment, rule, status, createdBy);
      }
    } catch (error) {
      console.error('Error creating payment journal:', error);
      throw error;
    }
  }

  /**
   * Creates a journal entry based on an accounting rule
   */
  private async createJournalFromRule(
    payment: Payment,
    rule: AccountingRule,
    status: PaymentStatus,
    createdBy: string
  ): Promise<void> {
    console.log('Creating journal from rule:', rule.ruleName, 'for payment:', payment.paymentNumber);
    
    const journalLines = rule.lines.map((line, index) => {
      const amount = this.getAmountFromSource(payment, line.amountSource);
      console.log(`Processing line ${line.lineNumber}:`, {
        debitAccount: line.debitAccountCode,
        creditAccount: line.creditAccountCode,
        amount,
        amountSource: line.amountSource,
        enableSubledger: line.enableSubledger
      });
      
      return {
        lineNumber: line.lineNumber,
        accountCode: line.debitAccountCode || line.creditAccountCode || '',
        debitAmount: line.debitAccountCode ? amount : undefined,
        creditAmount: line.creditAccountCode ? amount : undefined,
        narration: `${rule.ruleName} - Payment ${payment.paymentNumber} - ${status}`,
      };
    });

    console.log('Journal lines to create:', journalLines);

    const journalData: JournalFormData = {
      journalDate: payment.paymentDate,
      transactionType: 'Payment',
      transactionReference: payment.paymentNumber,
      journalLines,
    };

    console.log('Creating journal with data:', journalData);
    
    try {
      const result = await journalService.createJournal(journalData, payment.organizationId, createdBy);
      console.log('Journal created successfully:', result.id);
      
      // Create subledger entries for lines with enableSubledger = true
      await this.createSubledgerEntries(payment, rule, result.id, createdBy);
      
      // Auto-post the journal entry
      await journalService.postJournal(result.id, payment.organizationId, createdBy);
      console.log('Journal auto-posted successfully:', result.id);
    } catch (error) {
      console.error('Error creating journal:', error);
      throw error;
    }
  }

  /**
   * Creates subledger entries for accounting rule lines with enableSubledger = true
   */
  private async createSubledgerEntries(
    payment: Payment,
    rule: AccountingRule,
    journalId: string,
    createdBy: string
  ): Promise<void> {
    console.log('Creating subledger entries for payment:', payment.paymentNumber);
    
    const subledgerLines = rule.lines.filter(line => line.enableSubledger);
    
    if (subledgerLines.length === 0) {
      console.log('No subledger lines found for rule:', rule.ruleName);
      return;
    }

    for (const line of subledgerLines) {
      try {
        const amount = this.getAmountFromSource(payment, line.amountSource);
        const { partyOrgId, partyName, partyContactId } = await this.getPartyDetails(payment, rule.transactionCategory);
        
        await subledgerService.createSubledgerEntry({
          organizationId: payment.organizationId,
          journalId,
          partyOrgId,
          partyName,
          partyContactId,
          transactionDate: new Date().toISOString().split('T')[0], // Current date
          amount,
          sourceReference: payment.paymentNumber,
          status: 'Open',
          createdBy,
        });
        
        console.log(`Subledger entry created for line ${line.lineNumber}`);
      } catch (error) {
        console.error(`Error creating subledger entry for line ${line.lineNumber}:`, error);
        throw error;
      }
    }
  }

  /**
   * Gets party details based on transaction category
   */
  private async getPartyDetails(payment: Payment, transactionCategory: string): Promise<{
    partyOrgId: string;
    partyName: string;
    partyContactId?: string;
  }> {
    // For Payment category, use payee organization details
    if (transactionCategory === 'Payment') {
      // Get payee organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', payment.payeeOrganizationId)
        .single();

      if (orgError) {
        console.error('Error fetching payee organization:', orgError);
        throw new Error(`Failed to fetch payee organization: ${orgError.message}`);
      }

      // Get remit to contact ID from payment if available
      let partyContactId = undefined;
      if (payment.remitToContactId) {
        partyContactId = payment.remitToContactId;
      }

      return {
        partyOrgId: payment.payeeOrganizationId,
        partyName: orgData.name,
        partyContactId,
      };
    }

    throw new Error(`Unsupported transaction category for subledger: ${transactionCategory}`);
  }

  /**
   * Checks if the rule's triggering action matches the payment status
   */
  private matchesTriggeringAction(rule: AccountingRule, status: PaymentStatus): boolean {
    const actionStatusMap: Record<string, PaymentStatus> = {
      'Payment Created': 'Created',
      'Payment Approved': 'Approved',
      'Payment Processed': 'Approved', // Fallback for legacy rules
    };

    return actionStatusMap[rule.triggeringAction] === status;
  }

  /**
   * Checks if the rule's division matches the payment division
   */
  private matchesDivision(rule: AccountingRule, paymentDivisionId: string): boolean {
    // If rule has no division specified, it applies to all divisions
    if (!rule.divisionId) return true;
    
    return rule.divisionId === paymentDivisionId;
  }

  /**
   * Checks if the rule's transaction type matches the payment mode
   */
  private matchesTransactionType(rule: AccountingRule, paymentMode: string): boolean {
    // If rule has no transaction type specified, it applies to all payment modes
    if (!rule.transactionType) return true;
    
    return rule.transactionType === paymentMode;
  }

  /**
   * Gets the amount value based on the amount source
   */
  private getAmountFromSource(payment: Payment, amountSource: string): number {
    switch (amountSource.toLowerCase()) {
      case 'payment amount':
      case 'amount':
      case 'total amount':
        return payment.amount;
      case 'payment value':
        return payment.amount;
      default:
        console.warn(`Unknown amount source: ${amountSource}, using payment amount`);
        return payment.amount;
    }
  }
}

export const paymentJournalService = new PaymentJournalService();