import { rankGoals } from '@/lib/calculators/priorityRanker'
import { priorityRankerInputs } from '../../../fixtures/calculators'

describe('rankGoals', () => {
  describe('happy path', () => {
    it('should rank goals by urgency level', () => {
      const result = rankGoals(priorityRankerInputs.mixed)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].priority).toBe(1)
    })

    it('should assign sequential priorities', () => {
      const result = rankGoals(priorityRankerInputs.mixed)

      result.forEach((goal, index) => {
        expect(goal.priority).toBe(index + 1)
      })
    })

    it('should include urgency description', () => {
      const result = rankGoals(priorityRankerInputs.mixed)

      result.forEach((goal) => {
        expect(goal.urgencyDescription).toBeDefined()
        expect(goal.urgencyDescription.length).toBeGreaterThan(0)
      })
    })

    it('should preserve goal names', () => {
      const result = rankGoals(priorityRankerInputs.mixed)

      const names = result.map((g) => g.name)
      priorityRankerInputs.mixed.goals
        .filter((g) => g.urgencyLevel !== 4)
        .forEach((goal) => {
          expect(names).toContain(goal.name)
        })
    })
  })

  describe('urgency ordering', () => {
    it('should rank lower urgency numbers first', () => {
      const result = rankGoals(priorityRankerInputs.mixed)

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].urgencyLevel).toBeLessThanOrEqual(result[i + 1].urgencyLevel)
      }
    })

    it('should handle critical urgency (1)', () => {
      const result = rankGoals({
        goals: [
          { name: 'Critical Task', urgencyLevel: 1 },
          { name: 'Important Task', urgencyLevel: 3 },
        ],
      })

      expect(result[0].name).toBe('Critical Task')
      expect(result[0].priority).toBe(1)
    })

    it('should handle least urgent (9)', () => {
      const result = rankGoals({
        goals: [
          { name: 'Important', urgencyLevel: 1 },
          { name: 'Least Urgent', urgencyLevel: 9 },
        ],
      })

      expect(result[result.length - 1].name).toBe('Least Urgent')
    })
  })

  describe('alphabetical ordering within same urgency', () => {
    it('should sort alphabetically when urgency levels are equal', () => {
      const result = rankGoals(priorityRankerInputs.sameUrgency)

      expect(result[0].name).toBe('Goal A')
      expect(result[1].name).toBe('Goal B')
      expect(result[2].name).toBe('Goal C')
    })

    it('should maintain alphabetical order within urgency groups', () => {
      const result = rankGoals({
        goals: [
          { name: 'Zebra Goal', urgencyLevel: 1 },
          { name: 'Apple Goal', urgencyLevel: 1 },
          { name: 'Middle Goal', urgencyLevel: 1 },
        ],
      })

      expect(result[0].name).toBe('Apple Goal')
      expect(result[1].name).toBe('Middle Goal')
      expect(result[2].name).toBe('Zebra Goal')
    })
  })

  describe('urgency level 4 (delete marker)', () => {
    it('should filter out goals with urgency level 4', () => {
      const result = rankGoals(priorityRankerInputs.withDeleteMarker)

      const deletedGoals = result.filter((g) => g.urgencyLevel === 4)
      expect(deletedGoals.length).toBe(0)
    })

    it('should keep only non-deleted goals', () => {
      const result = rankGoals(priorityRankerInputs.withDeleteMarker)

      expect(result.length).toBe(2)
      expect(result.map((g) => g.name)).toEqual(['Keep This', 'Keep This Too'])
    })

    it('should return empty array when all goals are marked for deletion', () => {
      const result = rankGoals({
        goals: [
          { name: 'Delete Me 1', urgencyLevel: 4 },
          { name: 'Delete Me 2', urgencyLevel: 4 },
        ],
      })

      expect(result.length).toBe(0)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty goal list', () => {
      const result = rankGoals({
        goals: [],
      })

      expect(result).toEqual([])
    })

    it('should handle single goal', () => {
      const result = rankGoals({
        goals: [{ name: 'Only Goal', urgencyLevel: 5 }],
      })

      expect(result.length).toBe(1)
      expect(result[0].priority).toBe(1)
      expect(result[0].name).toBe('Only Goal')
    })

    it('should handle goals with all urgency levels except 4 (delete marker)', () => {
      const goals = Array.from({ length: 9 }, (_, i) => ({
        name: `Goal ${i + 1}`,
        urgencyLevel: i + 1,
      }))

      const result = rankGoals({ goals })

      expect(result.length).toBe(8)
      const deletedGoals = result.filter((g) => g.urgencyLevel === 4)
      expect(deletedGoals.length).toBe(0)
    })

    it('should handle goals with special characters in names', () => {
      const result = rankGoals({
        goals: [
          { name: 'Goal & Insurance', urgencyLevel: 1 },
          { name: "Goal's Priority", urgencyLevel: 2 },
          { name: 'Goal (urgent)', urgencyLevel: 1 },
        ],
      })

      expect(result.length).toBe(3)
      expect(result[0].name).toBe("Goal (urgent)")
      expect(result[1].name).toBe('Goal & Insurance')
    })

    it('should handle alphabetical sorting', () => {
      const result = rankGoals({
        goals: [
          { name: 'Zebra', urgencyLevel: 1 },
          { name: 'Apple', urgencyLevel: 1 },
          { name: 'Banana', urgencyLevel: 1 },
        ],
      })

      expect(result.length).toBe(3)
      expect(result[0].name).toBe('Apple')
      expect(result[1].name).toBe('Banana')
      expect(result[2].name).toBe('Zebra')
    })
  })

  describe('urgency descriptions', () => {
    it('should map urgency 1 to Critical', () => {
      const result = rankGoals({
        goals: [{ name: 'Test', urgencyLevel: 1 }],
      })

      expect(result[0].urgencyDescription).toBe('Critical')
    })

    it('should map urgency 5 to Moderate', () => {
      const result = rankGoals({
        goals: [{ name: 'Test', urgencyLevel: 5 }],
      })

      expect(result[0].urgencyDescription).toBe('Moderate')
    })

    it('should map urgency 9 to Least Urgent', () => {
      const result = rankGoals({
        goals: [{ name: 'Test', urgencyLevel: 9 }],
      })

      expect(result[0].urgencyDescription).toBe('Least Urgent')
    })

    it('should handle unknown urgency levels gracefully', () => {
      const result = rankGoals({
        goals: [{ name: 'Test', urgencyLevel: 99 }],
      })

      expect(result[0].urgencyDescription).toBe('Urgency 99')
    })
  })

  describe('complex scenarios', () => {
    it('should handle mixed urgencies with proper ordering', () => {
      const result = rankGoals({
        goals: [
          { name: 'Z-Task', urgencyLevel: 5 },
          { name: 'A-Critical', urgencyLevel: 1 },
          { name: 'B-Critical', urgencyLevel: 1 },
          { name: 'Important', urgencyLevel: 3 },
        ],
      })

      expect(result[0].name).toBe('A-Critical')
      expect(result[1].name).toBe('B-Critical')
      expect(result[2].name).toBe('Important')
      expect(result[3].name).toBe('Z-Task')
    })

    it('should handle duplicate goal names', () => {
      const result = rankGoals({
        goals: [
          { name: 'Duplicate', urgencyLevel: 1 },
          { name: 'Duplicate', urgencyLevel: 1 },
          { name: 'Different', urgencyLevel: 2 },
        ],
      })

      expect(result.length).toBe(3)
      const duplicates = result.filter((g) => g.name === 'Duplicate')
      expect(duplicates.length).toBe(2)
    })
  })
})
