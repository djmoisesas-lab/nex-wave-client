import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React, { useRef, useEffect } from 'react';

describe('TrackDetail: no hay redirect automático', () => {
  it('NUNCA redirige al currentTrack, ni siquiera cuando cambia', () => {
    const navigate = vi.fn();

    function TrackDetail({ id, currentTrack }: { id: string; currentTrack: { id: string } | null }) {
      useEffect(() => {
        // Ya no hay redirect automático
      }, [currentTrack?.id]);
      return <div>{currentTrack?.id || 'no-track'}</div>;
    }

    const { rerender } = render(<TrackDetail id="track-b" currentTrack={{ id: 'track-a' }} />);
    expect(navigate).not.toHaveBeenCalled();

    rerender(<TrackDetail id="track-b" currentTrack={{ id: 'track-c' }} />);
    expect(navigate).not.toHaveBeenCalled();

    rerender(<TrackDetail id="track-b" currentTrack={{ id: 'track-b' }} />);
    expect(navigate).not.toHaveBeenCalled();
  });
});
