3.7 车体姿态感知模块（Inclinometer SDK）
==========================================

头文件：``include/CubeBraidSDK/SensorSDK/InclinometerSDK.h``

参数依据：`官方头文件（固定版本 925af00） <https://github.com/Rossum-Robotics/cubebraid_sdk/blob/925af00e023aacab5a33c5eaf4bd731ad7192342/include/CubeBraidSDK/SensorSDK/InclinometerSDK.h>`__。

命名空间：``InclinometerSDK``

SensorSDK 通过串口采集 DXL360 倾角仪的 X/Y 角度，支持自动重连、运行状态查询和角度归零。

3.7.1 倾角仪配置与通信
-----------------------

``InclinometerConfig`` 字段及默认构造值：

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``port``
     - ``std::string``
     - 配置
     - 串口；Windows 默认 ``\\.\COM7``，Linux 默认 ``/dev/ttyUSB0``。
   * - ``baudRate``
     - ``unsigned long``
     - 配置
     - 波特率，默认 ``9600``。
   * - ``autoReconnect``
     - ``bool``
     - 配置
     - 是否自动重连，默认 ``true``。
   * - ``reconnectIntervalMs``
     - ``int``
     - 配置
     - 自动重连间隔，单位 ms，默认 ``1000``。
   * - ``enableCsvSave``
     - ``bool``
     - 配置
     - 是否保存 CSV，默认 ``false``。
   * - ``csvDirectory``
     - ``std::string``
     - 配置
     - CSV 保存目录；Windows 默认 ``data\DXL360S``，Linux 默认 ``data/DXL360S``。
   * - ``saveIntervalMs``
     - ``int``
     - 配置
     - CSV 保存间隔，单位 ms，默认 ``100``。

AngleData：角度记录
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   AngleData();
   AngleData(float xAngle, float yAngle, float timestamp);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``x / xAngle``
     - ``float``
     - 字段／输入
     - X 方向角度；无参数构造时 ``x=0.0f``。
   * - ``y / yAngle``
     - ``float``
     - 字段／输入
     - Y 方向角度；无参数构造时 ``y=0.0f``。
   * - ``time / timestamp``
     - ``float``
     - 字段／输入
     - 时间记录；无参数构造时 ``time=0.0f``，头文件未注明时间单位或时间起点。

读取 X/Y 角度的公开方法以度为单位；``AngleData`` 带参数构造函数按顺序将三个实参写入上述字段。

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

start：启动采集
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   bool start(const InclinometerConfig& config);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``config``
     - ``const InclinometerConfig&``
     - 输入
     - 串口、自动重连和 CSV 配置；默认值见 3.7.1。

返回值：``true`` 启动成功，``false`` 启动失败。

getAngle：同时读取 X/Y
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   void getAngle(float& x, float& y) const;

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``x``
     - ``float&``
     - 输出
     - 调用方提供的 X 角度存储，单位为度。
   * - ``y``
     - ``float&``
     - 输出
     - 调用方提供的 Y 角度存储，单位为度。

返回值：``void``，通过两个引用参数输出角度。

无参数接口
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   void stop();
   bool isRunning() const;
   float getXAngle() const;
   float getYAngle() const;
   void resetAngle();

``stop`` 停止采集，``resetAngle`` 重置当前角度，两者无返回值；``isRunning`` 返回运行状态。``getXAngle``、``getYAngle`` 返回最新 X／Y 角度，单位为度。

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

C ABI 参数与返回值
~~~~~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``handle``
     - ``void*``
     - 输入
     - ``Inclinometer_Create`` 返回的对象句柄，最终由 ``Inclinometer_Destroy`` 释放。
   * - ``port``
     - ``const char*``
     - 输入
     - 串口名称，例如 Windows 的 ``\\.\COM7`` 或 Linux 的 ``/dev/ttyUSB0``。
   * - ``baudRate``
     - ``int``
     - 输入
     - 波特率，例如 ``9600``；C ABI 为 ``int``，与 C++ 配置的 ``unsigned long`` 类型不同。
   * - ``autoReconnect``
     - ``int``
     - 输入
     - 是否自动重连的整型标志，C ABI 需显式传入。
   * - ``x / y``
     - ``float*``
     - 输出
     - ``Inclinometer_GetAngle`` 的两个输出地址，分别接收 X／Y 角度，单位为度。

``Inclinometer_Create`` 无参数并返回句柄；``Inclinometer_Start`` 返回 ``1`` 成功、``0`` 失败。``Inclinometer_IsRunning`` 返回 ``1`` 正在运行、``0`` 未运行；两个单轴读取接口返回 ``float`` 角度。销毁、停止、双轴读取和重置接口返回 ``void``。``Inclinometer_GetVersion`` 无参数，返回 ``const char*`` 版本字符串，头文件未声明需由调用方释放。

``Inclinometer_Start`` 没有 C++ 默认实参，且只暴露串口、波特率和自动重连三项配置；C++ 配置中的 CSV 与间隔选项未作为该 C 接口的形参公开。

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

   from inclinometer import Inclinometer

   with Inclinometer() as sensor:
       if sensor.start(port="COM9", baudrate=9600, auto_reconnect=True):
           x, y = sensor.get_angle()
           print(f"倾角 X: {x:.2f}°, Y: {y:.2f}°")

``start`` 显式接收串口，Python 参数名为 ``baudrate`` 和 ``auto_reconnect``；上下文退出时停止采集并释放句柄。封装将自动重连的布尔值转换成 C ABI 的 ``1/0``。
