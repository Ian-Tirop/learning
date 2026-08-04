export const coverPresets = [
  { icon: 'network-icon', from: '--accent-3', to: '--accent', angle: 150, pattern: 'dots' },
  { icon: 'grid-icon', from: '--accent', to: '--accent-2', angle: 135, pattern: 'grid' },
  { icon: 'bug-icon', from: '--accent-2', to: '--accent', angle: 115, pattern: 'dots' },
  { icon: 'moon-icon', from: '--accent-3', to: '--accent-2', angle: 165, pattern: 'lines' },
  { icon: 'curve-icon', from: '--accent', to: '--accent-3', angle: 95, pattern: 'rings' },
  { icon: 'folder-icon', from: '--accent-2', to: '--accent-3', angle: 140, pattern: 'grid' },
  { icon: 'pencil-icon', from: '--accent', to: '--accent-2', angle: 55, pattern: 'lines' },
  { icon: 'check-icon', from: '--accent-2', to: '--accent', angle: 205, pattern: 'rings' },
  { icon: 'sun-icon', from: '--accent', to: '--accent-3', angle: 45, pattern: 'dots' },
  { icon: 'star-icon', from: '--accent-3', to: '--accent-2', angle: 200, pattern: 'grid' },
  { icon: 'comment-icon', from: '--accent-2', to: '--accent-3', angle: 110, pattern: 'lines' },
]

export function findMatchingPreset(cover) {
  if (!cover) return coverPresets[0]
  return (
    coverPresets.find(
      (preset) =>
        preset.icon === cover.icon &&
        preset.from === cover.from &&
        preset.to === cover.to &&
        preset.angle === cover.angle &&
        preset.pattern === cover.pattern,
    ) || coverPresets[0]
  )
}
