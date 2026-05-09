import { useMemo, useState, useEffect } from 'react'
import { Box, Button, Card, CardContent, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, Tab, Tabs, Typography } from '@mui/material'
import { Add, PersonAdd } from '@mui/icons-material'

import type { Group, ExpenseFormState } from './types'
import { calculateBalances, calculateSettlements } from './utils/settlements'
import { storage } from './utils/storage'

import { TopBar } from './components/TopBar'
import { GroupSelector } from './components/GroupSelector'
import { ExpensesTab } from './components/ExpensesTab'
import { BalancesTab } from './components/BalancesTab'
import { SettleUpTab } from './components/SettleUpTab'
import { ItemContextMenu } from './components/ItemContextMenu'
import { GroupDialog } from './components/GroupDialog'
import { MemberDialog } from './components/MemberDialog'
import { ExpenseDialog } from './components/ExpenseDialog'

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11)

function App() {
  // ===== State =====
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  // Group dialog
  const [isGroupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupNameError, setGroupNameError] = useState('')

  // Member dialog
  const [isMemberDialogOpen, setMemberDialogOpen] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberError, setMemberError] = useState('')

  // Expense dialog
  const [isExpenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    description: '',
    amount: '',
    paidBy: '',
    splitBetween: {},
  })
  const [expenseError, setExpenseError] = useState<string | null>(null)

  // Inline editing
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null)
  const [editGroupNameValue, setEditGroupNameValue] = useState('')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editMemberNameValue, setEditMemberNameValue] = useState('')

  // Menus
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(null)
  const [itemMenuAnchor, setItemMenuAnchor] = useState<null | HTMLElement>(null)
  const [itemMenuTarget, setItemMenuTarget] = useState<{ type: 'expense' | 'member'; id: string } | null>(null)

  // ===== Derived state =====
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? groups[0] ?? null,
    [groups, selectedGroupId],
  )

  const balances = useMemo(() => {
    if (!selectedGroup) return new Map<string, number>()
    return calculateBalances(selectedGroup.expenses || [], selectedGroup.members || [])
  }, [selectedGroup])

  const settlements = useMemo(() => {
    if (!selectedGroup) return []
    return calculateSettlements(selectedGroup.expenses || [], selectedGroup.members || [])
  }, [selectedGroup])

  const totalSpent = useMemo(
    () => selectedGroup?.expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0,
    [selectedGroup],
  )

  // ===== Data loading =====
  useEffect(() => {
    storage.listGroups()
      .then(fetchedGroups => {
        setGroups(fetchedGroups)
        if (fetchedGroups.length > 0 && !selectedGroupId) {
          setSelectedGroupId(fetchedGroups[0].id)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedGroupId) return
    Promise.all([storage.getGroup(selectedGroupId), storage.getExpenses(selectedGroupId)])
      .then(([groupDetails, expenses]) => {
        setGroups(prev => prev.map(g => g.id === selectedGroupId ? { ...groupDetails, expenses } : g))
      })
      .catch(console.error)
  }, [selectedGroupId])

  // ===== Group handlers =====
  const handleCreateGroup = async () => {
    if (!groupName.trim()) { setGroupNameError('Please enter a group name'); return }
    try {
      const newGroup = await storage.createGroup(groupName.trim(), [])
      setGroups(prev => [...prev, { ...newGroup, expenses: [] }])
      setSelectedGroupId(newGroup.id)
      setGroupName('')
      setGroupNameError('')
      setGroupDialogOpen(false)
    } catch {
      setGroupNameError('Failed to create group')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await storage.deleteGroup(groupId)
      setGroups(prev => prev.filter(g => g.id !== groupId))
      if (selectedGroupId === groupId) {
        const remaining = groups.filter(g => g.id !== groupId)
        setSelectedGroupId(remaining[0]?.id ?? null)
      }
    } catch (e) { console.error(e) }
  }

  const handleUpdateGroupName = async (groupId: string) => {
    const name = editGroupNameValue.trim()
    if (!name) { setEditingGroupName(null); return }
    try {
      const updated = await storage.updateGroupName(groupId, name)
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: updated.name } : g))
    } catch (e) { console.error(e) }
    setEditingGroupName(null)
  }

  // ===== Member handlers =====
  const handleMemberDialogOpen = () => {
    setMemberName('')
    setMemberError('')
    setMemberDialogOpen(true)
  }

  const handleAddMember = async () => {
    if (!selectedGroup) return
    const name = memberName.trim()
    if (!name) { setMemberError('Please enter a member name'); return }
    if (selectedGroup.members.some(m => m.name.toLowerCase() === name.toLowerCase())) {
      setMemberError('This name already exists in the group'); return
    }
    try {
      const updated = await storage.addMember(selectedGroup.id, { id: createId(), name })
      setGroups(prev => prev.map(g => g.id === updated.id ? { ...updated, expenses: selectedGroup.expenses } : g))
      setMemberDialogOpen(false)
      setMemberName('')
    } catch { setMemberError('Failed to add member') }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return
    try {
      const updated = await storage.removeMember(selectedGroup.id, memberId)
      setGroups(prev => prev.map(g => g.id === updated.id ? updated : g))
    } catch (e) { console.error(e) }
  }

  const handleUpdateMemberName = async (memberId: string) => {
    if (!selectedGroup) return
    const name = editMemberNameValue.trim()
    if (!name) { setEditingMemberId(null); return }
    if (selectedGroup.members.some(m => m.id !== memberId && m.name.toLowerCase() === name.toLowerCase())) {
      setEditingMemberId(null); return
    }
    try {
      const updated = await storage.updateMemberName(selectedGroup.id, memberId, name)
      setGroups(prev => prev.map(g => g.id === selectedGroup.id ? { ...g, members: updated.members } : g))
    } catch (e) { console.error(e) }
    setEditingMemberId(null)
  }

  // ===== Expense handlers =====
  const openExpenseDialog = (expenseId?: string) => {
    if (!selectedGroup || selectedGroup.members.length === 0) {
      setExpenseError('Add at least one member before creating an expense.')
      return
    }
    if (expenseId) {
      const expense = selectedGroup.expenses.find(e => e.id === expenseId)
      if (!expense) return
      setExpenseForm({
        description: expense.description,
        amount: expense.amount.toString(),
        paidBy: expense.paidBy,
        splitBetween: selectedGroup.members.reduce<Record<string, boolean>>((acc, m) => {
          acc[m.id] = expense.splitBetween.includes(m.id)
          return acc
        }, {}),
      })
      setEditingExpenseId(expenseId)
    } else {
      setExpenseForm({
        description: '',
        amount: '',
        paidBy: selectedGroup.members[0]?.id ?? '',
        splitBetween: selectedGroup.members.reduce<Record<string, boolean>>((acc, m) => {
          acc[m.id] = true; return acc
        }, {}),
      })
      setEditingExpenseId(null)
    }
    setExpenseError(null)
    setExpenseDialogOpen(true)
  }

  const handleExpenseChange = (field: keyof ExpenseFormState, value: string | number) => {
    setExpenseForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleSplitMember = (memberId: string) => {
    setExpenseForm(prev => ({
      ...prev,
      splitBetween: { ...prev.splitBetween, [memberId]: !prev.splitBetween[memberId] },
    }))
  }

  const handleSaveExpense = async () => {
    if (!selectedGroup) return
    const amount = Number.parseFloat(expenseForm.amount)
    if (!expenseForm.description.trim()) { setExpenseError('Enter a description.'); return }
    if (!Number.isFinite(amount) || amount <= 0) { setExpenseError('Enter a valid positive amount.'); return }
    if (!expenseForm.paidBy) { setExpenseError('Select who paid.'); return }
    const participants = Object.entries(expenseForm.splitBetween).filter(([, v]) => v).map(([id]) => id)
    if (participants.length === 0) { setExpenseError('Select at least one participant.'); return }
    const data = { description: expenseForm.description.trim(), amount, paidBy: expenseForm.paidBy, splitBetween: participants }
    try {
      if (editingExpenseId) {
        const updated = await storage.updateExpense(selectedGroup.id, editingExpenseId, data)
        setGroups(prev => prev.map(g => g.id === selectedGroup.id
          ? { ...g, expenses: g.expenses.map(e => e.id === editingExpenseId ? updated : e) }
          : g
        ))
      } else {
        const newExpense = await storage.addExpense(selectedGroup.id, data)
        setGroups(prev => prev.map(g => g.id === selectedGroup.id
          ? { ...g, expenses: [newExpense, ...g.expenses] }
          : g
        ))
      }
      setExpenseDialogOpen(false)
      setEditingExpenseId(null)
    } catch { setExpenseError('Failed to save expense') }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedGroup) return
    try {
      await storage.deleteExpense(selectedGroup.id, expenseId)
      setGroups(prev => prev.map(g => g.id === selectedGroup.id
        ? { ...g, expenses: g.expenses.filter(e => e.id !== expenseId) }
        : g
      ))
    } catch (e) { console.error(e) }
  }

  // ===== Menu handlers =====
  const handleItemMenuOpen = (event: React.MouseEvent<HTMLElement>, type: 'expense' | 'member', id: string) => {
    event.stopPropagation()
    setItemMenuAnchor(event.currentTarget)
    setItemMenuTarget({ type, id })
  }

  const handleItemMenuClose = () => {
    setItemMenuAnchor(null)
    setItemMenuTarget(null)
  }

  // ===== Render =====
  return (
    <Box sx={{ minHeight: '100vh', pb: 12 }}>
      <TopBar />

      <Container maxWidth="sm" sx={{ pt: 2.5, px: { xs: 2, sm: 3 } }}>
        {groups.length > 0 && (
          <GroupSelector
            groups={groups}
            selectedGroup={selectedGroup}
            selectedGroupId={selectedGroupId}
            totalSpent={totalSpent}
            groupMenuAnchor={groupMenuAnchor}
            setGroupMenuAnchor={setGroupMenuAnchor}
            editingGroupName={editingGroupName}
            setEditingGroupName={setEditingGroupName}
            editGroupNameValue={editGroupNameValue}
            setEditGroupNameValue={setEditGroupNameValue}
            handleUpdateGroupName={handleUpdateGroupName}
            handleDeleteGroup={handleDeleteGroup}
            setSelectedGroupId={(id) => setSelectedGroupId(id)}
            setActiveTab={setActiveTab}
            setGroupDialogOpen={setGroupDialogOpen}
          />
        )}

        {selectedGroup ? (
          <>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                mb: 2.5,
                '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', minHeight: 44 },
              }}
            >
              <Tab label="Expenses" />
              <Tab label="Balances" />
              <Tab label="Settle up" />
            </Tabs>

            {activeTab === 0 && (
              <ExpensesTab
                selectedGroup={selectedGroup}
                openExpenseDialog={openExpenseDialog}
                handleItemMenuOpen={handleItemMenuOpen}
              />
            )}
            {activeTab === 1 && (
              <BalancesTab
                selectedGroup={selectedGroup}
                balances={balances}
                editingMemberId={editingMemberId}
                setEditingMemberId={setEditingMemberId}
                editMemberNameValue={editMemberNameValue}
                setEditMemberNameValue={setEditMemberNameValue}
                handleUpdateMemberName={handleUpdateMemberName}
                handleItemMenuOpen={handleItemMenuOpen}
                handleMemberDialogOpen={handleMemberDialogOpen}
              />
            )}
            {activeTab === 2 && (
              <SettleUpTab settlements={settlements} selectedGroup={selectedGroup} />
            )}
          </>
        ) : (
          <Card sx={{ textAlign: 'center', py: 6, mt: 4 }}>
            <CardContent>
              <Typography sx={{ fontSize: '3rem', mb: 2 }}>💰</Typography>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Split expenses easily</Typography>
              <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 320, mx: 'auto', fontSize: '0.875rem' }}>
                Create a group, add friends, and track who owes what.
              </Typography>
              <Button variant="contained" size="large" startIcon={<Add />} onClick={() => setGroupDialogOpen(true)}>
                Create a group
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* FAB */}
      {selectedGroup && activeTab === 0 && (
        <Fab
          color="primary"
          onClick={() => openExpenseDialog()}
          disabled={selectedGroup.members.length === 0}
          sx={{ position: 'fixed', bottom: 24, right: 24, boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)' }}
        >
          <Add />
        </Fab>
      )}
      {selectedGroup && activeTab === 1 && (
        <Fab
          color="primary"
          variant="extended"
          onClick={handleMemberDialogOpen}
          sx={{ position: 'fixed', bottom: 24, right: 24, boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)' }}
        >
          <PersonAdd sx={{ mr: 1 }} />
          Add member
        </Fab>
      )}

      {/* Context menu */}
      <ItemContextMenu
        anchorEl={itemMenuAnchor}
        target={itemMenuTarget}
        onClose={handleItemMenuClose}
        selectedGroup={selectedGroup}
        openExpenseDialog={openExpenseDialog}
        handleDeleteExpense={handleDeleteExpense}
        setEditingMemberId={setEditingMemberId}
        setEditMemberNameValue={setEditMemberNameValue}
        handleRemoveMember={handleRemoveMember}
      />

      {/* Dialogs */}
      <GroupDialog
        isOpen={isGroupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        groupName={groupName}
        setGroupName={setGroupName}
        groupNameError={groupNameError}
        setGroupNameError={setGroupNameError}
        handleCreateGroup={handleCreateGroup}
      />
      <MemberDialog
        isOpen={isMemberDialogOpen}
        onClose={() => setMemberDialogOpen(false)}
        selectedGroup={selectedGroup}
        memberName={memberName}
        setMemberName={setMemberName}
        memberError={memberError}
        setMemberError={setMemberError}
        handleAddMember={handleAddMember}
      />
      <ExpenseDialog
        isOpen={isExpenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
        editingExpenseId={editingExpenseId}
        setEditingExpenseId={setEditingExpenseId}
        selectedGroup={selectedGroup}
        expenseForm={expenseForm}
        expenseError={expenseError}
        handleExpenseChange={handleExpenseChange}
        toggleSplitMember={toggleSplitMember}
        handleSaveExpense={handleSaveExpense}
      />

      {/* Error prompt (when expense error shown outside dialog) */}
      <Dialog
        open={Boolean(expenseError) && !isExpenseDialogOpen}
        onClose={() => setExpenseError(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Action required</DialogTitle>
        <DialogContent>
          <DialogContentText>{expenseError}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="contained" onClick={() => setExpenseError(null)}>Okay</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default App
