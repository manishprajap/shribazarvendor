package com.shribazar.vendor

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

// Handles ALL incoming push messages, in every app state (open, background, killed).
// This replaces relying on Capacitor's default push handling for message delivery.
class OrderMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Keep a local copy natively too, in case JS side hasn't synced yet
        getSharedPreferences("fcm_prefs", Context.MODE_PRIVATE)
            .edit().putString("fcm_token", token).apply()
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val data = message.data
        val type = data["type"] ?: return

        when (type) {
            "new_order" -> showIncomingOrder(data)
            else -> showNormalNotification(data)
        }
    }

    private fun showIncomingOrder(data: Map<String, String>) {
        val orderId = data["order_id"] ?: ""
        val amount = data["amount"] ?: ""
        val customer = data["customer_name"] ?: ""

        // Start the looping ringtone as a foreground service
        val ringIntent = Intent(this, RingtoneForegroundService::class.java)
        startForegroundService(ringIntent)

        // Build the intent for the full-screen accept/reject activity
        val fullScreenIntent = Intent(this, IncomingOrderActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("order_id", orderId)
            putExtra("amount", amount)
            putExtra("customer_name", customer)
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            this, orderId.hashCode(), fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        createChannel("orders_incoming", "Incoming orders", NotificationManager.IMPORTANCE_HIGH)

        val notification = NotificationCompat.Builder(this, "orders_incoming")
            .setSmallIcon(android.R.drawable.ic_dialog_info) // replace with your app icon
            .setContentTitle("New order received")
            .setContentText("₹$amount • $customer")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setAutoCancel(true)
            .setOngoing(true)
            .build()

        getSystemService(NotificationManager::class.java)
            .notify(orderId.hashCode(), notification)

        // Direct launch attempt — works reliably when the app is foreground/background
        // and the screen is on. The full-screen-intent notification above is the
        // guaranteed path when the device is locked or the app is killed.
        try {
            startActivity(fullScreenIntent)
        } catch (e: Exception) {
            // Background-activity-start restrictions on some Android versions/OEMs
            // can block this silently — the full-screen notification still fires.
        }
    }

    private fun showNormalNotification(data: Map<String, String>) {
        val title = data["title"] ?: "ShriBazar"
        val body = data["body"] ?: ""

        createChannel("orders_general", "Order updates", NotificationManager.IMPORTANCE_DEFAULT)

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            data.forEach { (k, v) -> putExtra(k, v) }
        }
        val pendingIntent = PendingIntent.getActivity(
            this, System.currentTimeMillis().toInt(), openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, "orders_general")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        getSystemService(NotificationManager::class.java)
            .notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createChannel(id: String, name: String, importance: Int) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(id) != null) return
        val channel = NotificationChannel(id, name, importance).apply {
            enableVibration(true)
        }
        nm.createNotificationChannel(channel)
    }
}