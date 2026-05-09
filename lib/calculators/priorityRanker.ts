import { PriorityRankerInput, RankedGoal } from './types'

const urgencyDescriptions: Record<number, string> = {
  1: 'Critical',
  2: 'Very Important',
  3: 'Important',
  4: 'To Be Deleted', // Special case: urgency 4 signals goal should be deleted
  5: 'Moderate',
  6: 'Low',
  7: 'Very Low',
  8: 'Minor',
  9: 'Least Urgent',
}

export function rankGoals(input: PriorityRankerInput): RankedGoal[] {
  // Filter out goals with urgency level 4 (marked for deletion)
  const validGoals = input.goals.filter((goal) => goal.urgencyLevel !== 4)

  // Group by urgency level
  const groupedByUrgency: Record<number, typeof validGoals> = {}
  validGoals.forEach((goal) => {
    if (!groupedByUrgency[goal.urgencyLevel]) {
      groupedByUrgency[goal.urgencyLevel] = []
    }
    groupedByUrgency[goal.urgencyLevel].push(goal)
  })

  // Sort each group alphabetically by name
  Object.keys(groupedByUrgency).forEach((urgency) => {
    groupedByUrgency[parseInt(urgency)].sort((a, b) => a.name.localeCompare(b.name))
  })

  // Assign priorities in order of urgency
  const rankedGoals: RankedGoal[] = []
  let priority = 1

  const urgencies = Object.keys(groupedByUrgency)
    .map(Number)
    .sort((a, b) => a - b)

  for (const urgency of urgencies) {
    for (const goal of groupedByUrgency[urgency]) {
      rankedGoals.push({
        priority,
        name: goal.name,
        urgencyLevel: goal.urgencyLevel,
        urgencyDescription: urgencyDescriptions[urgency] || `Urgency ${urgency}`,
      })
      priority++
    }
  }

  return rankedGoals
}
