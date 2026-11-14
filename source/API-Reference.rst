第三章：SDK 参考
================

本节按照公开头文件整理模块 API。函数签名、枚举值、结构体字段和单位来自 `CubeBraid SDK 仓库 <https://github.com/Rossum-Robotics/cubebraid_sdk>`__ 的 ``include/CubeBraidSDK``；SDK 发布版本发生变化时，请以随版本发布的头文件为最终依据。

本轮接口参数核对至提交 ``925af00e023aacab5a33c5eaf4bd731ad7192342``。各模块按“完整签名 → 参数表 → 返回值”说明公开接口；同名参数可共用说明，输入／输出方向按实际业务用途标记。

表中的默认值只指声明或默认构造函数明确给出的值。未注明单位、取值范围或失败行为的项目如实标明；C++ 默认实参不适用于对应 C ABI。结构体的默认初始值不等于经过业务校验的有效配置。

公共约定
--------

* ``bool`` 返回值通常表示请求是否成功，不等同于设备动作已经达到最终工位。
* 句柄型 C API 必须遵循“创建 → 使用 → 断开/停止 → 销毁”的生命周期。
* 任何 ``char*``、数组或输出结构体参数都需要调用方提供有效且足够大的内存。
* 运动和 PLC 输出接口应在独立的安全层中增加限位、超时、状态联锁和急停处理。

.. toctree::
   :maxdepth: 1

   API/AGV
   API/Camera
   API/DL
   API/Kawasaki
   API/Robot
   API/PLC
   API/Sensor
   API/Json
   API/Logger

头文件位置
----------

.. code-block:: text

   include/
   └── CubeBraidSDK/
       ├── AGV_SDK/AGV_SDK.h
       ├── CameraSDK/CameraSDK.h
       ├── DL_SDK/DlSegSdk.h
       ├── JsonSDK/JsonParameterSDK.h
       ├── KawasakiSDK/kawasaki_kinematics_sdk.h
       ├── LoggerSDK/LoggerSDK.h
       ├── PLC_SDK/PLC_SDK.h
       ├── RobotSDK/RobotSDK.h
       └── SensorSDK/InclinometerSDK.h
