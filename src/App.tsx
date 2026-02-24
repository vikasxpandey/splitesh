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
  AssignmentReturned,
  DeleteOutline,
  Group as GroupIcon,
  GroupAdd,
  Payments,
  PersonAdd,
  ReceiptLong,
} from '@mui/icons-material'
// import { usePersistentState } from './hooks/usePersistentState' // REMOVED
import type { Group, Member } from './types'
import { calculateBalances, calculateSettlements, formatCurrency } from './utils/settlements'
import { storage } from './utils/storage'

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

// Simple Error Dialog Component
/*
import Dialog from '@mui/material/Dialog';
// ... reused existing Dialog ...
*/

function App() {
  const [groups, setGroups] = useState<Group[]>([]) // Changed to normal useState
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
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    description: '',
    amount: '',
    paidBy: '',
    splitBetween: {},
  })
  const [expenseError, setExpenseError] = useState<string | null>(null)

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

  const openExpenseDialog = () => {
    if (!selectedGroup || selectedGroup.members.length === 0) {
      setExpenseError('Add at least one member before creating an expense.')
      return
    }
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

  const handleAddExpense = async () => {
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

    try {
      const newExpense = await storage.addExpense(selectedGroup.id, {
        description: expenseForm.description.trim(),
        amount,
        paidBy: expenseForm.paidBy,
        splitBetween: participants
      })

      const updatedGroup: Group = {
        ...selectedGroup,
        expenses: [newExpense, ...selectedGroup.expenses]
      }

      setGroups((prev) => prev.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)))
      setExpenseDialogOpen(false)
    } catch (e) {
      console.error(e)
      setExpenseError('Failed to save expense')
    }
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
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <Payments sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Splitesh
          </Typography>
          <Button
            color="inherit"
            startIcon={<GroupAdd />}
            onClick={() => setGroupDialogOpen(true)}
          >
            New Group
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">Groups</Typography>
                  <Tooltip title="Create group">
                    <IconButton color="primary" onClick={() => setGroupDialogOpen(true)}>
                      <Add />
                    </IconButton>
                  </Tooltip>
                </Stack>
                {groups.length === 0 ? (
                  <Typography color="text.secondary">
                    Create your first group to start splitting expenses.
                  </Typography>
                ) : (
                  <List sx={{ maxHeight: 480, overflowY: 'auto' }}>
                    {groups.map((group) => (
                      <ListItem
                        key={group.id}
                        disablePadding
                        secondaryAction={
                          <Tooltip title="Delete group">
                            <IconButton edge="end" onClick={() => handleDeleteGroup(group.id)}>
                              <DeleteOutline />
                            </IconButton>
                          </Tooltip>
                        }
                        sx={{ mb: 1 }}
                      >
                        <ListItemButton
                          selected={group.id === selectedGroup?.id}
                          onClick={() => setSelectedGroupId(group.id)}
                          sx={{ borderRadius: 1 }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <GroupIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={group.name}
                            secondary={`${group.members.length} members • ${group.expenses.length} expenses`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            {selectedGroup ? (
              <Stack spacing={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Box>
                        <Typography variant="h5" fontWeight={600}>
                          {selectedGroup.name}
                        </Typography>
                        <Typography color="text.secondary">
                          Split expenses among members, track balances, and settle up effortlessly.
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          startIcon={<PersonAdd />}
                          onClick={handleMemberDialogOpen}
                        >
                          Add member
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<ReceiptLong />}
                          onClick={openExpenseDialog}
                        >
                          Add expense
                        </Button>
                      </Stack>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={3}>
                      <SummaryTile
                        label="Total spent"
                        value={formatCurrency(totalSpent)}
                        icon={<Payments color="primary" />}
                      />
                      <SummaryTile
                        label="Members"
                        value={totalMembers.toString()}
                        icon={<GroupIcon color="primary" />}
                      />
                      <SummaryTile
                        label="Expenses"
                        value={selectedGroup.expenses.length.toString()}
                        icon={<ReceiptLong color="primary" />}
                      />
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={2}
                        >
                          <Typography variant="h6">Member balances</Typography>
                          <Chip
                            label={selectedGroup.members.length === 0 ? 'No members' : 'Up to date'}
                            size="small"
                            color="default"
                          />
                        </Stack>
                        {selectedGroup.members.length === 0 ? (
                          <Typography color="text.secondary">
                            Add members to track how everyone stands.
                          </Typography>
                        ) : (
                          <List>
                            {selectedGroup.members.map((member) => {
                              const balance = balances.get(member.id) ?? 0
                              const color =
                                balance > 0.01
                                  ? 'success.main'
                                  : balance < -0.01
                                    ? 'error.main'
                                    : 'text.secondary'
                              const label =
                                balance > 0.01
                                  ? `Gets back ${formatCurrency(Math.abs(balance))}`
                                  : balance < -0.01
                                    ? `Owes ${formatCurrency(Math.abs(balance))}`
                                    : 'Settled up'
                              return (
                                <ListItem
                                  key={member.id}
                                  secondaryAction={
                                    <Tooltip title="Remove member">
                                      <IconButton edge="end" onClick={() => handleRemoveMember(member.id)}>
                                        <DeleteOutline />
                                      </IconButton>
                                    </Tooltip>
                                  }
                                >
                                  <ListItemAvatar>
                                    <Avatar>{member.name[0]?.toUpperCase()}</Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={member.name}
                                    secondary={
                                      <Typography component="span" color={color} fontWeight={500}>
                                        {label}
                                      </Typography>
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
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={2}
                        >
                          <Typography variant="h6">Suggested settlements</Typography>
                          <AssignmentReturned color="primary" />
                        </Stack>
                        {settlements.length === 0 ? (
                          <Typography color="text.secondary">
                            Everyone is settled up. Add more expenses to update balances.
                          </Typography>
                        ) : (
                          <List>
                            {settlements.map((settlement, index) => (
                              <ListItem key={`${settlement.from}-${settlement.to}-${index}`}>
                                <ListItemAvatar>
                                  <Avatar>
                                    <Payments />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={`${memberNameById(selectedGroup.members, settlement.from)} → ${memberNameById(selectedGroup.members, settlement.to)}`}
                                  secondary={`Pay ${formatCurrency(settlement.amount)}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Card variant="outlined">
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="space-between"
                      mb={2}
                    >
                      <Typography variant="h6">Expenses</Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={openExpenseDialog}
                        disabled={selectedGroup.members.length === 0}
                      >
                        New expense
                      </Button>
                    </Stack>
                    {selectedGroup.expenses.length === 0 ? (
                      <Typography color="text.secondary">
                        No expenses yet. Add your first one to see how costs are split.
                      </Typography>
                    ) : (
                      <List>
                        {selectedGroup.expenses.map((expense) => (
                          <Box key={expense.id}>
                            <ListItem
                              secondaryAction={
                                <Tooltip title="Delete expense">
                                  <IconButton edge="end" onClick={() => handleDeleteExpense(expense.id)}>
                                    <DeleteOutline />
                                  </IconButton>
                                </Tooltip>
                              }
                            >
                              <ListItemAvatar>
                                <Avatar>
                                  <ReceiptLong />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${expense.description} · ${formatCurrency(expense.amount)}`}
                                secondary={
                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Typography component="span" color="text.secondary">
                                      Paid by {memberNameById(selectedGroup.members, expense.paidBy)}
                                    </Typography>
                                    <Divider orientation="vertical" flexItem />
                                    <Typography component="span" color="text.secondary">
                                      Split between{' '}
                                      {expense.splitBetween
                                        .map((id) => memberNameById(selectedGroup.members, id))
                                        .join(', ')}
                                    </Typography>
                                  </Stack>
                                }
                              />
                            </ListItem>
                            <Divider component="li" />
                          </Box>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            ) : (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Organize your shared expenses
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    Create a group, add members, and start logging expenses. Splitesh calculates who
                    owes whom and keeps everything in sync.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<GroupAdd />}
                    onClick={() => setGroupDialogOpen(true)}
                  >
                    Create your first group
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      <Dialog open={isGroupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create a new group</DialogTitle>
        <DialogContent>
          <DialogContentText>
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
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateGroup}>
            Create group
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isMemberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add a member</DialogTitle>
        <DialogContent>
          <DialogContentText>
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
        <DialogActions>
          <Button onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
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
        <DialogTitle>New expense</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
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
              >
                {selectedGroup?.members.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box>
              <Typography fontWeight={600} gutterBottom>
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
                      />
                    }
                    label={member.name}
                  />
                ))}
              </FormGroup>
              <FormHelperText>Select who shares this expense.</FormHelperText>
            </Box>
            {expenseError ? (
              <Typography color="error" variant="body2">
                {expenseError}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddExpense}>
            Save expense
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(expenseError) && !isExpenseDialogOpen}
        onClose={() => setExpenseError(null)}
      >
        <DialogTitle>Action required</DialogTitle>
        <DialogContent>
          <DialogContentText>{expenseError}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseError(null)}>Okay</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function SummaryTile({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card variant="outlined" sx={{ flex: 1 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', display: 'inline-flex' }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6">{value}</Typography>
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
