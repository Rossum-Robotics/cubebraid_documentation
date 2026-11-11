5.3 C++ 构建与接口
==================

``RS080N_R2C_CPP_v1.0_complete7`` 是一个 C++17/CMake 工程，依赖随工程提供的 CubeBraid ``include``、``lib``、``bin``。它直接使用 ``RobotSDK.h``，两个示例均链接 ``RobotSDK`` 和 ``LoggerSDK``。

构建
----

在与所附 CubeBraid 库位数兼容的 Windows C++ 开发环境中，从 C++ 工程根目录执行：

.. code-block:: powershell

   cmake -S . -B build
   cmake --build build --config Release

CMake 要求 3.16 或更新版本。成功构建后会生成 ``r2c_four_step_motion_test`` 与 ``r2c_pose_move_test`` 两个程序，并将所附运行时 DLL 和 ``configs/robot_rs080n_real.yaml`` 复制到各程序所在目录。多配置生成器通常输出到 ``build/Release``。

适配层接口
----------

``RS080NAdapter`` 提供 ``connect()``、``disconnect()``、``getObservation()``、兼容接口 ``observation()``、``moveJoint()`` 和 ``movePose()``。``Observation`` 包含关节与 TCP 位姿；``MotionResult`` 包含 ``sent``、``reached`` 和 ``error_deg``。

* ``connect()`` 通过 CubeBraid RobotSDK 连接控制器，并等待有效的初始关节反馈。
* ``moveJoint()`` 检查六轴目标限位及相对当前反馈的最大步长；发送后按容差、连续反馈次数、稳定时间和超时判定 ``reached``。
* ``movePose()`` 发送 TCP 位姿后等待位置反馈稳定。该方法返回的 ``error_deg`` 字段表示 TCP 位置最大偏差，单位为毫米。
* ``moveJoint()`` 返回的 ``error_deg`` 为关节最大偏差，单位为度。
* ``CubeBraidDriver`` 的关节和位姿控制均使用 ``Fine`` 模式。

两个示例程序
------------

``r2c_four_step_motion_test.cpp`` 连接控制器并读取当前六轴角度，然后按 J1 至 J6 的顺序，对每个关节执行 +2° 和 -2°，共 12 个动作。每个动作等待到位反馈；发送失败或未到位时终止后续动作，最后断开连接。

``r2c_pose_move_test.cpp`` 连接控制器并读取当前 TCP 位姿，默认在 X、Y 方向各增加 10 毫米，输出当前位姿和目标位姿；预览模式不发送运动指令。执行模式发送位姿目标，并输出 ``sent``、``reached`` 和位置偏差。运行真实动作前须完成现场确认，具体要求见 :doc:`安全与故障排查 <Safety-and-Troubleshooting>`。
