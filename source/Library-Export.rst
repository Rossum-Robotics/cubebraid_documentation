1.3 C/C++ 动态导出库设计规范
=============================

为了保证系统在 Windows 与 Linux 环境下的跨平台兼容性，各 SDK 均采用条件编译的动态库导出/导入宏。常见宏包括 ``AGV_API``、``CAMERA3D_API``、``PLC_SDK_API`` 和 ``ROBOT_API``。

.. code-block:: cpp

   #ifdef _WIN32
   #  ifdef AGV_SDK_EXPORTS
   #    define AGV_API __declspec(dllexport)
   #  else
   #    define AGV_API __declspec(dllimport)
   #  endif
   #else
   #  define AGV_API __attribute__((visibility("default")))
   #endif

资源与二进制兼容性
------------------

内部关键资源管理遵循 RAII。复杂硬件操作类采用 PImpl（指向实现的指针）隐藏底层通讯细节和第三方库依赖，使公开头文件保持干净、轻量。

集成应用时仍必须匹配以下条件：

* C++14 标准、编译器 ABI、目标架构和 Debug/Release 配置；
* C ABI 的调用约定、结构体字段顺序和内存对齐；
* 与头文件同一版本的 ``.lib``、``.dll`` 或 ``.so``，以及配套第三方运行时依赖。

``PLCStatus`` 与 ``PickUpData`` 使用 ``#pragma pack(push, 1)``。Python ``ctypes`` 映射时也必须设置 ``_pack_ = 1``；更多跨语言约定见 :doc:`Python 对接规范 <Guides/Python-Integration>`。

.. _module-overview:

模块总览
--------

CubeBraid SDK 的公开模块按装卸柜机器人系统中的职责组织。应用可以按设备或算法能力选择相应的头文件和动态库。

下表列出 Windows DLL 名称；对应导入库位于 ``lib/win``，Linux 动态库位于 ``lib/linux``，命名为 ``lib<模块名>.so``。

.. list-table::
   :header-rows: 1
   :widths: 20 35 25 20

   * - 模块
     - 主要能力
     - 头文件
     - 二进制
   * - :doc:`AGV SDK <API/AGV>`
     - AGV 连接、登录、模式切换、位移和位姿。
     - ``AGV_SDK.h``
     - ``AGV_SDK.dll``
   * - :doc:`Camera SDK <API/Camera>`
     - 基准点、最后一面侧吸基准点和航向角算法。
     - ``CameraSDK.h``
     - ``CameraSDK.dll``
   * - :doc:`DlSeg SDK <API/DL>`
     - 箱体识别、实例分割、可视化图和全局掩膜。
     - ``DlSegSdk.h``
     - ``DlSegSDK.dll``
   * - :doc:`Kawasaki SDK <API/Kawasaki>`
     - RS080N 正逆运动学和奇异点规避。
     - ``kawasaki_kinematics_sdk.h``
     - ``KawasakiKinematicsSDK.dll``
   * - :doc:`Robot SDK <API/Robot>`
     - 机器人运动、状态和抓取位姿补偿。
     - ``RobotSDK.h``
     - ``RobotSDK.dll``
   * - :doc:`PLC SDK <API/PLC>`
     - DB 读写、离散信号和装柜状态。
     - ``PLC_SDK.h``
     - ``PLC_SDK.dll`` + ``snap7.dll``
   * - :doc:`Sensor SDK <API/Sensor>`
     - DXL360 串口倾角采集。
     - ``InclinometerSDK.h``
     - ``InclinometerSDK.dll``
   * - :doc:`Json SDK <API/Json>`
     - 参数、状态、垛型和续码文件。
     - ``JsonParameterSDK.h``
     - ``JsonParameterSDK.dll``
   * - :doc:`Logger SDK <API/Logger>`
     - 文件日志、格式化输出和急停日志。
     - ``LoggerSDK.h``
     - ``LoggerSDK.dll``

选择 C++ 还是 C ABI
~~~~~~~~~~~~~~~~~~~~

* C++ 接口包含更完整的对象模型、枚举、引用参数和 Eigen 类型，适合直接集成到 C++ 控制程序。
* C ABI 以句柄和基础类型为主，适合 Python ``ctypes``、C# 或其他 FFI；各模块的 C ABI 完整度不同。
* 使用动态库前，必须检查导出的符号是否与头文件和 Python 封装一致。发现声明不一致时，以实际发布版本的头文件和二进制为准。
