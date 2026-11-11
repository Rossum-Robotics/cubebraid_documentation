3.7 车体姿态感知模块（Inclinometer SDK）
==========================================

头文件：``include/CubeBraidSDK/SensorSDK/InclinometerSDK.h``

命名空间：``InclinometerSDK``

SensorSDK 通过串口采集 DXL360 倾角仪的 X/Y 角度，支持自动重连、运行状态查询和角度归零。

3.7.1 倾角仪配置与通信
-----------------------

``InclinometerConfig`` 字段：

* ``port``：Windows 串口，例如 ``\\.\COM7``；
* ``baudRate``：默认 9600；
* ``autoReconnect``：是否自动重连，默认 ``true``；
* ``reconnectIntervalMs``：重连间隔，默认 1000 ms；
* ``enableCsvSave``：是否保存 CSV，默认 ``false``；
* ``csvDirectory``：CSV 目录，默认 ``data\DXL360S``；
* ``saveIntervalMs``：CSV 保存间隔，默认 100 ms。

``AngleData`` 包含 ``x``、``y`` 和 ``time``，X/Y 角度单位为度。

3.7.2 角度数据获取与重置
-------------------------

.. code-block:: cpp

   InclinometerSDK::Inclinometer sensor;
   InclinometerSDK::InclinometerConfig config;
   config.port = "\\\\.\\COM9";
   config.baudRate = 9600;
   config.autoReconnect = true;

   if (sensor.start(config)) {
       float x = 0.0f;
       float y = 0.0f;
       sensor.getAngle(x, y);
       sensor.resetAngle();
       sensor.stop();
   }

公开方法：``start``、``stop``、``isRunning``、``getXAngle``、``getYAngle``、``getAngle`` 和 ``resetAngle``。类禁止拷贝，应用应确保停止后再销毁对象。

C ABI
~~~~~

.. code-block:: cpp

   void* Inclinometer_Create();
   void Inclinometer_Destroy(void* handle);
   int Inclinometer_Start(void* handle, const char* port,
                          int baudRate, int autoReconnect);
   void Inclinometer_Stop(void* handle);
   int Inclinometer_IsRunning(void* handle);
   float Inclinometer_GetXAngle(void* handle);
   float Inclinometer_GetYAngle(void* handle);
   void Inclinometer_GetAngle(void* handle, float* x, float* y);
   void Inclinometer_ResetAngle(void* handle);
   const char* Inclinometer_GetVersion();

3.7.3 C++ 调用例程（sensorsdk_demo.cpp）
------------------------------------------

.. code-block:: cpp

   InclinometerSDK::Inclinometer sensor;
   InclinometerSDK::InclinometerConfig config;
   config.port = "\\\\.\\COM9";
   config.baudRate = 9600;
   if (sensor.start(config)) {
       float x = 0.0f;
       float y = 0.0f;
       sensor.getAngle(x, y);
       sensor.stop();
   }

3.7.4 Python 调用例程（sensorsdk_demo.py）
--------------------------------------------

``scripts/SensorSDK/inclinometer.py`` 通过 ``ctypes.CDLL`` 加载 DLL，并提供 ``start``、``get_angle``、``reset_angle`` 和 ``close``。示例使用 ``\\.\COM9``，该串口号只应作为格式示例，现场必须替换为实际设备端口。

.. code-block:: python

   from inclinometer_sdk import InclinometerSDK

   sensor = InclinometerSDK(port="COM9", baud_rate=9600)
   if sensor.start():
       x, y = sensor.get_angle()
       print(f"倾角 X: {x:.2f}°, Y: {y:.2f}°")
       sensor.stop()
