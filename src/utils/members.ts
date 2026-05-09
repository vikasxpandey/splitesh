import type { Member } from '../types'

export function memberNameById(members: Member[], memberId: string) {
  return members.find((member) => member.id === memberId)?.name ?? 'Unknown'
}
