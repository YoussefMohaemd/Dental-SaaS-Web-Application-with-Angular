import { Injectable } from "@angular/core";
import { priorityColor, priorityDotClass } from "@shared/utils/priority-styles";
import { statusStylesFor } from "@shared/utils/status-styles";

@Injectable({ providedIn: "root" })
export class FormatUtils {
  formatDate(iso: string, includeTime = false): string {
    const date = new Date(iso);
    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
    if (!includeTime) return formatted;
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${formatted} ${time}`;
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return this.formatDate(iso);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + "…";
  }

  getStatusStyles(status: string): { bg: string; fg: string } {
    return statusStylesFor(status);
  }

  getPriorityColor(priority: string): string {
    return priorityColor(priority);
  }

  getPriorityDotClass(priority: string): string {
    return priorityDotClass(priority);
  }

  getArchBadge(arch: string): { class: string; text: string } {
    if (arch === "Both") {
      return { class: "flex gap-0.5", text: "" };
    }
    return {
      class:
        arch === "Maxilla"
          ? "bg-blue-50 text-blue-700"
          : "bg-teal-50 text-teal-700",
      text: arch === "Maxilla" ? "MX" : "MD",
    };
  }
}
