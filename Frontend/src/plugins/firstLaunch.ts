import { registerPlugin } from '@capacitor/core';

export interface FirstLaunchPlugin {
  checkFirstLaunch(): Promise<{ isFirstLaunch: boolean }>;
}

const FirstLaunch = registerPlugin<FirstLaunchPlugin>('FirstLaunch');

export default FirstLaunch;