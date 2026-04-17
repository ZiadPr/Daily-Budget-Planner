package com.moneynote.budget;

import android.os.Bundle;
import android.graphics.Color;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SmsMonitorPlugin.class);
        registerPlugin(DeviceSecurityPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        getWindow().setStatusBarColor(Color.parseColor("#091224"));
        getWindow().setNavigationBarColor(Color.parseColor("#060d1a"));
    }
}
