import { Avatar, Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { ArrowForward } from '@mui/icons-material'
import type { Group, Settlement } from '../types'
import { formatCurrency } from '../utils/settlements'
import { getAvatarGradient } from '../utils/avatars'
import { memberNameById } from '../utils/members'

type Props = {
  settlements: Settlement[]
  selectedGroup: Group
}

export function SettleUpTab({ settlements, selectedGroup }: Props) {
  if (settlements.length === 0) {
    return (
      <Card sx={{ textAlign: 'center', py: 5 }}>
        <CardContent>
          <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>✅</Typography>
          <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
            All settled!
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            No payments needed right now.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Minimum transfers to settle all debts:
      </Typography>
      {settlements.map((settlement, index) => (
        <Card
          key={`${settlement.from}-${settlement.to}-${index}`}
          sx={{ border: '1px solid', borderColor: 'divider' }}
        >
          <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: getAvatarGradient(
                    selectedGroup.members.findIndex((m) => m.id === settlement.from)
                  ),
                }}
              >
                {memberNameById(selectedGroup.members, settlement.from)[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {memberNameById(selectedGroup.members, settlement.from)}
                  </Typography>
                  <ArrowForward sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {memberNameById(selectedGroup.members, settlement.to)}
                  </Typography>
                </Stack>
              </Box>
              <Typography variant="body1" fontWeight={700} sx={{ color: 'primary.main' }}>
                {formatCurrency(settlement.amount)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}
