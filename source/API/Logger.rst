3.9 日志记录与安全监控模块（Logger SDK）
==========================================

头文件：``include/CubeBraidSDK/LoggerSDK/LoggerSDK.h``

参数依据：`官方头文件（固定版本 925af00） <https://github.com/Rossum-Robotics/cubebraid_sdk/blob/925af00e023aacab5a33c5eaf4bd731ad7192342/include/CubeBraidSDK/LoggerSDK/LoggerSDK.h>`__。

命名空间：``logger_sdk``

LoggerSDK 提供线程安全的文件日志和多个命名单例实例。``SystemLogger`` 的构造函数为 private，通过 ``instance(name)`` 获取实例。

3.9.1 单例日志系统设计
----------------------

.. code-block:: cpp

   auto& logger = logger_sdk::SystemLogger::instance();
   logger.init("log/system.log");
   logger.log("控制节点启动成功");
   logger.log("当前进度: % %", 1, 85.5);
   logger.emergencyStop("机械臂到达软限位");

``log`` 支持普通字符串和基于 ``%`` 的参数格式化；``%%`` 输出一个百分号。容器类型会按 ``[a, b, c]`` 形式展开。可以用不同名称获取独立日志实例，例如 ``instance("netlogger")``。

instance：获取命名实例
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   static SystemLogger& instance(const std::string& name = "systemlogger");

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``name``
     - ``const std::string&``
     - 输入
     - 日志实例名称，默认 ``systemlogger``；不同名称对应不同实例。

返回值：``SystemLogger&``，命名日志实例的引用。

init：日志文件
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   void init(const std::string& logPath);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``logPath``
     - ``const std::string&``
     - 输入
     - 日志输出文件路径；由调用方准备父目录。

返回值：``void``。

log：消息与格式化参数
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   void log(const std::string& msg);
   template<typename... Args>
   void log(const char* format, Args&&... args);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``msg``
     - ``const std::string&``
     - 输入
     - 不带格式化参数的普通日志消息。
   * - ``format``
     - ``const char*``
     - 输入
     - 格式字符串，每个单独的 ``%`` 依次替换一个值，``%%`` 输出百分号；不是 printf 的类型说明格式。
   * - ``args``
     - ``Args&&...``
     - 输入
     - 与占位符依次对应的值；按流输出，容器按 ``[a, b, c]`` 展开。

返回值：``void``。

emergencyStop：故障原因
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   template<typename... Args>
   void emergencyStop(const char* reasonFormat, Args&&... args);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``reasonFormat``
     - ``const char*``
     - 输入
     - 故障原因格式串，沿用 ``%`` 和 ``%%`` 规则。
   * - ``args``
     - ``Args&&...``
     - 输入
     - 故障原因中的格式化值；不需要占位符时可不传。

返回值：``void``；写入带“紧急停止！原因：”前缀的日志。

3.9.2 紧急停止与故障追溯
------------------------

``emergencyStop`` 用于记录带紧急停止标识的故障原因。检测到硬件异常、碰撞风险或安全光幕触发时，应用应先按项目流程停止动作，再记录可追溯的上下文；日志接口本身不替代急停控制。

C ABI
~~~~~

.. code-block:: cpp

   void logger_init(const char* instance_name, const char* log_path);
   void logger_log(const char* instance_name, const char* msg);
   void logger_emergency_stop(const char* instance_name, const char* reason);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``instance_name``
     - ``const char*``
     - 输入
     - 命名实例；``logger_init`` 注释明确 NULL 或空串使用默认名 ``systemlogger``。
   * - ``log_path``
     - ``const char*``
     - 输入
     - ``logger_init`` 使用的日志文件路径。
   * - ``msg``
     - ``const char*``
     - 输入
     - ``logger_log`` 写入的完整消息。
   * - ``reason``
     - ``const char*``
     - 输入
     - ``logger_emergency_stop`` 写入的完整故障原因。

三个 C 接口均返回 ``void``。传入文本按调用方与 SDK 的编码约定准备；C ABI 不接收 C++ 可变模板参数，格式化内容应先在调用语言中生成。

``logger_init`` 的 ``instance_name`` 传入空字符串或 NULL 时，头文件说明使用默认名称 ``systemlogger``。调用方应在初始化前创建日志目录，并避免把密码、密码哈希和生产敏感数据写入日志。

3.9.3 C++ 调用例程（logger_demo.cpp）
--------------------------------------

.. code-block:: cpp

   auto& logger = logger_sdk::SystemLogger::instance();
   logger.init("log/logger_demo.log");
   logger.log("C++ SDK 初始化成功");
   logger.emergencyStop("检测到机械臂软限位");

3.9.4 Python 调用例程（logger_demo.py）
----------------------------------------

Python 策略层通过 C ABI 写入消息和紧急停止原因，接口没有日志等级参数。紧急停止日志用于记录原因，不应替代现场急停控制。

.. code-block:: python

   import ctypes as ct

   def write_sdk_log(library_path, log_path, message, reason):
       sdk = ct.CDLL(library_path)
       for name in ("logger_init", "logger_log", "logger_emergency_stop"):
           function = getattr(sdk, name)
           function.argtypes = [ct.c_char_p, ct.c_char_p]
           function.restype = None
       instance = b"systemlogger"
       sdk.logger_init(instance, log_path.encode("utf-8"))
       sdk.logger_log(instance, message.encode("utf-8"))
       sdk.logger_emergency_stop(instance, reason.encode("utf-8"))

该函数接收动态库完整路径、日志路径、消息和故障原因，不依赖额外的 Python 日志包装类。调用前准备日志目录及动态库搜索路径。
