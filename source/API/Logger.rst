3.9 日志记录与安全监控模块（Logger SDK）
==========================================

头文件：``include/CubeBraidSDK/LoggerSDK/LoggerSDK.h``

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

3.9.2 紧急停止与故障追溯
------------------------

``emergencyStop`` 用于记录带时间戳的高优先级故障原因。检测到硬件异常、碰撞风险或安全光幕触发时，应用应先按项目流程停止动作，再记录可追溯的上下文；日志接口本身不替代急停控制。

C ABI
~~~~~

.. code-block:: cpp

   void logger_init(const char* instance_name, const char* log_path);
   void logger_log(const char* instance_name, const char* msg);
   void logger_emergency_stop(const char* instance_name, const char* reason);

``instance_name`` 传入空字符串或 NULL 时，头文件说明使用默认名称 ``systemlogger``。调用方应在初始化前创建日志目录，并避免把密码、密码哈希和生产敏感数据写入日志。

3.9.3 C++ 调用例程（logger_demo.cpp）
--------------------------------------

.. code-block:: cpp

   auto& logger = logger_sdk::SystemLogger::instance();
   logger.init("log/logger_demo.log");
   logger.log("C++ SDK 初始化成功");
   logger.emergencyStop("检测到机械臂软限位");

3.9.4 Python 调用例程（logger_demo.py）
----------------------------------------

Python 策略层可以使用与 C++ 相同的日志等级和紧急停止语义。紧急停止日志用于记录原因，不应替代现场急停控制。

.. code-block:: python

   from logger_sdk import SystemLogger

   logger = SystemLogger.get_instance()
   logger.init("log/py_logger.log")
   logger.log("Python 策略脚本开始运行")
   logger.emergency_stop("检测到安全光幕触发")
