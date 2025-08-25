import * as ScreenOrientation from 'expo-screen-orientation';

export const orientationUtils = {
  /**
   * Lock screen to landscape mode for optimal game experience
   */
  async lockToLandscape(): Promise<void> {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      );
      console.log('Orientation locked to landscape');
    } catch (error) {
      console.error('Failed to lock orientation to landscape:', error);
    }
  },

  /**
   * Lock screen to portrait mode for regular app navigation
   */
  async lockToPortrait(): Promise<void> {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
      console.log('Orientation locked to portrait');
    } catch (error) {
      console.error('Failed to lock orientation to portrait:', error);
    }
  },

  /**
   * Unlock screen orientation to allow natural rotation
   */
  async unlockOrientation(): Promise<void> {
    try {
      await ScreenOrientation.unlockAsync();
      console.log('Orientation unlocked');
    } catch (error) {
      console.error('Failed to unlock orientation:', error);
    }
  },

  /**
   * Get current screen orientation
   */
  async getCurrentOrientation(): Promise<ScreenOrientation.Orientation> {
    try {
      return await ScreenOrientation.getOrientationAsync();
    } catch (error) {
      console.error('Failed to get current orientation:', error);
      return ScreenOrientation.Orientation.PORTRAIT_UP;
    }
  },

  /**
   * Check if current orientation is landscape
   */
  async isLandscape(): Promise<boolean> {
    try {
      const orientation = await this.getCurrentOrientation();
      return (
        orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      );
    } catch (error) {
      console.error('Failed to check if landscape:', error);
      return false;
    }
  },

  /**
   * Add orientation change listener
   */
  addOrientationChangeListener(
    listener: (orientationInfo: ScreenOrientation.OrientationChangeEvent) => void
  ): ScreenOrientation.Subscription {
    return ScreenOrientation.addOrientationChangeListener(listener);
  },

  /**
   * Remove orientation change listener
   */
  removeOrientationChangeListener(subscription: ScreenOrientation.Subscription): void {
    ScreenOrientation.removeOrientationChangeListener(subscription);
  }
};