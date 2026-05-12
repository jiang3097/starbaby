package com.starbaby.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 启用边缘到边缘显示
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        // 隐藏系统栏（状态栏和导航栏）
        WindowInsetsControllerCompat windowInsetsController = 
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (windowInsetsController != null) {
            windowInsetsController.hide(WindowInsetsCompat.Type.systemBars());
            windowInsetsController.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
        
        // 保持屏幕常亮（可选）
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            WindowInsetsControllerCompat windowInsetsController = 
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (windowInsetsController != null) {
                windowInsetsController.hide(WindowInsetsCompat.Type.systemBars());
                windowInsetsController.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        }
    }
}
