export const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #2563eb, #0ea5e9)',
  'linear-gradient(135deg, #14b8a6, #06b6d4)',
  'linear-gradient(135deg, #f43f5e, #ec4899)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #14b8a6)',
  'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

export function getAvatarGradient(index: number) {
  return AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]
}
