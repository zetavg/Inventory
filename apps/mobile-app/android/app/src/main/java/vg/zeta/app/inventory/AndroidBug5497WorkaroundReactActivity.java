package vg.zeta.app.inventory;

import android.graphics.Rect;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.widget.FrameLayout;

import com.facebook.react.ReactActivity;

/**
 * Created based on https://stackoverflow.com/questions/7417123/android-how-to-adjust-layout-in-full-screen-mode-when-softkeyboard-is-visible/19494006#answer-42261118
 */
public class AndroidBug5497WorkaroundReactActivity extends ReactActivity {

  // For more information, see https://issuetracker.google.com/issues/36911528
  // To use this class, simply invoke assistActivity() on an Activity that already has its content view set.

  private View rootView;
  private ViewGroup contentContainer;
  private ViewTreeObserver viewTreeObserver;
  private ViewTreeObserver.OnGlobalLayoutListener listener = () -> possiblyResizeChildOfContent();
  private Rect contentAreaOfWindowBounds = new Rect();
  private FrameLayout.LayoutParams rootViewLayout;
  private int usableHeightPrevious = 0;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    contentContainer = (ViewGroup) findViewById(android.R.id.content);
    rootView = contentContainer.getChildAt(0);
    rootViewLayout = (FrameLayout.LayoutParams) rootView.getLayoutParams();
  }

  @Override
  protected void onPause() {
    super.onPause();
    if (viewTreeObserver.isAlive()) {
      viewTreeObserver.removeOnGlobalLayoutListener(listener);
    }
  }

  @Override
  protected void onResume() {
    super.onResume();
    if (viewTreeObserver == null || !viewTreeObserver.isAlive()) {
      viewTreeObserver = rootView.getViewTreeObserver();
    }

    viewTreeObserver.addOnGlobalLayoutListener(listener);
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();
    rootView = null;
    contentContainer = null;
    viewTreeObserver = null;
  }

  private void possiblyResizeChildOfContent() {
    contentContainer.getWindowVisibleDisplayFrame(contentAreaOfWindowBounds);
    int usableHeightNow = contentAreaOfWindowBounds.height() + getNavigationBarHeight() + getStatusBarHeight();

    if (usableHeightNow != usableHeightPrevious) {
      rootViewLayout.height = usableHeightNow;
      rootView.layout(contentAreaOfWindowBounds.left, contentAreaOfWindowBounds.top, contentAreaOfWindowBounds.right, contentAreaOfWindowBounds.bottom);
      rootView.requestLayout();

      usableHeightPrevious = usableHeightNow;
    }
  }
  private int getNavigationBarHeight() {
    Rect rectangle = new Rect();
    DisplayMetrics displayMetrics = new DisplayMetrics();
    this.getWindow().getDecorView().getWindowVisibleDisplayFrame(rectangle);
    this.getWindowManager().getDefaultDisplay().getRealMetrics(displayMetrics);
    int measuredResult = displayMetrics.heightPixels - (rectangle.top + rectangle.height());

    int result = 0;
    int resourceId = getResources().getIdentifier("navigation_bar_height", "dimen", "android");
    if (resourceId > 0) {
      result = getResources().getDimensionPixelSize(resourceId);
    }

    if (measuredResult > result + 16) {
      // Keyboard seems to be opened, navigation bar height should be considered as 0
      return 0;
    }

    return result;
  }

  private int getStatusBarHeight() {
    int result = 0;
    int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
    if (resourceId > 0) {
      result = getResources().getDimensionPixelSize(resourceId);
    }
    return result;
  }
}
