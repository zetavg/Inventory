package vg.zeta.app.inventory;

import static android.content.Context.AUDIO_SERVICE;

import android.media.AudioManager;
import android.media.SoundPool;
import android.os.AsyncTask;
import android.os.Message;
import android.text.TextUtils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.rscja.deviceapi.RFIDWithUHFUART;
import com.rscja.deviceapi.entity.UHFTAGInfo;
import com.rscja.deviceapi.interfaces.IUHF;
import com.rscja.deviceapi.interfaces.IUHFLocationCallback;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

public class RFIDWithUHFUARTModule extends ReactContextBaseJavaModule {

  ReactApplicationContext context;
  public RFIDWithUHFUART uhfReader;
  public Set<String> scannedTags = new HashSet<String>();

  private int scanRate = 10;
  private int scanEventRate = 100;

  private static final String TAG = "RFIDWithUHFUARTModule";

  RFIDWithUHFUARTModule(ReactApplicationContext context) {
    super(context);
    this.context = context;
  }

  @Override
  public String getName() {
    return "RFIDWithUHFUARTModule";
  }

  @ReactMethod
  public void init(Promise promise) {
    InitTask initTask = new InitTask();
    initTask.setPromise(promise);
    try {
      if (uhfReader == null) uhfReader = RFIDWithUHFUART.getInstance();
      initSound();
      initTask.execute();
    } catch (Exception e) {
      promise.reject(e.getMessage(), new Throwable(e.getMessage()));
    }
  }

  public void prepareOperation() {}
  public void prepareStartScan() {}

  public class InitTask extends AsyncTask<String, Integer, Boolean> {
    private Promise promise;

    protected void setPromise(Promise p){
      this.promise = p;
    }

    @Override
    protected void onPreExecute() {
      super.onPreExecute();
    }

    @Override
    protected Boolean doInBackground(String... params) {
      try {
        // uhfReader.free();
        return uhfReader.init();
      } catch (Exception e) {
        promise.reject(e.getMessage(), new Throwable(e.getMessage()));
      }
      return false;
    }

    @Override
    protected void onPostExecute(Boolean result) {
      super.onPostExecute(result);
      try {
        if (result) {
          // uhfReader.setPower(28);
          // uhfReader.setEPCMode();
          promise.resolve(true);
        } else {
          promise.reject("UHF reader init failed", new Throwable("UHF reader init failed"));
        }
      } catch (Exception e) {
        promise.reject(e.getMessage(), new Throwable(e.getMessage()));
      }
    }
  }

  @ReactMethod
  public void free(Promise promise) {
    try {
      if (uhfReader == null) uhfReader = RFIDWithUHFUART.getInstance();
      prepareOperation();
      boolean result = uhfReader.free();
      if (result) {
        promise.resolve(true);
      } else {
        promise.reject(new Throwable("UHF reader free failed"));
      }
      releaseSoundPool();
    } catch (Exception e) {
      promise.reject(e.getMessage(), e);
    }
  }

  @ReactMethod
  public void isPowerOn(Promise promise) {
    try {
      if (uhfReader == null) uhfReader = RFIDWithUHFUART.getInstance();
      prepareOperation();
      promise.resolve(uhfReader.isPowerOn());
    } catch (Exception e) {
      promise.reject(e.getMessage(), e);
    }
  }

  @ReactMethod
  public void isWorking(Promise promise) {
    try {
      prepareOperation();
      promise.resolve(uhfReader.isWorking());
    } catch (Exception e) {
      promise.reject(e.getMessage(), e);
    }
  }

  @ReactMethod
  public void getFrequencyMode(Promise promise) {
    try {
      prepareOperation();
      int result = uhfReader.getFrequencyMode();
      promise.resolve(result);
    } catch (Exception e) {
      promise.reject(e.getMessage(), e);
    }
  }

  @ReactMethod
  public void setFrequencyMode(int mode, Promise promise) {
    try {
      prepareOperation();
      boolean result = uhfReader.setFrequencyMode(mode);
      if (result) {
        promise.resolve(true);
      } else {
        promise.reject(new Throwable("setFrequencyMode returned false"));
      }
    } catch (Exception e) {
      promise.reject(e.getMessage(), e);
    }
  }

