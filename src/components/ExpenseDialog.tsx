import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { ExpenseFormState, Group } from '../types'

type Props = {
  isOpen: boolean
  onClose: () => void
  editingExpenseId: string | null
  setEditingExpenseId: (id: string | null) => void
  selectedGroup: Group | null
  expenseForm: ExpenseFormState
  expenseError: string | null
  handleExpenseChange: (field: keyof ExpenseFormState, value: string | number) => void
  toggleSplitMember: (memberId: string) => void
  handleSaveExpense: () => void
}

export function ExpenseDialog({
  isOpen,
  onClose,
  editingExpenseId,
  setEditingExpenseId,
  selectedGroup,
  expenseForm,
  expenseError,
  handleExpenseChange,
  toggleSplitMember,
  handleSaveExpense,
}: Props) {
  const handleClose = () => {
    onClose()
    setEditingExpenseId(null)
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {editingExpenseId ? 'Edit expense' : 'New expense'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} mt={1}>
          <TextField
            label="What was it for?"
            fullWidth
            value={expenseForm.description}
            onChange={(e) => handleExpenseChange('description', e.target.value)}
          />
          <TextField
            label="How much?"
            type="number"
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
            value={expenseForm.amount}
            onChange={(e) => handleExpenseChange('amount', e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel id="paid-by-label">Who paid?</InputLabel>
            <Select
              labelId="paid-by-label"
              label="Who paid?"
              value={expenseForm.paidBy}
              onChange={(e) => handleExpenseChange('paidBy', e.target.value)}
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
                        '&.Mui-checked': { color: '#2563eb' },
                      }}
                    />
                  }
                  label={member.name}
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                />
              ))}
            </FormGroup>
            <FormHelperText>Select who shares this expense.</FormHelperText>
          </Box>
          {expenseError && (
            <Typography color="error" variant="body2" sx={{ fontWeight: 500 }}>
              {expenseError}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSaveExpense}>
          {editingExpenseId ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
