#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>


@implementation AppDelegate {
  UIView *launchScreenView; // The launch screen view
  BOOL launchScreenViewShouldBeRemoved;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"Inventory";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  // Mimic the launch screen for more smooth transition
  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil];
  UIViewController *launchScreenVC = [storyboard instantiateInitialViewController];
  launchScreenView = launchScreenVC.view;
  launchScreenViewShouldBeRemoved = NO;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleAppLoaded)
                                               name:@"appLoaded"
                                             object:nil];

  BOOL success = [super application:application didFinishLaunchingWithOptions:launchOptions];

  if (success && !launchScreenViewShouldBeRemoved) {
    // Add the mimic launch screen view to the main window
    UIWindow *mainWindow = [UIApplication sharedApplication].delegate.window;
    [mainWindow addSubview:launchScreenView];
    [mainWindow bringSubviewToFront:launchScreenView];
  }

  return success;
}

- (void)handleAppLoaded
{
  launchScreenViewShouldBeRemoved = YES;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [UIView animateWithDuration:0.3 animations:^{
      self->launchScreenView.alpha = 0;
    } completion:^(BOOL finished) {
      [self->launchScreenView removeFromSuperview];
    }];
  });
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

@end