  @ReactMethod
  public void setPower(int p, Promise promise) {
    try {
      boolean result = uhfReader.setPower(p);
      if (!result) promise.reject(new Throwable("setPower returned false"));
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void startScan(
          int power,
          boolean enableFilter,
          int filterBank,
          int filterPtr,
          int filterLen,
          String filterData,
          int rate,
          int eventRate,
          boolean playSound,
          Promise promise
  ) {
    scanRate = rate;
    scanEventRate = eventRate;
    try {
      prepareStartScan();
      this.playSoundFlag = playSound;
      if (!uhfReader.setPower(power)) {
        promise.reject(new Throwable("setPower returned false"));
        return;
      }

      if (enableFilter) {
        if (!(uhfReader.setFilter(filterBank, filterPtr, filterLen, filterData))) {
          promise.reject(new Throwable("setFilter returned false"));
          return;
        }
      } else {
        String filterDataStr = "";
        if (!(uhfReader.setFilter(RFIDWithUHFUART.Bank_EPC, 0, 0, filterDataStr) &&
                uhfReader.setFilter(RFIDWithUHFUART.Bank_TID, 0, 0, filterDataStr) &&
                uhfReader.setFilter(RFIDWithUHFUART.Bank_USER, 0, 0, filterDataStr)
        )) {
          promise.reject(new Throwable("setFilter returned false"));
          return;
        }
      }

      boolean started = uhfReader.startInventoryTag();
      if (!started) {
        promise.reject(new Throwable("startInventoryTag returned false"));
        return;
      }

      keepScanTagFlag = true;
      new ScanTagThread().start();
    } catch (Exception e) {
      promise.reject(e);
    }

    promise.resolve(true);
  }


  public boolean keepScanTagFlag = false;

  class ScanTagThread extends Thread {
    public void run() {
      UHFTAGInfo tagData;
      Message msg;
      WritableArray arr = Arguments.createArray();
      long lastEventEmittedAt = 0;
      while (keepScanTagFlag) {
        tagData = uhfReader.readTagFromBuffer();
        if (tagData != null) {
          WritableMap payload = Arguments.createMap();
          payload.putString("tid", tagData.getTid());
          payload.putString("epc", tagData.getEPC());
          payload.putString("rssi", tagData.getRssi());

          arr.pushMap(payload);

          String epc = tagData.getEPC();

          if (playSoundFlag) {
            if (scannedTags.contains(epc)) {
              playSound(2);
            } else {
              playSound(1);
            }
          }

          scannedTags.add(epc);

          try {
            Thread.sleep(scanRate);
          } catch (InterruptedException e) {
            e.printStackTrace();
          }
        }

        long currentTime = System.currentTimeMillis();

        if (currentTime - lastEventEmittedAt > scanEventRate) {
          getReactApplicationContext()
                  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                  .emit("uhfScanData", arr);
          arr = Arguments.createArray();
          lastEventEmittedAt = currentTime;
        }
      }

      if (arr.size() > 0) {
        getReactApplicationContext()
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("uhfScanData", arr);
      }
    }
  }

  @ReactMethod
  public void stopScan(Promise promise) {
    try {
      keepScanTagFlag = false;

      if (!uhfReader.stopInventory()) {
        promise.reject(new Throwable("stopInventory returned false"));
        return;
      }
    } catch (Exception e) {
      promise.reject(e);
    }

    promise.resolve(true);
  }

  @ReactMethod
  public void clearScannedTags(Promise promise) {
    try {
      scannedTags.clear();
    } catch (Exception e) {
      promise.reject(e);
    }

    promise.resolve(true);
  }

  @ReactMethod
  public void startLocate(String epc, int power, boolean playSound, Promise promise) {
    try {
      prepareOperation();
      this.playSoundFlag = playSound;
      if (!uhfReader.setPower(power)) {
        promise.reject(new Throwable("setPower returned false"));
        return;
      }

      boolean result = uhfReader.startLocation(context, epc, IUHF.Bank_EPC,32, new IUHFLocationCallback() {
        @Override
        public void getLocationValue(int value) {
          getReactApplicationContext()
                  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                  .emit("uhfLocateValue", value);
          if (playSoundFlag) {
            playSound(2);
          }
        }
      });

      if (!result) {
        promise.reject("startLocation returned false", new Throwable("startLocation returned false"));
      } else {
        promise.resolve(true);
      }
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void stopLocate(Promise promise) {
    try {
      prepareOperation();
      boolean result = uhfReader.stopLocation();
      if (!result) {
        promise.reject("stopLocation returned false", new Throwable("stopLocation returned false"));
      } else {
        promise.resolve(true);
      }
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void read(
          int power,
          int bank,
          int ptr,
          int cnt,
          String pwd,
          boolean enableFilter,
          int filterBank,
          int filterPtr,
          int filterLen,
          String filterData,
          boolean playSound,
          Promise promise
  ) {
    try {
      prepareOperation();
      this.playSoundFlag = playSound;
      if (!uhfReader.setPower(power)) {
        promise.reject(new Throwable("setPower returned false"));
        return;
      }

      String data;
      if (enableFilter) {
        data = uhfReader.readData(pwd,
                filterBank,
                filterPtr,
                filterLen,
                filterData,
                bank,
                ptr,
                cnt
        );
      } else {
        data = uhfReader.readData(pwd, bank, ptr, cnt);
      }

      if (!TextUtils.isEmpty(data)) {
        promise.resolve(data);

        if (this.playSoundFlag) {
          playSound(1);
        }
      } else {
        promise.reject("fail", new Throwable("fail"));

        if (this.playSoundFlag) {
          playSound(3);
        }
      }
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void write(
          int power,
          int bank,
          int ptr,
          int cnt,
          String pwd,
          String data,
          boolean enableFilter,
          int filterBank,
          int filterPtr,
          int filterLen,
          String filterData,
          boolean playSound,
          Promise promise
  ) {
    try {
      prepareOperation();
      this.playSoundFlag = playSound;
      if (!uhfReader.setPower(power)) {
        promise.reject(new Throwable("setPower returned false"));
        return;
      }

      boolean result;

      if (enableFilter) {
        result = uhfReader.writeData(pwd,
                filterBank,
                filterPtr,
                filterLen,
                filterData,
                bank,
                ptr,
                cnt,
                data
        );
      } else {
        result = uhfReader.writeData(pwd, bank, ptr, cnt, data);
      }

      if (result) {
        promise.resolve(data);

        if (this.playSoundFlag) {
          playSound(1);
        }
      } else {
        promise.reject(new Throwable("writeData returned false"));

        if (this.playSoundFlag) {
          playSound(3);
        }
      }
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void lock(
          int power,
          String pwd,
          String code,
          boolean enableFilter,
          int filterBank,
          int filterPtr,
          int filterLen,
          String filterData,
          boolean playSound,
          Promise promise
  ) {
    try {
      prepareOperation();
      this.playSoundFlag = playSound;
      if (!uhfReader.setPower(power)) {
        promise.reject(new Throwable("setPower returned false"));
        return;
      }

      boolean result;

      if (enableFilter) {
        result = uhfReader.lockMem(pwd,
                filterBank,
                filterPtr,
                filterLen,
                filterData,
                code
        );
      } else {
        result = uhfReader.lockMem(pwd, code);
      }

      if (result) {
        promise.resolve(true);

        if (this.playSoundFlag) {
          playSound(1);
        }
      } else {
        promise.reject(new Throwable("lockMem returned false"));

        if (this.playSoundFlag) {
          playSound(3);
        }
      }
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  private boolean playSoundFlag;
  HashMap<Integer, Integer> soundMap = new HashMap<Integer, Integer>();
  private SoundPool soundPool1;
  private SoundPool soundPool2;
  private float volumeRatio;
  private AudioManager am;

  private void initSound() {
    // soundPool = new SoundPool(10, AudioManager.STREAM_MUSIC, 5);
    soundPool1 = new SoundPool.Builder()
            .setMaxStreams(4)
            .build();
    soundPool2 = new SoundPool.Builder()
            .setMaxStreams(4)
            .build();
    soundMap.put(1, soundPool1.load(context, R.raw.beep, 1));
    soundMap.put(2, soundPool2.load(context, R.raw.beep_slight, 1));
    soundMap.put(3, soundPool1.load(context, R.raw.serror, 1));
    am = (AudioManager) context.getSystemService(AUDIO_SERVICE);
  }

  private void releaseSoundPool() {
    if (soundPool1 != null) {
      soundPool1.release();
      soundPool1 = null;
    }
    if (soundPool2 != null) {
      soundPool2.release();
      soundPool2 = null;
    }
  }

  @ReactMethod
  public void playSound(int id) {
    float audioMaxVolume = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
    float audioCurrentVolume = am.getStreamVolume(AudioManager.STREAM_MUSIC);
    volumeRatio = audioCurrentVolume / audioMaxVolume;
    try {
      SoundPool soundPool;

      if (id == 2) {
        soundPool = soundPool2;
      } else {
        soundPool = soundPool1;
      }

      soundPool.play(soundMap.get(id),
              volumeRatio, // Left channel volume
              volumeRatio, // right channel volume
              1, // priority, 0 is highest
              0, // loop count, 0 = no loop, -1 = loop forever
              1 // playback speed
      );
    } catch (Exception e) {
      e.printStackTrace();
    }
  }
}

