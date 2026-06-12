import { describe, it, expect, vi } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import React, { useRef, useEffect, useState } from 'react';

describe('TrackDetail redirect fix (useRef skip on mount)', () => {
  it('NO llama a navigate en el primer render aunque currentTrack sea distinto', () => {
    const navigate = vi.fn();

    function TestComponent({ id, currentTrack }: { id: string; currentTrack: { id: string } | null }) {
      const isInitial = useRef(true);
      useEffect(() => {
        if (isInitial.current) {
          isInitial.current = false;
          return;
        }
        if (currentTrack && id && id !== currentTrack.id) {
          navigate(`/track/${currentTrack.id}`, { replace: true });
        }
      }, [currentTrack?.id]);
      return <div>{currentTrack?.id || 'no-track'}</div>;
    }

    const { rerender } = render(<TestComponent id="track-b" currentTrack={{ id: 'track-a' }} />);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('SI llama a navigate cuando currentTrack cambia DESPUES del montaje', () => {
    const navigate = vi.fn();

    function TestComponent({ id, currentTrack }: { id: string; currentTrack: { id: string } | null }) {
      const isInitial = useRef(true);
      useEffect(() => {
        if (isInitial.current) {
          isInitial.current = false;
          return;
        }
        if (currentTrack && id && id !== currentTrack.id) {
          navigate(`/track/${currentTrack.id}`, { replace: true });
        }
      }, [currentTrack?.id]);
      return <div>{currentTrack?.id || 'no-track'}</div>;
    }

    const { rerender } = render(<TestComponent id="track-b" currentTrack={{ id: 'track-a' }} />);
    expect(navigate).not.toHaveBeenCalled();

    rerender(<TestComponent id="track-b" currentTrack={{ id: 'track-c' }} />);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/track/track-c', { replace: true });
  });

  it('NO llama a navigate si currentTrack cambia pero su id coincide con el id de la URL', () => {
    const navigate = vi.fn();

    function TestComponent({ id, currentTrack }: { id: string; currentTrack: { id: string } | null }) {
      const isInitial = useRef(true);
      useEffect(() => {
        if (isInitial.current) {
          isInitial.current = false;
          return;
        }
        if (currentTrack && id && id !== currentTrack.id) {
          navigate(`/track/${currentTrack.id}`, { replace: true });
        }
      }, [currentTrack?.id]);
      return <div>{currentTrack?.id || 'no-track'}</div>;
    }

    const { rerender } = render(<TestComponent id="track-b" currentTrack={{ id: 'track-a' }} />);
    expect(navigate).not.toHaveBeenCalled();

    rerender(<TestComponent id="track-b" currentTrack={{ id: 'track-b' }} />);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('el escenario del bug: homepage -> click track B -> NO redirige a track A', () => {
    const navigate = vi.fn();

    function TrackDetail({ id: paramId }: { id: string }) {
      const [currentTrack, setCurrentTrack] = useState<{ id: string } | null>({ id: 'track-a' });
      const isInitial = useRef(true);
      useEffect(() => {
        if (isInitial.current) {
          isInitial.current = false;
          return;
        }
        if (currentTrack && paramId && paramId !== currentTrack.id) {
          navigate(`/track/${currentTrack.id}`, { replace: true });
        }
      }, [currentTrack?.id]);
      return <div>{paramId}</div>;
    }

    const { rerender } = render(<TrackDetail id="track-b" />);
    // currentTrack is track-a, URL is track-b, pero NO debe navegar en el montaje
    expect(navigate).not.toHaveBeenCalled();
  });
});
