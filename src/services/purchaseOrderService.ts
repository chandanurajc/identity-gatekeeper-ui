
import { 
  getAllPurchaseOrders, 
  getPurchaseOrderById, 
  generatePONumber, 
  getDivisionShippingAddress 
} from './purchaseOrder/queries';
import { 
  createPurchaseOrder, 
  updatePurchaseOrder 
} from './purchaseOrder/mutations';

export const purchaseOrderService = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  generatePONumber,
  getDivisionShippingAddress,
};
