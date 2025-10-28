/**
 * Custom Hook: useCurrentClip
 * 
 * Finds the clip at the current playhead position on the timeline.
 * Uses memoization to avoid unnecessary recalculations.
 */

import { useMemo } from 'react';
import { useTimelineStore } from '../store/timelineStore';
import { TimelineClip } from '../types/timeline';

/**
 * Returns the clip currently at the playhead position, or null if no clip exists there.
 * Memoized for performance - only recalculates when tracks or playhead position changes.
 */
export const useCurrentClip = (): TimelineClip | null => {
  const tracks = useTimelineStore((state) => state.tracks);
  const playheadPosition = useTimelineStore((state) => state.playheadPosition);
  
  return useMemo(() => {
    for (const track of tracks) {
      const clip = track.clips.find(
        c => c.startTime <= playheadPosition && 
        (c.startTime + c.duration) > playheadPosition
      );
      if (clip) {
        return clip;
      }
    }
    return null;
  }, [tracks, playheadPosition]);
};

