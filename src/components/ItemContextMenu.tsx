import { Menu, MenuItem } from '@mui/material'
import { DeleteOutline, Edit } from '@mui/icons-material'
import type { Group } from '../types'

type ItemMenuTarget = { type: 'expense' | 'member'; id: string }

type Props = {
  anchorEl: HTMLElement | null
  target: ItemMenuTarget | null
  onClose: () => void
  selectedGroup: Group | null
  openExpenseDialog: (expenseId?: string) => void
  handleDeleteExpense: (expenseId: string) => void
  setEditingMemberId: (id: string | null) => void
  setEditMemberNameValue: (v: string) => void
  handleRemoveMember: (memberId: string) => void
}

export function ItemContextMenu({
  anchorEl,
  target,
  onClose,
  selectedGroup,
  openExpenseDialog,
  handleDeleteExpense,
  setEditingMemberId,
  setEditMemberNameValue,
  handleRemoveMember,
}: Props) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      sx={{ '& .MuiPaper-root': { borderRadius: 3, minWidth: 140 } }}
    >
      {target?.type === 'expense' && [
        <MenuItem
          key="edit"
          onClick={() => {
            openExpenseDialog(target.id)
            onClose()
          }}
        >
          <Edit sx={{ fontSize: 18, mr: 1.5, color: 'text.secondary' }} />
          Edit
        </MenuItem>,
        <MenuItem
          key="delete"
          onClick={() => {
            handleDeleteExpense(target.id)
            onClose()
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutline sx={{ fontSize: 18, mr: 1.5 }} />
          Delete
        </MenuItem>,
      ]}
      {target?.type === 'member' && [
        <MenuItem
          key="edit"
          onClick={() => {
            const member = selectedGroup?.members.find((m) => m.id === target.id)
            if (member) {
              setEditingMemberId(member.id)
              setEditMemberNameValue(member.name)
            }
            onClose()
          }}
        >
          <Edit sx={{ fontSize: 18, mr: 1.5, color: 'text.secondary' }} />
          Rename
        </MenuItem>,
        <MenuItem
          key="delete"
          onClick={() => {
            handleRemoveMember(target.id)
            onClose()
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutline sx={{ fontSize: 18, mr: 1.5 }} />
          Remove
        </MenuItem>,
      ]}
    </Menu>
  )
}
