import { Case, LabDocument, Order } from "@core/models";

export function getCaseOrders(caseItem: Case, orders: Order[]): Order[] {
  return orders
    .filter((order) => order.patientId === caseItem.patientId)
    .sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt));
}

export function getCaseDocuments(
  caseItem: Case,
  caseOrders: Order[],
  documents: LabDocument[],
): LabDocument[] {
  const casePatient = normalize(caseItem.patientName);
  const orderIds = new Set(caseOrders.map((order) => order.id));

  return documents
    .filter((doc) => {
      const byPatient = normalize(doc.patientName) === casePatient;
      const byOrder = !!doc.orderId && orderIds.has(doc.orderId);
      return byPatient || byOrder;
    })
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date));
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function toTimestamp(dateValue: string): number {
  const timestamp = Date.parse(dateValue);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
