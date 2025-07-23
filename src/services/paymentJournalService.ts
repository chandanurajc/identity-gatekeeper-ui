import { supabase } from '@/integrations/supabase/client';
import { journalService } from './journalService';
import { accountingRulesService } from './accountingRulesService';
import type { Payment, PaymentStatus } from '@/types/payment';
import type { AccountingRule } from '@/types/accountingRules';
import type { JournalFormData } from '@/types/journal';

export class PaymentJournalService {
  
  /**
   * Creates journal entries for payment based on accounting rules
   */
  async createPaymentJournal(
    payment: Payment,
    status: PaymentStatus,
    createdBy: string
  ): Promise<void> {
    try {
      // Find matching accounting rules for Payment category
      const accountingRules = await accountingRulesService.getAccountingRules(payment.organizationId);
      
      const matchingRules = accountingRules.filter(rule => 
        rule.transactionCategory === 'Payment' &&
        this.matchesTriggeringAction(rule, status) &&
        this.matchesDivision(rule, payment.divisionId) &&
        this.matchesTransactionType(rule, payment.paymentMode) &&
        rule.status === 'Active'
      );

      if (matchingRules.length === 0) {
        console.warn(`No matching accounting rules found for payment ${payment.paymentNumber} with status ${status}`);
        return;
      }

      // Create journal entries for each matching rule
      for (const rule of matchingRules) {
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
    const journalLines = rule.lines.map((line, index) => ({
      lineNumber: line.lineNumber,
      accountCode: line.debitAccountCode || line.creditAccountCode || '',
      debitAmount: line.debitAccountCode ? this.getAmountFromSource(payment, line.amountSource) : undefined,
      creditAmount: line.creditAccountCode ? this.getAmountFromSource(payment, line.amountSource) : undefined,
      narration: `${rule.ruleName} - Payment ${payment.paymentNumber} - ${status}`,
    }));

    const journalData: JournalFormData = {
      journalDate: payment.paymentDate,
      transactionType: 'Payment',
      transactionReference: payment.paymentNumber,
      journalLines,
    };

    await journalService.createJournal(journalData, payment.organizationId, createdBy);
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