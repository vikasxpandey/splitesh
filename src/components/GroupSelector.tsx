import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Add, Check, Close, DeleteOutline, Edit, KeyboardArrowDown } from '@mui/icons-material'
import { ListItemText } from '@mui/material'
import type { Group } from '../types'
import { formatCurrency } from '../utils/settlements'

type Props = {
  groups: Group[]
  selectedGroup: Group | null
  selectedGroupId: string | null
  totalSpent: number
  groupMenuAnchor: HTMLElement | null
  setGroupMenuAnchor: (el: HTMLElement | null) => void
  editingGroupName: string | null
  setEditingGroupName: (id: string | null) => void
  editGroupNameValue: string
  setEditGroupNameValue: (v: string) => void
  handleUpdateGroupName: (groupId: string) => void
  handleDeleteGroup: (groupId: string) => void
  setSelectedGroupId: (id: string) => void
  setActiveTab: (tab: number) => void
  setGroupDialogOpen: (open: boolean) => void
}

export function GroupSelector({
  groups,
  selectedGroup,
  selectedGroupId,
  totalSpent,
  groupMenuAnchor,
  setGroupMenuAnchor,
  editingGroupName,
  setEditingGroupName,
  editGroupNameValue,
  setEditGroupNameValue,
  handleUpdateGroupName,
  handleDeleteGroup,
  setSelectedGroupId,
  setActiveTab,
  setGroupDialogOpen,
}: Props) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {editingGroupName === selectedGroup?.id ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
            <TextField
              value={editGroupNameValue}
              onChange={(e) => setEditGroupNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateGroupName(selectedGroup!.id)
                if (e.key === 'Escape') setEditingGroupName(null)
              }}
              size="small"
              autoFocus
              variant="standard"
              sx={{ '& input': { fontSize: '1.25rem', fontWeight: 700 } }}
            />
            <IconButton
              size="small"
              onClick={() => handleUpdateGroupName(selectedGroup!.id)}
              sx={{ color: 'success.main' }}
            >
              <Check fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setEditingGroupName(null)}
              sx={{ color: 'text.secondary' }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <>
            <Button
              onClick={(e) => setGroupMenuAnchor(e.currentTarget)}
              endIcon={<KeyboardArrowDown />}
              sx={{
                textTransform: 'none',
                color: 'text.primary',
                fontWeight: 700,
                fontSize: '1.25rem',
                px: 1,
                '&:hover': { background: 'rgba(148, 163, 184, 0.08)' },
              }}
            >
              {selectedGroup?.name ?? 'Select group'}
            </Button>
            {selectedGroup && (
              <Tooltip title="Rename group">
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditingGroupName(selectedGroup.id)
                    setEditGroupNameValue(selectedGroup.name)
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  <Edit sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => setGroupDialogOpen(true)}
          sx={{ flexShrink: 0, fontSize: '0.8rem' }}
        >
          New
        </Button>
      </Stack>

      <Menu
        anchorEl={groupMenuAnchor}
        open={Boolean(groupMenuAnchor)}
        onClose={() => setGroupMenuAnchor(null)}
        sx={{ '& .MuiPaper-root': { minWidth: 220, borderRadius: 3 } }}
      >
        {groups.map((group) => (
          <MenuItem
            key={group.id}
            selected={group.id === selectedGroupId}
            onClick={() => {
              setSelectedGroupId(group.id)
              setGroupMenuAnchor(null)
              setActiveTab(0)
            }}
            sx={{ borderRadius: 2, mx: 0.5, my: 0.25 }}
          >
            <ListItemText
              primary={group.name}
              secondary={`${group.members.length} members`}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteGroup(group.id)
                setGroupMenuAnchor(null)
              }}
              sx={{ ml: 1, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              <DeleteOutline sx={{ fontSize: 16 }} />
            </IconButton>
          </MenuItem>
        ))}
      </Menu>

      {selectedGroup && (
        <Stack direction="row" spacing={2} sx={{ mt: 0.5, ml: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {selectedGroup.members.length} members
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedGroup.expenses.length} expenses
          </Typography>
          {totalSpent > 0 && (
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
              {formatCurrency(totalSpent)} total
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  )
}
