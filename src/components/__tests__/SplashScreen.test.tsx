import React from 'react';
import { render, act } from '@testing-library/react-native';
import { SplashScreen } from '../SplashScreen';

jest.useFakeTimers();

describe('SplashScreen', () => {
  it('renders logo text', () => {
    const { getByText } = render(
      <SplashScreen visible={true} onAnimationComplete={() => {}} />
    );
    expect(getByText('KORA')).toBeTruthy();
  });

  it('renders tagline', () => {
    const { getByText } = render(
      <SplashScreen visible={true} onAnimationComplete={() => {}} />
    );
    expect(getByText('Instant Play. Endless Fun.')).toBeTruthy();
  });

  it('calls onAnimationComplete after minimum display time', () => {
    const onComplete = jest.fn();
    render(<SplashScreen visible={true} onAnimationComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1200); // 800ms min + animation time
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <SplashScreen visible={false} onAnimationComplete={() => {}} />
    );
    expect(queryByText('KORA')).toBeNull();
  });
});
