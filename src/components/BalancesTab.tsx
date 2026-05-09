import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Check, Close, MoreVert, PersonAdd, TrendingDown, TrendingUp } from '@mui/icons-material'
import type { Group } from '../types'
import { formatCurrency } from '../utils/settlements'
import { getAvatarGradient } from '../utils/avatars'

type Props = {
  selectedGroup: Group
  balances: Map<string, number>
  editingMemberId: string | null
  setEditingMemberId: (id: string | null) => void
  editMemberNameValue: string
  setEditMemberNameValue: (v: string) => void
  handleUpdateMemberName: (memberId: string) => void
  handleItemMenuOpen: (event: React.MouseEvent<HTMLElement>, type: 'expense' | 'member', id: string) => void
  handleMemberDialogOpen: () => void
}

export function BalancesTab({
  selectedGroup,
  balances,
  editingMemberId,
  setEditingMemberId,
  editMemberNameValue,
  setEditMemberNameValue,
  handleUpdateMemberName,
  handleItemMenuOpen,
  handleMemberDialogOpen,
}: Props) {
  if (selectedGroup.members.length === 0) {
    return (
      <Card sx={{ textAlign: 'center', py: 5 }}>
        <CardContent>
          <Typography sx={{ fontSize: '2rem', mb: 1 }}>👥</Typography>
          <Typography color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
            Add members to start tracking balances.
          </Typography>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={handleMemberDialogOpen}>
            Add member
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <List disablePadding>
      {selectedGroup.members.map((member, index) => {
        const balance = balances.get(member.id) ?? 0
        const isPositive = balance > 0.01
        const isNegative = balance < -0.01
        return (
          <ListItem
            key={member.id}
            sx={{
              borderRadius: 2,
              px: 1.5,
              py: 1,
              mb: 0.5,
              '&:hover': { background: 'rgba(148, 163, 184, 0.04)' },
            }}
            secondaryAction={
              editingMemberId === member.id ? null : (
                <IconButton
                  size="small"
                  onClick={(e) => handleItemMenuOpen(e, 'member', member.id)}
                  sx={{ color: 'text.secondary' }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )
            }
          >
            <ListItemAvatar sx={{ minWidth: 48 }}>
              <Avatar
                sx={{
                  background: getAvatarGradient(index),
                  width: 36,
                  height: 36,
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
                  <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                    {member.name}
                  </Typography>
                )
              }
              secondary={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: isPositive ? '#10b981' : isNegative ? '#f43f5e' : 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.25,
                  }}
                >
                  {isPositive && <TrendingUp sx={{ fontSize: 14 }} />}
                  {isNegative && <TrendingDown sx={{ fontSize: 14 }} />}
                  {isPositive
                    ? `gets back ${formatCurrency(Math.abs(balance))}`
                    : isNegative
                      ? `owes ${formatCurrency(Math.abs(balance))}`
                      : 'settled up'}
                </Typography>
              }
            />
          </ListItem>
        )
      })}

      <ListItem
        onClick={handleMemberDialogOpen}
        sx={{
          borderRadius: 2,
          px: 1.5,
          py: 1.5,
          cursor: 'pointer',
          border: '1px dashed',
          borderColor: 'divider',
          justifyContent: 'center',
          mt: 1.5,
          '&:hover': { borderColor: 'primary.main', background: 'rgba(37, 99, 235, 0.04)' },
        }}
      >
        <PersonAdd sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Add member
        </Typography>
      </ListItem>
    </List>
  )
}
