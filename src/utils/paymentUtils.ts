import type { Profile, Payment } from '../types';

const GRACE_DAYS = 5;

// Usa joinDate si existe, si no cae en createdAt
const getJoinDate = (member: Profile): string =>
  (member.joinDate ?? member.createdAt).split('T')[0];

export function getDueDate(joinDate: string, cycle: number): string {
  const d = new Date(joinDate);
  d.setMonth(d.getMonth() + cycle);
  return d.toISOString().split('T')[0];
}

export function isGracePeriodExpired(dueDate: string): boolean {
  const due = new Date(dueDate);
  due.setDate(due.getDate() + GRACE_DAYS);
  return new Date() > due;
}

export function hasPendingOverduePayment(
  member: Profile,
  payments: Payment[]
): boolean {
  if (member.bypassSuspension) return false;
  return payments
    .filter(p => p.memberId === member.id)
    .some(p => (p.status === 'pending' || p.status === 'overdue') && isGracePeriodExpired(p.dueDate));
}

export function currentCycle(joinDate: string): number {
  const join = new Date(joinDate);
  const now = new Date();
  return (
    (now.getFullYear() - join.getFullYear()) * 12 +
    (now.getMonth() - join.getMonth())
  );
}

export function generateMissingPayments(
  member: Profile,
  payments: Payment[]
): Omit<Payment, 'id'>[] {
  const joinDate = getJoinDate(member);
  const cycle = currentCycle(joinDate);
  const missing: Omit<Payment, 'id'>[] = [];

  for (let i = 0; i <= cycle; i++) {
    const dueDate = getDueDate(joinDate, i);
    const exists = payments.some(
      p => p.memberId === member.id && p.dueDate.startsWith(dueDate.slice(0, 7))
    );
    if (!exists) {
      missing.push({
        memberId: member.id,
        amount: member.monthlyFee ?? 30000,
        currency: 'CLP',
        dueDate,
        paidAt: null,
        status: 'pending',
        method: 'cash',
      });
    }
  }
  return missing;
}