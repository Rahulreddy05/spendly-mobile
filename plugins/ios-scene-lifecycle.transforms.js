/**
 * Pure transforms behind with-ios-scene-lifecycle.js — kept separate so they are
 * unit-tested without running prebuild.
 *
 * Why: apps built with the iOS 27 SDK must adopt the UIScene life cycle or UIKit
 * refuses to launch them. Expo SDK 57 ships `ExpoAppSceneDelegate` for this, but
 * its prebuild template does not register it yet.
 */

/** Objective-C runtime name of expo's scene delegate (`@objc(EXExpoAppSceneDelegate)`). */
const SCENE_DELEGATE_CLASS = 'EXExpoAppSceneDelegate';
const SCENE_CONFIGURATION_NAME = 'Default Configuration';
const PROVIDER_PROTOCOL = 'ExpoReactNativeFactoryProvider';

const CLASS_DECLARATION = 'class AppDelegate: ExpoAppDelegate {';
// The scene delegate creates the window and starts React Native, so the app
// delegate must not do it as well.
const START_IN_APP_DELEGATE =
  /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

function withSceneManifest(infoPlist) {
  return {
    ...infoPlist,
    UIApplicationSceneManifest: {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: SCENE_CONFIGURATION_NAME,
            UISceneDelegateClassName: SCENE_DELEGATE_CLASS,
          },
        ],
      },
    },
  };
}

function adoptSceneLifecycle(appDelegateSwift) {
  if (appDelegateSwift.includes(PROVIDER_PROTOCOL)) return appDelegateSwift; // already applied

  if (
    !appDelegateSwift.includes(CLASS_DECLARATION) ||
    !START_IN_APP_DELEGATE.test(appDelegateSwift)
  ) {
    // Fail the build loudly rather than ship an app that cannot launch on iOS 27.
    throw new Error(
      'with-ios-scene-lifecycle: AppDelegate.swift no longer matches the expected Expo template. ' +
        'Check whether this Expo version adopts the scene life cycle itself; if so, remove this plugin.',
    );
  }

  return appDelegateSwift
    .replace(CLASS_DECLARATION, `class AppDelegate: ExpoAppDelegate, ${PROVIDER_PROTOCOL} {`)
    .replace(START_IN_APP_DELEGATE, '\n');
}

module.exports = { withSceneManifest, adoptSceneLifecycle, SCENE_DELEGATE_CLASS };
