import type { Group, Expense } from '../types';

const API_BASE_URL = '/api'; // Azure Functions proxies usually map /api/* to the function

export const api = {
    createGroup: async (name: string, members: { id: string; name: string }[]): Promise<Group> => {
        const response = await fetch(`${API_BASE_URL}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, members }),
        });
        if (!response.ok) throw new Error('Failed to create group');
        return response.json();
    },

    getGroup: async (groupId: string): Promise<Group> => {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`);
        if (!response.ok) throw new Error('Failed to fetch group');
        return response.json();
    },

    addExpense: async (groupId: string, expense: Omit<Expense, 'id' | 'createdAt' | 'groupId'>): Promise<Expense> => {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense),
        });
        if (!response.ok) throw new Error('Failed to add expense');
        return response.json();
    },

    getExpenses: async (groupId: string): Promise<Expense[]> => {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses`);
        if (!response.ok) throw new Error('Failed to fetch expenses');
        return response.json();
    },

    listGroups: async (): Promise<Group[]> => {
        const response = await fetch(`${API_BASE_URL}/groups`);
        if (!response.ok) throw new Error('Failed to fetch groups');
        return response.json();
    },

    addMember: async (groupId: string, member: { id: string; name: string }): Promise<Group> => {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(member),
        });
        if (!response.ok) throw new Error('Failed to add member');
        return response.json();
    },

    deleteGroup: async (groupId: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete group');
    },

    removeMember: async (groupId: string, memberId: string): Promise<Group> => {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${memberId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to remove member');
        return response.json();
    },

    deleteExpense: async (groupId: string, expenseId: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/expenses/${expenseId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete expense');
    },
};
