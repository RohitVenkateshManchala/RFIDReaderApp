package com.rfidreaderapp.uhf

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.seuic.uhf.UHFService
import com.seuic.uhf.EPC

class UHFModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var uhfService: UHFService? = null

    init {
        uhfService = UHFService.getInstance(reactContext)
    }

    override fun getName(): String {
        return "UHFModule"
    }

    @ReactMethod
    fun openUHF(promise: Promise) {
        val result = uhfService?.open() ?: false
        if (result) {
            promise.resolve("UHF module opened successfully")
        } else {
            promise.reject("E_OPEN_FAILED", "Failed to open UHF module")
        }
    }

    @ReactMethod
    fun closeUHF(promise: Promise) {
        uhfService?.close()
        promise.resolve("UHF module closed successfully")
    }

    @ReactMethod
    fun isUHFOpen(promise: Promise) {
        val result = uhfService?.isOpen() ?: false
        promise.resolve(result)
    }

    @ReactMethod
    fun getFirmwareVersion(promise: Promise) {
        val firmwareVersion = uhfService?.firmwareVersion
        if (firmwareVersion != null) {
            promise.resolve(firmwareVersion)
        } else {
            promise.reject("E_FIRMWARE_FAILED", "Failed to get firmware version")
        }
    }

    @ReactMethod
    fun getTemperature(promise: Promise) {
        val temperature = uhfService?.temperature
        if (temperature != null) {
            promise.resolve(temperature)
        } else {
            promise.reject("E_TEMP_FAILED", "Failed to get temperature")
        }
    }

    @ReactMethod
    fun getPower(promise: Promise) {
        val power = uhfService?.power ?: 0
        promise.resolve(power)
    }

    @ReactMethod
    fun setPower(power: Int, promise: Promise) {
        val result = uhfService?.setPower(power) ?: false
        if (result) {
            promise.resolve("Power set to $power dBm")
        } else {
            promise.reject("E_POWER_FAILED", "Failed to set power")
        }
    }

    @ReactMethod
    fun getRegion(promise: Promise) {
        val region = uhfService?.region
        if (region != null) {
            promise.resolve(region)
        } else {
            promise.reject("E_REGION_FAILED", "Failed to get region")
        }
    }

    @ReactMethod
    fun setRegion(region: String, promise: Promise) {
        val result = uhfService?.setRegion(region) ?: false
        if (result) {
            promise.resolve("Region set to $region")
        } else {
            promise.reject("E_REGION_FAILED", "Failed to set region")
        }
    }

    @ReactMethod
    fun inventoryOnce(timeout: Int, promise: Promise) {
        val epc = EPC()
        val result = uhfService?.inventoryOnce(epc, timeout) ?: false
        if (result) {
            promise.resolve(byteArrayToHexString(epc.id))
        } else {
            promise.reject("E_INVENTORY_FAILED", "Failed to read tag once")
        }
    }

    @ReactMethod
    fun startScan(promise: Promise) {
        val result = uhfService?.inventoryStart() ?: false
        if (result) {
            promise.resolve("Scanning started")
        } else {
            promise.reject("E_SCAN_FAILED", "Failed to start scanning")
        }
    }

    @ReactMethod
    fun stopScan(promise: Promise) {
        val result = uhfService?.inventoryStop() ?: false
        if (result) {
            promise.resolve("Scanning stopped")
        } else {
            promise.reject("E_STOP_FAILED", "Failed to stop scanning")
        }
    }

    @ReactMethod
    fun getTagIDs(promise: Promise) {
        val tagList = uhfService?.tagIDs ?: emptyList<EPC>()
        val tagIDs: WritableArray = Arguments.createArray()

        for (epc in tagList) {
            tagIDs.pushString(byteArrayToHexString(epc.id))
        }

        promise.resolve(tagIDs)
    }

    @ReactMethod
    fun readTagData(epcHex: String, passwordHex: String, bank: Int, offset: Int, length: Int, promise: Promise) {
        val epc = hexStringToByteArray(epcHex)
        val password = hexStringToByteArray(passwordHex)
        val data = ByteArray(length)
        val result = uhfService?.readTagData(epc, password, bank, offset, length, data) ?: false
        if (result) {
            promise.resolve(byteArrayToHexString(data))
        } else {
            promise.reject("E_READ_FAILED", "Failed to read tag data")
        }
    }

    @ReactMethod
    fun writeTagData(epcHex: String, passwordHex: String, bank: Int, offset: Int, dataHex: String, promise: Promise) {
        val epc = hexStringToByteArray(epcHex)
        val password = hexStringToByteArray(passwordHex)
        val data = hexStringToByteArray(dataHex)
        val result = uhfService?.writeTagData(epc, password, bank, offset, data.size, data) ?: false
        if (result) {
            promise.resolve("Tag data written successfully")
        } else {
            promise.reject("E_WRITE_FAILED", "Failed to write tag data")
        }
    }

    // Utility functions
    private fun byteArrayToHexString(bytes: ByteArray): String {
        val hexString = StringBuilder()
        for (byte in bytes) {
            val hex = Integer.toHexString(byte.toInt() and 0xFF)
            if (hex.length == 1) {
                hexString.append('0')
            }
            hexString.append(hex)
        }
        return hexString.toString().toUpperCase()
    }

    private fun hexStringToByteArray(hexString: String): ByteArray {
        val len = hexString.length
        val data = ByteArray(len / 2)
        for (i in 0 until len step 2) {
            data[i / 2] = ((Character.digit(hexString[i], 16) shl 4) + Character.digit(hexString[i + 1], 16)).toByte()
        }
        return data
    }
}
