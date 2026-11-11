5.1 概览与架构
===============

Python 插件通过 ``r2c_sdk.core.interfaces.IRobotHardwareAdapter`` 接入华为 R2C Python SDK；C++ 工程通过 CubeBraid RobotSDK 控制 RS080N。两套工程的调用关系如下。流程图可横向滚动，点击图像可查看完整尺寸。

Python：R2C 插件
----------------

``RS080N_R2C_Runtime_v1`` 提供 ``environment.yml``、``install.bat``、``check_environment.py`` 和 ``packages/r2c_sdk_python``；插件位于 ``plugin/RS080N_R2C_Plugin_v1``。插件的 ``pyproject.toml`` 注册 ``r2c_sdk.adapters`` 入口，``adapter/r2c_plugin.py`` 将 R2C 硬件适配接口委托给 ``RS080NAdapter``。选择 ``cubebraid`` 驱动时，后者再调用 ``vendor/CubeBraidSDK/robot_sdk.py`` 与相应运行时库。

.. container:: r2c-flow-scroll

   .. figure:: ../_static/r2c-python-flow.svg
      :alt: R2C Agent 经 RS080N-R2C 适配器、动作解析与状态校验、CubeBraidDriver 和 RobotSDK 下发指令到 RS080N；关节与位姿状态沿反向链路返回。MockDriver 在驱动层提供离线模拟分支。
      :width: 1460px

      Python 插件的指令下发、状态回传与离线模拟链路。

在图示的在线和离线模式中，``RS080NAdapter`` 根据 ``driver.mode`` 单选 ``CubeBraidDriver`` 或 ``MockDriver``。R2C 上层始终调用同一个适配器接口；驱动层由适配器分别处理真实控制和模拟动作。实线表示在线指令，虚线表示离线模拟，反向细线表示状态回传。在线反馈包含关节位置和 TCP 位姿，模拟反馈包含关节位置；当前适配器不提供力传感数据。

插件 ``examples`` 目录提供 ``r2c_n_step_motion_test.py``；``packages/r2c_sdk_python`` 存放华为 R2C Python SDK。

C++：独立适配实现
-----------------

``RS080N_R2C_CPP_v1.0_complete7`` 包含 ``include``、``src``、``configs``、``examples``、``vendor/CubeBraidSDK`` 和 ``CMakeLists.txt``。两个示例程序均链接 CubeBraid 的 ``RobotSDK`` 与 ``LoggerSDK``。

.. container:: r2c-flow-scroll

   .. figure:: ../_static/r2c-cpp-flow.svg
      :alt: C++ 应用经 RS080NAdapter、CubeBraidDriver 和 CubeBraid RobotSDK 向 RS080N 控制器下发关节与位姿指令；控制器反馈关节角度和 TCP 位姿，并沿反向链路返回应用。
      :width: 1260px

      C++ 适配工程的指令下发与状态回传链路。

``RobotConfig`` 为 ``RS080NAdapter`` 提供控制器连接和运动参数；``LoggerSDK`` 作为示例程序的日志依赖，不在运动控制数据链路中。

示例程序由 CMake 在目标 Windows 环境中构建。Python 和 C++ 工程分别读取各自的机器人 YAML 配置。

接口边界
--------

* Python R2C ``joint_states.position`` 和 ``joint_target`` 使用弧度；
  ``RS080NAdapter`` 与 CubeBraid 驱动之间的关节值使用度。
* C++ ``robot_sdk::Joint`` 的关节目标使用度；``robot_sdk::Pose`` 的位置使用毫米、姿态角使用度。
