import type { Group, Expense } from '../types';

const STORAGE_KEY = 'splitesh_groups';

function readGroups(): Group[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeGroups(groups: Group[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

const createId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2, 11);
};

export const localApi = {
    listGroups: async (): Promise<Group[]> => {
        return readGroups();
    },

    createGroup: async (name: string, members: { id: string; name: string }[]): Promise<Group> => {
        const groups = readGroups();
        const newGroup: Group = {
            id: createId(),
            name,
            members,
            expenses: [],
        };
        groups.push(newGroup);
        writeGroups(groups);
        return newGroup;
    },

    getGroup: async (groupId: string): Promise<Group> => {
        const groups = readGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) throw new Error(`Group ${groupId} not found`);
        return group;
    },

    addMember: async (groupId: string, member: { id: string; name: string }): Promise<Group> => {
        const groups = readGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) throw new Error(`Group ${groupId} not found`);
        group.members.push(member);
        writeGroups(groups);
        return group;
    },

    addExpense: async (
        groupId: string,
        expense: Omit<Expense, 'id' | 'createdAt' | 'groupId'>,
    ): Promise<Expense> => {
        const groups = readGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) throw new Error(`Group ${groupId} not found`);

        const newExpense: Expense = {
            ...expense,
            id: createId(),
            createdAt: new Date().toISOString(),
        };
        group.expenses.push(newExpense);
        writeGroups(groups);
        return newExpense;
    },

    getExpenses: async (groupId: string): Promise<Expense[]> => {
        const groups = readGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) throw new Error(`Group ${groupId} not found`);
        return group.expenses;
    },

    deleteGroup: async (groupId: string): Promise<void> => {
        const groups = readGroups().filter(g => g.id !== groupId);
        writeGroups(groups);
    },

    removeMember: async (groupId: string, memberId: string): Promise<Group> => {
        const groups = readGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) throw new Error(`Group ${groupId} not found`);
        group.members = group.members.filter(m => m.id !== memberId);
        group.expenses = group.expenses.filter(
            e => e.paidBy !== memberId && !e.splitBetween.includes(memberId),
        );
        writeGroups(groups);
        return group;
    },

    deleteExpense: async (groupId: string, expenseId: string): Promise<void> => {
        const groups = readGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) throw new Error(`Group ${groupId} not found`);
        group.expenses = group.expenses.filter(e => e.id !== expenseId);
        writeGroups(groups);
    },
};
