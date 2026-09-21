import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FormatUtils {
  formatDate(iso: string, includeTime = false): string {
    const date = new Date(iso);
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
    if (!includeTime) return formatted;
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${formatted} ${time}`;
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return this.formatDate(iso);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 1) + '…';
  }

  getStatusStyles(status: string): { bg: string; fg: string } {
    const statusStyles: Record<string, { bg: string; fg: string }> = {
      'New': { bg: '#F1F5F9', fg: '#475569' },
      'Review': { bg: '#FFFBEB', fg: '#B45309' },
      'Design': { bg: '#ECFEFF', fg: '#164E63' },
      'Production': { bg: '#EFF6FF', fg: '#1E40AF' },
      'Quality Check': { bg: '#F5F3FF', fg: '#5B21B6' },
      'Ready': { bg: '#ECFDF5', fg: '#065F46' },
      'Completed': { bg: '#ECFDF5', fg: '#065F46' },
      'Cancelled': { bg: '#FEF2F2', fg: '#B91C1C' },
      'Open': { bg: '#EFF6FF', fg: '#1E40AF' },
      'In Progress': { bg: '#FFFBEB', fg: '#B45309' },
      'Closed': { bg: '#F1F5F9', fg: '#64748B' },
      'Pending': { bg: '#F1F5F9', fg: '#64748B' },
      'Invoiced': { bg: '#EFF6FF', fg: '#1E40AF' },
      'Paid': { bg: '#ECFDF5', fg: '#065F46' },
      'Overdue': { bg: '#FEF2F2', fg: '#B91C1C' }
    };
    return statusStyles[status] || { bg: '#F1F5F9', fg: '#64748B' };
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'Low': '#94A3B8',
      'Normal': '#3B82F6',
      'High': '#F59E0B',
      'Urgent': '#EF4444'
    };
    return colors[priority] || '#94A3B8';
  }

  getPriorityDotClass(priority: string): string {
    const classes: Record<string, string> = {
      'Low': 'bg-slate-400',
      'Normal': 'bg-blue-500',
      'High': 'bg-amber-500',
      'Urgent': 'bg-red-500'
    };
    return classes[priority] || 'bg-slate-400';
  }

  getArchBadge(arch: string): { class: string; text: string } {
    if (arch === 'Both') {
      return { class: 'flex gap-0.5', text: '' };
    }
    return {
      class: arch === 'Maxilla' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-700',
      text: arch === 'Maxilla' ? 'MX' : 'MD'
    };
  }
}