const fs = require('fs');
const path = require('path');
const {
  adoptSceneLifecycle,
  withSceneManifest,
  SCENE_DELEGATE_CLASS,
} = require('./ios-scene-lifecycle.transforms');

// The AppDelegate.swift that Expo SDK 57's prebuild template generates.
const template = fs.readFileSync(
  path.join(__dirname, '__fixtures__/AppDelegate.expo-57.swift'),
  'utf8',
);

describe('iOS scene life cycle plugin', () => {
  it("registers expo's scene delegate in Info.plist, keeping other keys", () => {
    const plist = withSceneManifest({ CFBundleName: 'Spendly' });
    expect(plist.CFBundleName).toBe('Spendly');
    expect(
      plist.UIApplicationSceneManifest.UISceneConfigurations.UIWindowSceneSessionRoleApplication,
    ).toEqual([
      {
        UISceneConfigurationName: 'Default Configuration',
        UISceneDelegateClassName: SCENE_DELEGATE_CLASS,
      },
    ]);
    expect(plist.UIApplicationSceneManifest.UIApplicationSupportsMultipleScenes).toBe(false);
  });

  it('makes AppDelegate a factory provider and stops it starting React Native itself', () => {
    const out = adoptSceneLifecycle(template);
    expect(out).toContain('class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    expect(out).not.toContain('factory.startReactNative(');
    expect(out).not.toContain('window = UIWindow(frame: UIScreen.main.bounds)');
    // The factory is still created at launch; the scene delegate uses it.
    expect(out).toContain('reactNativeFactory = factory');
    expect(out).toContain(
      'return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
    );
  });

  it('is idempotent', () => {
    const once = adoptSceneLifecycle(template);
    expect(adoptSceneLifecycle(once)).toBe(once);
  });

  it('fails loudly when the template changes shape', () => {
    expect(() => adoptSceneLifecycle('class Something {}')).toThrow(/no longer matches/);
  });
});
