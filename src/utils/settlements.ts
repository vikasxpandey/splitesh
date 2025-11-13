import type { Expense, Member, Settlement } from '../types'

export function calculateBalances(expenses: Expense[], members: Member[]) {
  const balances = new Map<string, number>()
  members.forEach((member) => balances.set(member.id, 0))

  expenses.forEach((expense) => {
    if (expense.splitBetween.length === 0) return
    const splitAmount = expense.amount / expense.splitBetween.length
    expense.splitBetween.forEach((memberId) => {
      balances.set(memberId, (balances.get(memberId) ?? 0) - splitAmount)
    })
    balances.set(expense.paidBy, (balances.get(expense.paidBy) ?? 0) + expense.amount)
  })

  return balances
}

export function calculateSettlements(expenses: Expense[], members: Member[]): Settlement[] {
  const balances = calculateBalances(expenses, members)
  const creditors: { memberId: string; amount: number }[] = []
  const debtors: { memberId: string; amount: number }[] = []

  balances.forEach((amount, memberId) => {
    if (amount > 0.01) {
      creditors.push({ memberId, amount })
    } else if (amount < -0.01) {
      debtors.push({ memberId, amount: Math.abs(amount) })
    }
  })

  const settlements: Settlement[] = []

  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]
    const amount = Math.min(creditor.amount, debtor.amount)

    settlements.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount,
    })

    creditor.amount -= amount
    debtor.amount -= amount

    if (creditor.amount <= 0.01) creditorIndex += 1
    if (debtor.amount <= 0.01) debtorIndex += 1
  }

  return settlements
}

export function formatCurrency(amount: number, locale = 'hi-IN', currency = 'INR') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

