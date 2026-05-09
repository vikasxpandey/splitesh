import { Avatar, Box, Button, Divider, IconButton, List, ListItem, ListItemAvatar, ListItemText, Stack, Typography } from '@mui/material'
import { Add, MoreVert, ReceiptLong } from '@mui/icons-material'
import { Card, CardContent } from '@mui/material'
import type { Group } from '../types'
import { formatCurrency } from '../utils/settlements'
import { getAvatarGradient } from '../utils/avatars'
import { memberNameById } from '../utils/members'

type Props = {
  selectedGroup: Group
  openExpenseDialog: (expenseId?: string) => void
  handleItemMenuOpen: (event: React.MouseEvent<HTMLElement>, type: 'expense' | 'member', id: string) => void
}

export function ExpensesTab({ selectedGroup, openExpenseDialog, handleItemMenuOpen }: Props) {
  if (selectedGroup.expenses.length === 0) {
    return (
      <Card sx={{ textAlign: 'center', py: 5 }}>
        <CardContent>
          <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🧾</Typography>
          <Typography color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
            No expenses yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openExpenseDialog()}
            disabled={selectedGroup.members.length === 0}
          >
            Add first expense
          </Button>
          {selectedGroup.members.length === 0 && (
            <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: '0.75rem' }}>
              Add members first via the Balances tab.
            </Typography>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <List disablePadding>
      {selectedGroup.expenses.map((expense, index) => (
        <Box key={expense.id}>
          <ListItem
            sx={{
              borderRadius: 2,
              px: 1.5,
              py: 1,
              '&:hover': { background: 'rgba(148, 163, 184, 0.04)' },
            }}
            secondaryAction={
              <IconButton
                size="small"
                onClick={(e) => handleItemMenuOpen(e, 'expense', expense.id)}
                sx={{ color: 'text.secondary' }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            }
          >
            <ListItemAvatar sx={{ minWidth: 48 }}>
              <Avatar sx={{ background: getAvatarGradient(index), width: 36, height: 36 }}>
                <ReceiptLong sx={{ fontSize: 18 }} />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              sx={{ minWidth: 0 }}
              primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} noWrap sx={{ color: 'text.primary', minWidth: 0 }}>
                    {expense.description}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.main', flexShrink: 0 }}>
                    {formatCurrency(expense.amount)}
                  </Typography>
                </Stack>
              }
              secondary={
                <Typography variant="caption" color="text.secondary" noWrap>
                  Paid by {memberNameById(selectedGroup.members, expense.paidBy)}
                  {' · '}
                  Split {expense.splitBetween.length} ways
                </Typography>
              }
            />
          </ListItem>
          {index < selectedGroup.expenses.length - 1 && (
            <Divider sx={{ ml: 7.5, opacity: 0.5 }} />
          )}
        </Box>
      ))}
    </List>
  )
}
