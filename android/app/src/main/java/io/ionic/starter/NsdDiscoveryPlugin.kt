package io.ionic.starter

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NsdDiscovery")
class NsdDiscoveryPlugin : Plugin() {

    private val TAG = "NsdDiscovery"
    private var nsdManager: NsdManager? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null
    private var isDiscovering = false
    private var lastResolved: NsdServiceInfo? = null

    override fun load() {
        nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
        Log.d(TAG, "NSD Discovery plugin loaded")
    }

    @PluginMethod
    fun discoverService(call: PluginCall) {
        val serviceName = call.getString("serviceName", "Monitor Controller") ?: "Monitor Controller"
        val serviceType = call.getString("serviceType", "_http._tcp.") ?: "_http._tcp."
        val timeout = call.getInt("timeout", 10000) ?: 10000

        // Stop any existing discovery
        stopCurrentDiscovery()

        val handler = Handler(Looper.getMainLooper())
        var resolved = false

        // Timeout runnable
        val timeoutRunnable = Runnable {
            if (!resolved) {
                resolved = true
                stopCurrentDiscovery()
                call.reject("Discovery timed out after ${timeout}ms")
            }
        }
        handler.postDelayed(timeoutRunnable, timeout.toLong())

        discoveryListener = object : NsdManager.DiscoveryListener {

            override fun onDiscoveryStarted(regType: String) {
                Log.d(TAG, "Discovery started for $regType")
            }

            override fun onServiceFound(service: NsdServiceInfo) {
                Log.d(TAG, "Service found: ${service.serviceName} (${service.serviceType})")

                if (service.serviceName.contains(serviceName, ignoreCase = true)) {
                    Log.d(TAG, "Matching service found, resolving...")
                    nsdManager?.resolveService(service, object : NsdManager.ResolveListener {
                        override fun onResolveFailed(si: NsdServiceInfo, errorCode: Int) {
                            Log.e(TAG, "Resolve failed: errorCode=$errorCode")
                            if (!resolved) {
                                resolved = true
                                handler.removeCallbacks(timeoutRunnable)
                                stopCurrentDiscovery()
                                call.reject("Failed to resolve service (error=$errorCode)")
                            }
                        }

                        override fun onServiceResolved(si: NsdServiceInfo) {
                            Log.d(TAG, "Resolved: ${si.host?.hostAddress}:${si.port}")
                            if (!resolved) {
                                resolved = true
                                handler.removeCallbacks(timeoutRunnable)
                                stopCurrentDiscovery()
                                lastResolved = si

                                val result = JSObject()
                                result.put("host", si.host?.hostAddress ?: "")
                                result.put("port", si.port)
                                result.put("serviceName", si.serviceName)
                                result.put("serviceType", si.serviceType)
                                call.resolve(result)
                            }
                        }
                    })
                }
            }

            override fun onServiceLost(service: NsdServiceInfo) {
                Log.d(TAG, "Service lost: ${service.serviceName}")
            }

            override fun onDiscoveryStopped(serviceType: String) {
                Log.d(TAG, "Discovery stopped for $serviceType")
                isDiscovering = false
            }

            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e(TAG, "Discovery start failed: errorCode=$errorCode")
                isDiscovering = false
                if (!resolved) {
                    resolved = true
                    handler.removeCallbacks(timeoutRunnable)
                    call.reject("Discovery start failed (error=$errorCode)")
                }
            }

            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e(TAG, "Discovery stop failed: errorCode=$errorCode")
                isDiscovering = false
            }
        }

        try {
            nsdManager?.discoverServices(serviceType, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
            isDiscovering = true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start discovery", e)
            handler.removeCallbacks(timeoutRunnable)
            call.reject("Failed to start NSD: ${e.message}")
        }
    }

    @PluginMethod
    fun stopDiscovery(call: PluginCall) {
        stopCurrentDiscovery()
        call.resolve()
    }

    @PluginMethod
    fun getResolvedService(call: PluginCall) {
        val si = lastResolved
        if (si != null) {
            val result = JSObject()
            result.put("host", si.host?.hostAddress ?: "")
            result.put("port", si.port)
            result.put("serviceName", si.serviceName)
            result.put("serviceType", si.serviceType)
            call.resolve(result)
        } else {
            call.reject("No resolved service available")
        }
    }

    private fun stopCurrentDiscovery() {
        if (isDiscovering && discoveryListener != null) {
            try {
                nsdManager?.stopServiceDiscovery(discoveryListener)
            } catch (e: Exception) {
                Log.w(TAG, "Error stopping discovery: ${e.message}")
            }
            isDiscovering = false
        }
    }
}
