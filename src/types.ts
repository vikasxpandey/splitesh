export type Member = {
  id: string
  name: string
}

export type Expense = {
  id: string
  description: string
  amount: number
  paidBy: string
  splitBetween: string[]
  createdAt: string
}

export type Group = {
  id: string
  name: string
  members: Member[]
  expenses: Expense[]
}

export type Balance = {
  memberId: string
  amount: number
}

export type Settlement = {
  from: string
  to: string
  amount: number
}

