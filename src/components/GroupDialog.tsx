import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'

type Props = {
  isOpen: boolean
  onClose: () => void
  groupName: string
  setGroupName: (v: string) => void
  groupNameError: string
  setGroupNameError: (v: string) => void
  handleCreateGroup: () => void
}

export function GroupDialog({
  isOpen,
  onClose,
  groupName,
  setGroupName,
  groupNameError,
  setGroupNameError,
  handleCreateGroup,
}: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create a new group</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="normal"
          label="Group name"
          placeholder="e.g. Weekend trip, Roommates"
          fullWidth
          value={groupName}
          onChange={(e) => {
            setGroupName(e.target.value)
            setGroupNameError('')
          }}
          error={Boolean(groupNameError)}
          helperText={groupNameError || ' '}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateGroup}>Create</Button>
      </DialogActions>
    </Dialog>
  )
}
