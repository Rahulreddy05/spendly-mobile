const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');
const { adoptSceneLifecycle, withSceneManifest } = require('./ios-scene-lifecycle.transforms');

/**
 * Adopts the UIScene life cycle on iOS (required by the iOS 27 SDK) using
 * Expo's `ExpoAppSceneDelegate`. Applied on every prebuild, so the generated
 * ios/ folder never needs hand edits.
 */
module.exports = function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults = withSceneManifest(cfg.modResults);
    return cfg;
  });
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('with-ios-scene-lifecycle expects a Swift AppDelegate.');
    }
    cfg.modResults.contents = adoptSceneLifecycle(cfg.modResults.contents);
    return cfg;
  });
};
