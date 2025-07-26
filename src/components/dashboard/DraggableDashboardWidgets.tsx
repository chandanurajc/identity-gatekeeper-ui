import React, { useMemo, useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { OpenPurchaseOrdersWidget } from "./OpenPurchaseOrdersWidget";
import { InvoicesPendingApprovalWidget } from "./InvoicesPendingApprovalWidget";
import { AccountsPayableBalanceWidget } from "./AccountsPayableBalanceWidget";
import { usePermissions } from "@/hooks/usePermissions";
import { useOrganizationId } from "@/hooks/useOrganizationId";

const WIDGET_KEYS = {
  OPEN_PO: "openPO",
  INVOICES_PENDING: "invoicesPending",
  AP_BALANCE: "apBalance",
};

interface Props {
  editing: boolean;
}

export const DraggableDashboardWidgets: React.FC<Props> = ({ editing }) => {
  const { hasPermission } = usePermissions();
  const organizationId = useOrganizationId();

  const widgets = useMemo(() => {
    const arr = [];
    if (hasPermission("View Open PO Widget")) arr.push(WIDGET_KEYS.OPEN_PO);
    if (hasPermission("Invoice awaiting approval") && organizationId) arr.push(WIDGET_KEYS.INVOICES_PENDING);
    if (hasPermission("AP Balance") && organizationId) arr.push(WIDGET_KEYS.AP_BALANCE);
    return arr;
  }, [hasPermission, organizationId]);

  const [widgetOrder, setWidgetOrder] = useState<string[]>(widgets);

  useEffect(() => {
    setWidgetOrder(widgets);
  }, [widgets.join(",")]);

  const widgetMap: Record<string, React.ReactNode> = {
    [WIDGET_KEYS.OPEN_PO]: <OpenPurchaseOrdersWidget />,
    [WIDGET_KEYS.INVOICES_PENDING]: organizationId ? <InvoicesPendingApprovalWidget organizationId={organizationId} /> : null,
    [WIDGET_KEYS.AP_BALANCE]: organizationId ? <AccountsPayableBalanceWidget /> : null,
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newOrder = Array.from(widgetOrder);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    setWidgetOrder(newOrder);
  };

  if (!widgetOrder.length) return null;

  if (!editing) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {widgetOrder.map((key) => widgetMap[key])}
      </div>
    );
  }

  // Use flexbox for drag-and-drop mode
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="dashboard-widgets" direction="horizontal">
        {(provided) => (
          <div
            className="flex gap-4 overflow-x-auto"
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ minHeight: 180 }}
          >
            {widgetOrder.map((key, idx) => (
              <Draggable key={key} draggableId={key} index={idx}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={
                      "bg-white rounded shadow p-2 transition-all min-w-[280px] max-w-xs flex-1 " +
                      (dragSnapshot.isDragging ? "ring-2 ring-primary" : "")
                    }
                    style={{ ...dragProvided.draggableProps.style }}
                  >
                    {widgetMap[key]}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
