import React, { createContext, useContext, useMemo } from 'react';
import { useNames } from './NamesContext';

// Cumulative thresholds — learn this many names (any names) to complete each stone.
// Stone 1 → 14 total learned, Stone 2 → 28, …, Stone 7 → 99
const THRESHOLDS = [14, 28, 42, 56, 70, 84, 99];

export const MILESTONE_SECTIONS = [
  { id: 1, label: 'Dawn',    threshold: 14 },
  { id: 2, label: 'Rising',  threshold: 28 },
  { id: 3, label: 'Clarity', threshold: 42 },
  { id: 4, label: 'Grace',   threshold: 56 },
  { id: 5, label: 'Wisdom',  threshold: 70 },
  { id: 6, label: 'Ascent',  threshold: 84 },
  { id: 7, label: 'Mastery', threshold: 99 },
];

const MilestoneContext = createContext();

export const MilestoneProvider = ({ children }) => {
  const { learnedIds, masteredIds, viewedIds } = useNames();

  // Total unique names the user has interacted with:
  // opened (viewed), formally learned, or mastered
  const totalLearned = useMemo(
    () => new Set([...viewedIds, ...learnedIds, ...masteredIds]).size,
    [viewedIds, learnedIds, masteredIds],
  );

  const milestones = useMemo(() => {
    return MILESTONE_SECTIONS.map((section, idx) => {
      const prevThreshold = idx === 0 ? 0 : THRESHOLDS[idx - 1];
      const currThreshold = THRESHOLDS[idx];
      const sectionSize   = currThreshold - prevThreshold;

      // How many names have been learned toward THIS specific stone
      const learnedToward = Math.max(0, Math.min(sectionSize, totalLearned - prevThreshold));
      const progress      = learnedToward / sectionSize;

      let status;
      if (totalLearned >= currThreshold) {
        status = 'completed';
      } else {
        status = 'locked';
      }

      return {
        ...section,
        status,
        learned: learnedToward,
        total:   sectionSize,
        progress,
      };
    });
  }, [totalLearned]);

  const currentIndex = milestones.findIndex(m => m.status === 'locked');
  const allCompleted  = totalLearned >= 99;

  return (
    <MilestoneContext.Provider value={{ milestones, currentIndex, allCompleted }}>
      {children}
    </MilestoneContext.Provider>
  );
};

export const useMilestones = () => useContext(MilestoneContext);
