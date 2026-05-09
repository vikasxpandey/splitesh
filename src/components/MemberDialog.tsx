import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import type { Group } from '../types'

type Props = {
  isOpen: boolean
  onClose: () => void
  selectedGroup: Group | null
  memberName: string
  setMemberName: (v: string) => void
  memberError: string
  setMemberError: (v: string) => void
  handleAddMember: () => void
}

export function MemberDialog({
  isOpen,
  onClose,
  selectedGroup,
  memberName,
  setMemberName,
  memberError,
  setMemberError,
  handleAddMember,
}: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add a member</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="normal"
          label="Name"
          placeholder="e.g. Alex"
          fullWidth
          value={memberName}
          onChange={(e) => {
            setMemberName(e.target.value)
            setMemberError('')
          }}
          error={Boolean(memberError)}
          helperText={memberError || ' '}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={handleAddMember} disabled={!selectedGroup}>Add</Button>
      </DialogActions>
    </Dialog>
  )
}
