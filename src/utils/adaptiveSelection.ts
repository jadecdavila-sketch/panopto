import { getKTPerformance, getKTWeight } from './ktPerformance'

/**
 * Selects `count` KT IDs from the available pool, weighted by performance.
 * Uses weighted random sampling. When the pool is smaller than count,
 * KTs are repeated (they'll get different phrasing via attemptNumber).
 * Always returns exactly `count` items unless the pool is completely empty.
 */
export function selectAdaptiveKTs(
  availableKtIds: string[],
  modality: 'flashcard' | 'quiz',
  count: number,
  excludeKtIds: string[] = [],
): string[] {
  if (availableKtIds.length === 0) return []

  const pool = availableKtIds.filter(id => !excludeKtIds.includes(id))

  // If pool is smaller than count, allow repeats from already-seen KTs
  const source = pool.length > 0 ? pool : availableKtIds

  const weighted = source.map(id => ({
    id,
    weight: getKTWeight(getKTPerformance(id), modality),
  }))

  const selected: string[] = []

  // Keep selecting until we hit count, cycling through the pool as needed
  while (selected.length < count) {
    const remaining = [...weighted]

    while (selected.length < count && remaining.length > 0) {
      const totalWeight = remaining.reduce((sum, item) => sum + item.weight, 0)
      let rand = Math.random() * totalWeight
      for (let i = 0; i < remaining.length; i++) {
        rand -= remaining[i].weight
        if (rand <= 0) {
          selected.push(remaining[i].id)
          remaining.splice(i, 1)
          break
        }
      }
    }
  }

  return selected
}
