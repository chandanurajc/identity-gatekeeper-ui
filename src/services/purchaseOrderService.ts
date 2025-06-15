
import { 
  getAllPurchaseOrders, 
  getPurchaseOrderById, 
  generatePONumber, 
  getDivisionShippingAddress 
} from './purchaseOrder/queries';
import { createPurchaseOrder } from './purchaseOrder/createPurchaseOrder';
import { updatePurchaseOrder } from './purchaseOrder/updatePurchaseOrder';
import { receivePurchaseOrder } from './purchaseOrder/receivePurchaseOrder';
import { cancelPurchaseOrder } from './purchaseOrder/cancelPurchaseOrder';

export const purchaseOrderService = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  generatePONumber,
  getDivisionShippingAddress,
};
