import { statusStylesFor } from "./status-styles";

describe("statusStylesFor", () => {
  it("defines styles for statuses used across orders and dashboard surfaces", () => {
    const statuses = [
      "New",
      "Review",
      "Design",
      "Production",
      "Quality Check",
      "Ready",
      "Completed",
      "Done",
      "Cancelled",
      "Blocked",
      "Open",
      "In Progress",
      "Closed",
      "Pending",
      "Invoiced",
      "Paid",
      "Overdue",
      "Active",
      "Inactive",
    ];

    for (const status of statuses) {
      const style = statusStylesFor(status);
      expect(style.bg).withContext(status).toMatch(/^#/);
      expect(style.fg).withContext(status).toMatch(/^#/);
    }
  });
});
