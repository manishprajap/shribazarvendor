package com.shribazar.vendor

import android.app.KeyguardManager
import android.app.NotificationManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import java.io.IOException

// TODO: replace with your real API base URL
private const val API_BASE_URL = "https://shriecom.in/appapis/shreefood/public/api"

class IncomingOrderActivity : AppCompatActivity() {

    private lateinit var orderId: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setShowOnLockScreen()
        setContentView(R.layout.activity_incoming_order)

        orderId = intent.getStringExtra("order_id") ?: ""
        val amount = intent.getStringExtra("amount") ?: ""
        val customer = intent.getStringExtra("customer_name") ?: ""

        findViewById<TextView>(R.id.tvAmount).text = "₹$amount"
        findViewById<TextView>(R.id.tvCustomer).text = customer

        findViewById<Button>(R.id.btnAccept).setOnClickListener { respondToOrder(accept = true) }
        findViewById<Button>(R.id.btnReject).setOnClickListener { respondToOrder(accept = false) }
    }

    private fun setShowOnLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val km = getSystemService(KeyguardManager::class.java)
            km?.requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }
    }

    private fun respondToOrder(accept: Boolean) {
        stopRinging()

        // Reads the token saved via @capacitor/preferences (see README step 4).
        // Default Capacitor Preferences storage file is "CapacitorStorage".
        val prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE)
        val authToken = prefs.getString("auth_token", null)

        val endpoint = if (accept) "orders/$orderId/accept" else "orders/$orderId/reject"
        val client = OkHttpClient()
        val request = Request.Builder()
            .url(API_BASE_URL + endpoint)
            .addHeader("Authorization", "Bearer $authToken")
            .post(RequestBody.create("application/json".toMediaTypeOrNull(), "{}"))
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) = finishAndOpenApp()
            override fun onResponse(call: Call, response: okhttp3.Response) = finishAndOpenApp()
        })
    }

    private fun stopRinging() {
        startService(Intent(this, RingtoneForegroundService::class.java).apply {
            action = "STOP_RING"
        })
        getSystemService(NotificationManager::class.java).cancel(orderId.hashCode())
    }

    private fun finishAndOpenApp() {
        val openApp = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("order_id", orderId)
        }
        runOnUiThread {
            startActivity(openApp)
            finish()
        }
    }

    // Blocks dismissing via back button — forces an explicit Accept/Reject tap.
    // Remove this override if you'd rather allow back to just close the alert.
    override fun onBackPressed() {}
}