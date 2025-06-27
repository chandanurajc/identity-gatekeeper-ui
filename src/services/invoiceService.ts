
import { getInvoices, getInvoiceById } from './invoice/queries';
import { createInvoiceFromReceivedPO, approveInvoice } from './invoice/mutations';

export const invoiceService = {
  getInvoices,
  getInvoiceById,
  createInvoiceFromReceivedPO,
  approveInvoice,
};
