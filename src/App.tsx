import { type ReactNode, useMemo, useState, useEffect } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Checkbox,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  Grid
} from '@mui/material'

import {
  Add,
  ArrowForward,
  Check,
  Close,
  DarkMode,
  DeleteOutline,
  Edit,
  Group as GroupIcon,
  GroupAdd,
  LightMode,
  Payments,
  PersonAdd,
  ReceiptLong,
  TrendingDown,
  TrendingUp,
} from '@mui/icons-material'
import type { Group, Member } from './types'
import { calculateBalances, calculateSettlements, formatCurrency } from './utils/settlements'
import { storage } from './utils/storage'
import { useThemeMode } from './ThemeContext'

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 11)
}

type ExpenseFormState = {
  description: string
  amount: string
  paidBy: string
  splitBetween: Record<string, boolean>
}

// Gradient palette for avatars
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #2563eb, #0ea5e9)',
  'linear-gradient(135deg, #14b8a6, #06b6d4)',
  'linear-gradient(135deg, #f43f5e, #ec4899)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

function getAvatarGradient(index: number) {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
}

function App() {
  const { mode, toggleMode } = useThemeMode()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // --- Data Loading ---
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

  // Refresh selected group data when selected
  useEffect(() => {
    if (!selectedGroupId) return;

    const refreshGroup = async () => {
      try {
        const [groupDetails, expenses] = await Promise.all([
          storage.getGroup(selectedGroupId),
          storage.getExpenses(selectedGroupId)
        ])
        setGroups(prev => prev.map(g =>
          g.id === selectedGroupId
            ? { ...groupDetails, expenses }
            : g
        ))
      } catch (e) {
        console.error(e)
      }
    }
    refreshGroup()
  }, [selectedGroupId])


  const [isGroupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupNameError, setGroupNameError] = useState('')

  const [isMemberDialogOpen, setMemberDialogOpen] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberError, setMemberError] = useState('')

  const [isExpenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    description: '',
    amount: '',
    paidBy: '',
    splitBetween: {},
  })
  const [expenseError, setExpenseError] = useState<string | null>(null)

  // Inline editing state
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null)
  const [editGroupNameValue, setEditGroupNameValue] = useState('')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editMemberNameValue, setEditMemberNameValue] = useState('')

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null,
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

  const totalSpent = useMemo(() => {
    if (!selectedGroup || !selectedGroup.expenses) return 0
    return selectedGroup.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [selectedGroup])

  const totalMembers = selectedGroup?.members.length ?? 0

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setGroupNameError('Please enter a group name')
      return
    }

    try {
      const newGroup = await storage.createGroup(groupName.trim(), [])
      setGroups((prev) => [...prev, { ...newGroup, expenses: [] }])
      setSelectedGroupId(newGroup.id)

      setGroupName('')
      setGroupNameError('')
      setGroupDialogOpen(false)
    } catch (e) {
      console.error(e)
      setGroupNameError('Failed to create group')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await storage.deleteGroup(groupId)
      setGroups((prev) => prev.filter((group) => group.id !== groupId))
      if (selectedGroupId === groupId) {
        setSelectedGroupId(() => {
          const remainingGroups = groups.filter((group) => group.id !== groupId)
          return remainingGroups[0]?.id ?? null
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleMemberDialogOpen = () => {
    setMemberName('')
    setMemberError('')
    setMemberDialogOpen(true)
  }

  const handleAddMember = async () => {
    if (!selectedGroup) return

    const name = memberName.trim()
    if (!name) {
      setMemberError('Please enter a member name')
      return
    }

    const exists = selectedGroup.members.some(
      (member) => member.name.toLowerCase() === name.toLowerCase(),
    )
    if (exists) {
      setMemberError('A member with this name already exists in the group')
      return
    }

    try {
      const updatedGroup = await storage.addMember(selectedGroup.id, { id: createId(), name })

      setGroups((prev) => prev.map((group) =>
        group.id === updatedGroup.id
          ? { ...updatedGroup, expenses: selectedGroup.expenses }
          : group
      ))

      setMemberDialogOpen(false)
      setMemberName('')
    } catch (e) {
      console.error(e)
      setMemberError('Failed to add member')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return

    try {
      const updatedGroup = await storage.removeMember(selectedGroup.id, memberId)
      setGroups((prev) => prev.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)))
    } catch (e) {
      console.error(e)
    }
  }

  const openExpenseDialog = (expenseId?: string) => {
    if (!selectedGroup || selectedGroup.members.length === 0) {
      setExpenseError('Add at least one member before creating an expense.')
      return
    }

    if (expenseId) {
      // Editing existing expense
      const expense = selectedGroup.expenses.find(e => e.id === expenseId)
      if (!expense) return
      const membersState = selectedGroup.members.reduce<Record<string, boolean>>((acc, member) => {
        acc[member.id] = expense.splitBetween.includes(member.id)
        return acc
      }, {})
      setExpenseForm({
        description: expense.description,
        amount: expense.amount.toString(),
        paidBy: expense.paidBy,
        splitBetween: membersState,
      })
      setEditingExpenseId(expenseId)
    } else {
      // New expense
      const membersState = selectedGroup.members.reduce<Record<string, boolean>>((acc, member) => {
        acc[member.id] = true
        return acc
      }, {})
      setExpenseForm({
        description: '',
        amount: '',
        paidBy: selectedGroup.members[0]?.id ?? '',
        splitBetween: membersState,
      })
      setEditingExpenseId(null)
    }
    setExpenseError(null)
    setExpenseDialogOpen(true)
  }

  const handleExpenseChange = (field: keyof ExpenseFormState, value: string | number) => {
    setExpenseForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const toggleSplitMember = (memberId: string) => {
    setExpenseForm((prev) => ({
      ...prev,
      splitBetween: {
        ...prev.splitBetween,
        [memberId]: !prev.splitBetween[memberId],
      },
    }))
  }

  const handleSaveExpense = async () => {
    if (!selectedGroup) return

    const amount = Number.parseFloat(expenseForm.amount)
    if (!expenseForm.description.trim()) {
      setExpenseError('Enter a description for the expense.')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setExpenseError('Enter a valid positive amount.')
      return
    }
    if (!expenseForm.paidBy) {
      setExpenseError('Select who paid the expense.')
      return
    }

    const participants = Object.entries(expenseForm.splitBetween)
      .filter(([, selected]) => selected)
      .map(([memberId]) => memberId)

    if (participants.length === 0) {
      setExpenseError('Select at least one participant to split the expense.')
      return
    }

    const expenseData = {
      description: expenseForm.description.trim(),
      amount,
      paidBy: expenseForm.paidBy,
      splitBetween: participants,
    }

    try {
      if (editingExpenseId) {
        // Update existing expense
        const updatedExpense = await storage.updateExpense(selectedGroup.id, editingExpenseId, expenseData)
        const updatedGroup: Group = {
          ...selectedGroup,
          expenses: selectedGroup.expenses.map(e => e.id === editingExpenseId ? updatedExpense : e),
        }
        setGroups((prev) => prev.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)))
      } else {
        // Create new expense
        const newExpense = await storage.addExpense(selectedGroup.id, expenseData)
        const updatedGroup: Group = {
          ...selectedGroup,
          expenses: [newExpense, ...selectedGroup.expenses],
        }
        setGroups((prev) => prev.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)))
      }
      setExpenseDialogOpen(false)
      setEditingExpenseId(null)
    } catch (e) {
      console.error(e)
      setExpenseError('Failed to save expense')
    }
  }

  const handleUpdateGroupName = async (groupId: string) => {
    const name = editGroupNameValue.trim()
    if (!name) {
      setEditingGroupName(null)
      return
    }
    try {
      const updatedGroup = await storage.updateGroupName(groupId, name)
      setGroups((prev) => prev.map(g => g.id === groupId ? { ...g, name: updatedGroup.name } : g))
    } catch (e) {
      console.error(e)
    }
    setEditingGroupName(null)
  }

  const handleUpdateMemberName = async (memberId: string) => {
    if (!selectedGroup) return
    const name = editMemberNameValue.trim()
    if (!name) {
      setEditingMemberId(null)
      return
    }
    // Check for duplicate
    const exists = selectedGroup.members.some(
      m => m.id !== memberId && m.name.toLowerCase() === name.toLowerCase()
    )
    if (exists) {
      setEditingMemberId(null)
      return
    }
    try {
      const updatedGroup = await storage.updateMemberName(selectedGroup.id, memberId, name)
      setGroups((prev) => prev.map(g => g.id === selectedGroup.id ? { ...g, members: updatedGroup.members } : g))
    } catch (e) {
      console.error(e)
    }
    setEditingMemberId(null)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedGroup) return

    try {
      await storage.deleteExpense(selectedGroup.id, expenseId)
      const updatedGroup: Group = {
        ...selectedGroup,
        expenses: selectedGroup.expenses.filter((expense) => expense.id !== expenseId),
      }
      setGroups((prev) => prev.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      {/* ===== APP BAR ===== */}
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2 } }}>
          <Box
            sx={{
              mr: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              animation: 'pulse-glow 3s ease-in-out infinite',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            💸
          </Box>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              letterSpacing: '-0.02em',
              background: mode === 'dark'
                ? 'linear-gradient(135deg, #f1f5f9, #94a3b8)'
                : 'linear-gradient(135deg, #1e293b, #475569)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Splitesh
          </Typography>
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              onClick={toggleMode}
              size="small"
              sx={{
                mr: { xs: 0.5, sm: 1 },
                color: mode === 'dark' ? '#fbbf24' : '#2563eb',
                background: mode === 'dark' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                '&:hover': {
                  background: mode === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(37, 99, 235, 0.15)',
                },
              }}
            >
              {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>
          {/* Icon-only on mobile, full button on desktop */}
          <Tooltip title="New Group">
            <IconButton
              onClick={() => setGroupDialogOpen(true)}
              sx={{
                display: { xs: 'inline-flex', sm: 'none' },
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3b82f6, #38bdf8)',
                },
              }}
              size="small"
            >
              <Add />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<GroupAdd />}
            onClick={() => setGroupDialogOpen(true)}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            New Group
          </Button>
        </Toolbar>
      </AppBar>

      {/* ===== MOBILE GROUP SELECTOR ===== */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          px: 2,
          pt: 2,
          pb: 0,
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: 'auto',
            pb: 1,
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {groups.map((group, index) => (
            <Chip
              key={group.id}
              avatar={
                <Avatar
                  sx={{
                    background: `${getAvatarGradient(index)} !important`,
                    width: 28,
                    height: 28,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#fff !important',
                  }}
                >
                  {group.name[0]?.toUpperCase()}
                </Avatar>
              }
              label={group.name}
              onClick={() => setSelectedGroupId(group.id)}
              onDelete={() => handleDeleteGroup(group.id)}
              deleteIcon={<DeleteOutline sx={{ fontSize: '16px !important' }} />}
              variant={group.id === selectedGroup?.id ? 'filled' : 'outlined'}
              sx={{
                flexShrink: 0,
                borderRadius: 3,
                height: 38,
                px: 0.5,
                fontWeight: 600,
                fontSize: '0.8rem',
                ...(group.id === selectedGroup?.id
                  ? {
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'primary.light',
                  }
                  : {
                    borderColor: 'divider',
                    color: 'text.secondary',
                  }),
              }}
            />
          ))}
          <Chip
            icon={<Add sx={{ fontSize: '18px !important' }} />}
            label="New"
            onClick={() => setGroupDialogOpen(true)}
            variant="outlined"
            sx={{
              flexShrink: 0,
              borderRadius: 3,
              height: 38,
              borderColor: 'rgba(99, 102, 241, 0.3)',
              borderStyle: 'dashed',
              color: 'primary.light',
              fontWeight: 600,
              fontSize: '0.8rem',
            }}
          />
        </Stack>
      </Box>

      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* ===== GROUPS SIDEBAR (desktop only) ===== */}
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Card
              sx={{
                height: '100%',
                animation: 'fadeInUp 0.5s ease-out',
              }}
            >
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    Groups
                  </Typography>
                  <Tooltip title="Create group">
                    <IconButton
                      onClick={() => setGroupDialogOpen(true)}
                      sx={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        '&:hover': {
                          background: 'rgba(99, 102, 241, 0.2)',
                        },
                      }}
                    >
                      <Add sx={{ color: 'primary.light', fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
                {groups.length === 0 ? (
                  <Box sx={{
                    textAlign: 'center',
                    py: 6,
                    px: 2,
                  }}>
                    <Typography sx={{ fontSize: '2.5rem', mb: 2 }}>👥</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Create your first group to start splitting expenses.
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ maxHeight: 480, overflowY: 'auto' }}>
                    {groups.map((group, index) => (
                      <ListItem
                        key={group.id}
                        disablePadding
                        secondaryAction={
                          <Tooltip title="Delete group">
                            <IconButton
                              edge="end"
                              onClick={() => handleDeleteGroup(group.id)}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { color: 'error.main' },
                              }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        }
                        sx={{
                          mb: 0.5,
                          animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                        }}
                      >
                        <ListItemButton
                          selected={group.id === selectedGroup?.id}
                          onClick={() => setSelectedGroupId(group.id)}
                          sx={{ borderRadius: 2 }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                background: getAvatarGradient(index),
                                width: 40,
                                height: 40,
                                fontSize: '1rem',
                                fontWeight: 700,
                              }}
                            >
                              {group.name[0]?.toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight={600} sx={{ color: 'text.primary' }}>
                                {group.name}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {group.members.length} members · {group.expenses.length} expenses
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ===== MAIN CONTENT ===== */}
          <Grid size={{ xs: 12, md: 8 }}>
            {selectedGroup ? (
              <Stack spacing={{ xs: 2, md: 3 }}>
                {/* Header card */}
                <Card
                  sx={{
                    animation: 'fadeInUp 0.5s ease-out 0.1s both',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05))',
                    border: '1px solid rgba(99, 102, 241, 0.12)',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                    >
                      <Box>
                        {editingGroupName === selectedGroup.id ? (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                              value={editGroupNameValue}
                              onChange={(e) => setEditGroupNameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateGroupName(selectedGroup.id)
                                if (e.key === 'Escape') setEditingGroupName(null)
                              }}
                              size="small"
                              autoFocus
                              variant="standard"
                              sx={{ '& input': { fontSize: { xs: '1.25rem', sm: '1.5rem' }, fontWeight: 700 } }}
                            />
                            <IconButton size="small" onClick={() => handleUpdateGroupName(selectedGroup.id)} sx={{ color: 'success.main' }}>
                              <Check fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => setEditingGroupName(null)} sx={{ color: 'text.secondary' }}>
                              <Close fontSize="small" />
                            </IconButton>
                          </Stack>
                        ) : (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                              variant="h5"
                              sx={{
                                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                background: mode === 'dark'
                                  ? 'linear-gradient(135deg, #f1f5f9, #cbd5e1)'
                                  : 'linear-gradient(135deg, #1e293b, #334155)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                              }}
                            >
                              {selectedGroup.name}
                            </Typography>
                            <Tooltip title="Edit group name">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingGroupName(selectedGroup.id)
                                  setEditGroupNameValue(selectedGroup.name)
                                }}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
                              >
                                <Edit sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                        <Typography
                          color="text.secondary"
                          sx={{ mt: 0.5, display: { xs: 'none', sm: 'block' }, fontSize: '0.875rem' }}
                        >
                          Split expenses among members, track balances, and settle up effortlessly.
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        <Button
                          variant="outlined"
                          startIcon={<PersonAdd />}
                          onClick={handleMemberDialogOpen}
                          size="small"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, px: { xs: 1.5, sm: 2.5 } }}
                        >
                          Add member
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<ReceiptLong />}
                          onClick={() => openExpenseDialog()}
                          size="small"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, px: { xs: 1.5, sm: 2.5 } }}
                        >
                          Add expense
                        </Button>
                      </Stack>
                    </Stack>

                    {/* Summary tiles — horizontal scroll on mobile */}
                    <Stack
                      direction="row"
                      spacing={1.5}
                      mt={2}
                      sx={{
                        overflowX: { xs: 'auto', sm: 'visible' },
                        pb: { xs: 0.5, sm: 0 },
                        WebkitOverflowScrolling: 'touch',
                        '&::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none',
                      }}
                    >
                      <SummaryTile
                        label="Total spent"
                        value={formatCurrency(totalSpent)}
                        icon={<Payments />}
                        gradient="linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(14, 165, 233, 0.08))"
                        iconColor="#60a5fa"
                      />
                      <SummaryTile
                        label="Members"
                        value={totalMembers.toString()}
                        icon={<GroupIcon />}
                        gradient="linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(6, 182, 212, 0.08))"
                        iconColor="#2dd4bf"
                      />
                      <SummaryTile
                        label="Expenses"
                        value={selectedGroup.expenses.length.toString()}
                        icon={<ReceiptLong />}
                        gradient="linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(236, 72, 153, 0.08))"
                        iconColor="#fb7185"
                      />
                    </Stack>
                  </CardContent>
                </Card>

                {/* Balances & Settlements */}
                <Grid container spacing={{ xs: 2, md: 3 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
                      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={2}
                        >
                          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            Member balances
                          </Typography>
                          <Chip
                            label={selectedGroup.members.length === 0 ? 'No members' : 'Live'}
                            size="small"
                            sx={{
                              background: selectedGroup.members.length === 0
                                ? 'rgba(148, 163, 184, 0.1)'
                                : 'rgba(16, 185, 129, 0.1)',
                              color: selectedGroup.members.length === 0
                                ? 'text.secondary'
                                : '#10b981',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Stack>
                        {selectedGroup.members.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 4 } }}>
                            <Typography sx={{ fontSize: '2rem', mb: 1 }}>⚖️</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              Add members to track how everyone stands.
                            </Typography>
                          </Box>
                        ) : (
                          <List disablePadding>
                            {selectedGroup.members.map((member, index) => {
                              const balance = balances.get(member.id) ?? 0
                              const isPositive = balance > 0.01
                              const isNegative = balance < -0.01
                              const chipColor = isPositive ? '#10b981' : isNegative ? '#f43f5e' : '#64748b'
                              const chipBg = isPositive
                                ? 'rgba(16, 185, 129, 0.1)'
                                : isNegative
                                  ? 'rgba(244, 63, 94, 0.1)'
                                  : 'rgba(100, 116, 139, 0.1)'
                              const chipIcon = isPositive
                                ? <TrendingUp sx={{ fontSize: 14, color: chipColor }} />
                                : isNegative
                                  ? <TrendingDown sx={{ fontSize: 14, color: chipColor }} />
                                  : null
                              const label = isPositive
                                ? `+${formatCurrency(Math.abs(balance))}`
                                : isNegative
                                  ? `-${formatCurrency(Math.abs(balance))}`
                                  : 'Settled'
                              return (
                                <ListItem
                                  key={member.id}
                                  secondaryAction={
                                    editingMemberId === member.id ? null : (
                                      <Stack direction="row" spacing={0}>
                                        <Tooltip title="Edit name">
                                          <IconButton
                                            onClick={() => {
                                              setEditingMemberId(member.id)
                                              setEditMemberNameValue(member.name)
                                            }}
                                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
                                          >
                                            <Edit sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Remove member">
                                          <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveMember(member.id)}
                                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                          >
                                            <DeleteOutline fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </Stack>
                                    )
                                  }
                                  sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    px: { xs: 1, sm: 2 },
                                    '& .MuiListItemSecondaryAction-root': { right: { xs: 4, sm: 16 } },
                                    '&:hover': { background: 'rgba(148, 163, 184, 0.04)' },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: { xs: 44, sm: 56 } }}>
                                    <Avatar
                                      sx={{
                                        background: getAvatarGradient(index),
                                        width: { xs: 32, sm: 36 },
                                        height: { xs: 32, sm: 36 },
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {member.name[0]?.toUpperCase()}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    sx={{ minWidth: 0 }}
                                    primary={
                                      editingMemberId === member.id ? (
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                          <TextField
                                            value={editMemberNameValue}
                                            onChange={(e) => setEditMemberNameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleUpdateMemberName(member.id)
                                              if (e.key === 'Escape') setEditingMemberId(null)
                                            }}
                                            size="small"
                                            autoFocus
                                            variant="standard"
                                            sx={{ '& input': { fontSize: '0.875rem', py: 0 } }}
                                          />
                                          <IconButton size="small" onClick={() => handleUpdateMemberName(member.id)} sx={{ color: 'success.main' }}>
                                            <Check sx={{ fontSize: 14 }} />
                                          </IconButton>
                                          <IconButton size="small" onClick={() => setEditingMemberId(null)} sx={{ color: 'text.secondary' }}>
                                            <Close sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Stack>
                                      ) : (
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                          {member.name}
                                        </Typography>
                                      )
                                    }
                                    secondary={
                                      <Chip
                                        icon={chipIcon ?? undefined}
                                        label={label}
                                        size="small"
                                        sx={{
                                          mt: 0.5,
                                          background: chipBg,
                                          color: chipColor,
                                          fontWeight: 600,
                                          fontSize: '0.7rem',
                                          height: 24,
                                          '& .MuiChip-icon': { ml: 0.5 },
                                        }}
                                      />
                                    }
                                  />
                                </ListItem>
                              )
                            })}
                          </List>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', animation: 'fadeInUp 0.5s ease-out 0.25s both' }}>
                      <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={2}
                        >
                          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            Settlements
                          </Typography>
                          <Box sx={{
                            p: 0.75,
                            borderRadius: 1.5,
                            background: 'rgba(99, 102, 241, 0.1)',
                            display: 'flex',
                          }}>
                            <ArrowForward sx={{ fontSize: 18, color: 'primary.light' }} />
                          </Box>
                        </Stack>
                        {settlements.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 4 } }}>
                            <Typography sx={{ fontSize: '2rem', mb: 1 }}>✅</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                              Everyone is settled up!
                            </Typography>
                          </Box>
                        ) : (
                          <List disablePadding>
                            {settlements.map((settlement, index) => (
                              <ListItem
                                key={`${settlement.from}-${settlement.to}-${index}`}
                                sx={{
                                  borderRadius: 2,
                                  mb: 0.5,
                                  px: { xs: 1, sm: 1.5 },
                                  py: 1,
                                  background: 'rgba(148, 163, 184, 0.03)',
                                  '&:hover': { background: 'rgba(148, 163, 184, 0.06)' },
                                }}
                              >
                                <ListItemText
                                  sx={{ minWidth: 0 }}
                                  primary={
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                      <Typography variant="body2" fontWeight={600} noWrap sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', sm: '0.875rem' }, minWidth: 0 }}>
                                        {memberNameById(selectedGroup.members, settlement.from)}
                                      </Typography>
                                      <ArrowForward sx={{ fontSize: 14, color: 'primary.light', flexShrink: 0 }} />
                                      <Typography variant="body2" fontWeight={600} noWrap sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', sm: '0.875rem' }, minWidth: 0 }}>
                                        {memberNameById(selectedGroup.members, settlement.to)}
                                      </Typography>
                                    </Stack>
                                  }
                                  secondary={
                                    <Chip
                                      label={formatCurrency(settlement.amount)}
                                      size="small"
                                      sx={{
                                        mt: 0.5,
                                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(14, 165, 233, 0.1))',
                                        color: '#60a5fa',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        height: 24,
                                      }}
                                    />
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Expenses list */}
                <Card sx={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}>
                  <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                      mb={2}
                    >
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        <ReceiptLong sx={{ fontSize: 20, color: 'primary.main' }} />
                        Expenses
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Add />}
                        onClick={() => openExpenseDialog()}
                        disabled={selectedGroup.members.length === 0}
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, flexShrink: 0 }}
                      >
                        New expense
                      </Button>
                    </Stack>
                    {selectedGroup.expenses.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 5 } }}>
                        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🧾</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          No expenses yet. Add your first one to see how costs are split.
                        </Typography>
                      </Box>
                    ) : (
                      <List disablePadding>
                        {selectedGroup.expenses.map((expense, index) => (
                          <Box
                            key={expense.id}
                            sx={{
                              animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                            }}
                          >
                            <ListItem
                              secondaryAction={
                                <Stack direction="row" spacing={0}>
                                  <Tooltip title="Edit expense">
                                    <IconButton
                                      onClick={() => openExpenseDialog(expense.id)}
                                      sx={{ color: 'text.secondary', '&:hover': { color: 'primary.light' } }}
                                    >
                                      <Edit sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete expense">
                                    <IconButton
                                      edge="end"
                                      onClick={() => handleDeleteExpense(expense.id)}
                                      sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                    >
                                      <DeleteOutline fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              }
                              sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                px: { xs: 0.5, sm: 2 },
                                '& .MuiListItemSecondaryAction-root': { right: { xs: 4, sm: 16 } },
                                '&:hover': { background: 'rgba(148, 163, 184, 0.04)' },
                              }}
                            >
                              <ListItemAvatar sx={{ minWidth: { xs: 44, sm: 56 } }}>
                                <Avatar
                                  sx={{
                                    background: getAvatarGradient(index),
                                    width: { xs: 32, sm: 38 },
                                    height: { xs: 32, sm: 38 },
                                  }}
                                >
                                  <ReceiptLong sx={{ fontSize: { xs: 16, sm: 18 } }} />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                sx={{ minWidth: 0 }}
                                primary={
                                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600} noWrap sx={{ color: 'text.primary', fontSize: { xs: '0.8rem', sm: '0.875rem' }, minWidth: 0 }}>
                                      {expense.description}
                                    </Typography>
                                    <Chip
                                      label={formatCurrency(expense.amount)}
                                      size="small"
                                      sx={{
                                        background: 'rgba(37, 99, 235, 0.1)',
                                        color: '#60a5fa',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        height: 22,
                                        flexShrink: 0,
                                      }}
                                    />
                                  </Stack>
                                }
                                secondary={
                                  <Typography component="span" variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' }, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                                    Paid by{' '}
                                    <Box component="span" sx={{ color: 'primary.light', fontWeight: 600 }}>
                                      {memberNameById(selectedGroup.members, expense.paidBy)}
                                    </Box>
                                    {' · '}
                                    Split between{' '}
                                    {expense.splitBetween
                                      .map((id) => memberNameById(selectedGroup.members, id))
                                      .join(', ')}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < selectedGroup.expenses.length - 1 && (
                              <Divider sx={{ ml: { xs: 6, sm: 9 }, mr: 2, opacity: 0.5 }} />
                            )}
                          </Box>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            ) : (
              /* Empty state */
              <Card
                sx={{
                  animation: 'fadeInUp 0.6s ease-out',
                  textAlign: 'center',
                  py: { xs: 3, sm: 4 },
                }}
              >
                <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
                  <Typography sx={{ fontSize: { xs: '2.5rem', sm: '3.5rem' }, mb: 2 }}>💰</Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      mb: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      background: mode === 'dark'
                        ? 'linear-gradient(135deg, #f1f5f9, #94a3b8)'
                        : 'linear-gradient(135deg, #1e293b, #475569)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Organize your shared expenses
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Create a group, add members, and start logging expenses. Splitesh calculates who
                    owes whom and keeps everything in sync.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<GroupAdd />}
                    onClick={() => setGroupDialogOpen(true)}
                    size="large"
                  >
                    Create your first group
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* ===== DIALOGS ===== */}
      < Dialog open={isGroupDialogOpen} onClose={() => setGroupDialogOpen(false)
      } maxWidth="xs" fullWidth >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ fontSize: '1.25rem' }}>✨</Box>
            <span>Create a new group</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Group expenses that belong together. You can add members and start tracking spending
            once the group is created.
          </DialogContentText>
          <TextField
            autoFocus
            margin="normal"
            label="Group name"
            fullWidth
            value={groupName}
            onChange={(event) => {
              setGroupName(event.target.value)
              setGroupNameError('')
            }}
            error={Boolean(groupNameError)}
            helperText={groupNameError || ' '}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setGroupDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateGroup}>
            Create group
          </Button>
        </DialogActions>
      </Dialog >

      <Dialog open={isMemberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ fontSize: '1.25rem' }}>👤</Box>
            <span>Add a member</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Add someone who participates in this group. They will be available when splitting
            expenses.
          </DialogContentText>
          <TextField
            autoFocus
            margin="normal"
            label="Member name"
            fullWidth
            value={memberName}
            onChange={(event) => {
              setMemberName(event.target.value)
              setMemberError('')
            }}
            error={Boolean(memberError)}
            helperText={memberError || ' '}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setMemberDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember} disabled={!selectedGroup}>
            Add member
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isExpenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ fontSize: '1.25rem' }}>🧾</Box>
            <span>{editingExpenseId ? 'Edit expense' : 'New expense'}</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <TextField
              label="Description"
              fullWidth
              value={expenseForm.description}
              onChange={(event) => handleExpenseChange('description', event.target.value)}
            />
            <TextField
              label="Amount"
              type="number"
              fullWidth
              inputProps={{ min: 0, step: '0.01' }}
              value={expenseForm.amount}
              onChange={(event) => handleExpenseChange('amount', event.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel id="paid-by-label">Paid by</InputLabel>
              <Select
                labelId="paid-by-label"
                label="Paid by"
                value={expenseForm.paidBy}
                onChange={(event) => handleExpenseChange('paidBy', event.target.value)}
                sx={{ borderRadius: 3 }}
              >
                {selectedGroup?.members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
                Split between
              </Typography>
              <FormGroup>
                {selectedGroup?.members.map((member) => (
                  <FormControlLabel
                    key={member.id}
                    control={
                      <Checkbox
                        checked={Boolean(expenseForm.splitBetween[member.id])}
                        onChange={() => toggleSplitMember(member.id)}
                        sx={{
                          color: 'rgba(148, 163, 184, 0.3)',
                          '&.Mui-checked': {
                            color: '#2563eb',
                          },
                        }}
                      />
                    }
                    label={member.name}
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.875rem',
                        color: 'text.primary',
                      },
                    }}
                  />
                ))}
              </FormGroup>
              <FormHelperText>Select who shares this expense.</FormHelperText>
            </Box>
            {expenseError ? (
              <Typography color="error" variant="body2" sx={{ fontWeight: 500 }}>
                {expenseError}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setExpenseDialogOpen(false); setEditingExpenseId(null) }} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveExpense}>
            {editingExpenseId ? 'Update expense' : 'Save expense'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(expenseError) && !isExpenseDialogOpen}
        onClose={() => setExpenseError(null)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ fontSize: '1.25rem' }}>⚠️</Box>
            <span>Action required</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{expenseError}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="contained" onClick={() => setExpenseError(null)}>Okay</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function SummaryTile({
  label,
  value,
  icon,
  gradient,
  iconColor,
}: {
  label: string
  value: string
  icon: ReactNode
  gradient: string
  iconColor: string
}) {
  return (
    <Card
      sx={{
        flex: 1,
        flexShrink: 0,
        minWidth: { xs: 180, sm: 'auto' },
        background: gradient,
        border: '1px solid rgba(148, 163, 184, 0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.06)',
              display: 'inline-flex',
              flexShrink: 0,
              color: iconColor,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{
                color: 'text.secondary',
                mb: 0.25,
              }}
            >
              {label}
            </Typography>
            <Typography variant="h6" noWrap sx={{ color: 'text.primary', fontSize: '1.1rem' }}>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

function memberNameById(members: Member[], memberId: string) {
  return members.find((member) => member.id === memberId)?.name ?? 'Unknown'
}

export default App
