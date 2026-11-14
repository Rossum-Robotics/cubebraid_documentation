3.5 机器人抓取控制与位姿补偿模块（Robot SDK）
================================================

头文件：``include/CubeBraidSDK/RobotSDK/RobotSDK.h``

参数依据：`官方头文件（固定版本 925af00） <https://github.com/Rossum-Robotics/cubebraid_sdk/blob/925af00e023aacab5a33c5eaf4bd731ad7192342/include/CubeBraidSDK/RobotSDK/RobotSDK.h>`__。

命名空间：``robot_sdk``

RobotSDK 负责机器人控制器连接、状态读取、笛卡尔/关节运动和装卸柜抓取目标位姿计算。它使用 Eigen 进行姿态和运动学相关计算。

3.5.1 机械臂通讯与精度模式
--------------------------

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``Pose.x/y/z``
     - ``double``
     - 输入／输出
     - 运动目标和状态位置为 mm，默认均为 ``0.0``；作为抓取算法 ``centroid`` 时位置改用 m。
   * - ``Pose.rx/ry/rz``
     - ``double``
     - 输入／输出
     - 姿态分量为度，默认均为 ``0.0``。
   * - ``Joint.j1～j6``
     - ``double``
     - 输入／输出
     - 六个关节角，单位为度，默认均为 ``0.0``。
   * - ``BoxDimension.length/width/height``
     - ``float``
     - 输入
     - SKU 长／宽／高，单位 mm，默认均为 ``0.0f``。

``ControlMode``：

.. list-table::
   :header-rows: 1
   :widths: 32 16 52

   * - 模式
     - 值
     - 适用场景
   * - ``Coarse``
     - 1
     - 粗略到位/过渡点，头文件注释精度为 50 mm。
   * - ``Fine``
     - 2
     - 精准目标点，头文件注释精度为 1 mm。
   * - ``Transition``
     - 3
     - 远距离过渡点，头文件注释精度为 200 mm；关节控制接口的注释主要列出 Coarse/Fine。

连接与状态
~~~~~~~~~~

.. code-block:: cpp

   #include "CubeBraidSDK/RobotSDK/RobotSDK.h"

   robot_sdk::RobotController robot;
   if (robot.connectRobot("192.168.0.2", 31400, 31401)) {
       const robot_sdk::Pose pose = robot.GetCurrentPose();
       const robot_sdk::Joint joint = robot.GetCurrentJoint();
       const double j4 = robot.GetJoint4Angle();
       robot.disconnectRobot();
   }

默认运动端口为 ``31400``，状态端口为 ``31401``。连接成功只表示通信连接建立，运动前仍需确认机器人状态、模式、工具、限位和安全回路。

connectRobot：建立连接
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   bool connectRobot(const std::string& ip,
                     int motionPort = 31400, int statusPort = 31401);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``ip``
     - ``const std::string&``
     - 输入
     - 机器人控制器 IP 地址。
   * - ``motionPort``
     - ``int``
     - 输入
     - 运动控制端口，默认 ``31400``。
   * - ``statusPort``
     - ``int``
     - 输入
     - 状态监听端口，默认 ``31401``。

返回值：``bool``，表示连接是否成功。

controlPosture / controlJoint：运动目标
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   bool controlPosture(ControlMode mode, const Pose& pose);
   bool controlJoint(ControlMode mode, const Joint& joint);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``mode``
     - ``ControlMode``
     - 输入
     - 笛卡尔运动支持 ``Coarse/Fine/Transition``；关节运动注释列出 ``Coarse/Fine``，枚举值见上表。
   * - ``pose``
     - ``const Pose&``
     - 输入
     - 笛卡尔工具端目标；位置 ``x/y/z`` 为 mm，姿态 ``rx/ry/rz`` 为度。
   * - ``joint``
     - ``const Joint&``
     - 输入
     - J1～J6 目标角，单位为度。

返回值：``bool``，表示控制请求是否执行成功。

无参数状态接口
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   void disconnectRobot();
   bool isConnected() const;
   Pose GetCurrentPose();
   Joint GetCurrentJoint();
   double GetJoint4Angle();

``disconnectRobot`` 断开连接，无返回值；``isConnected`` 返回连接状态。``GetCurrentPose`` 返回当前位姿，位置为 mm、姿态为度；``GetCurrentJoint`` 返回六轴角度，``GetJoint4Angle`` 返回 J4 角度，单位均为度。

3.5.2 斜面补偿与装载点位姿计算
--------------------------------

Top_suction_angle / Top_suction_special：顶吸目标
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   static Pose Top_suction_angle(
       const Pose& centroid, const BoxDimension& box, int fetchMode,
       int sku_num, float dis_y, const Pose& poseOffset, bool ROffset,
       int model_mod, double inclx_angle = 0.0);

   static Pose Top_suction_special(
       const Pose& centroid, const BoxDimension& box, int fetchMode,
       int sku_num, float dis_y, const Pose& poseOffset, bool ROffset,
       int model_mod, double inclx_angle = 0.0);

前者用于普通码法，后者用于特殊码法。两者共用以下九项参数；侧吸接口中的同名参数含义也见此表。

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``centroid``
     - ``const Pose&``
     - 输入
     - 基准点位置，``x/y/z`` 单位为米；此参数的单位与运动目标 ``Pose`` 不同。
   * - ``box``
     - ``const BoxDimension&``
     - 输入
     - SKU 尺寸；``length/width/height`` 为 mm，默认构造值均为 ``0.0f``。
   * - ``fetchMode``
     - ``int``
     - 输入
     - 抓取模式：``1/2`` 沿长边，``3/4`` 沿短边。
   * - ``sku_num``
     - ``int``
     - 输入
     - 单次并排抓取的 SKU 数量。
   * - ``dis_y``
     - ``float``
     - 输入
     - 每层剩余缝隙；头文件未明确单位。
   * - ``poseOffset``
     - ``const Pose&``
     - 输入
     - JSON 垛型的 ``x/y/z`` 偏移，单位为 mm。
   * - ``ROffset``
     - ``bool``
     - 输入
     - 是否为每层最左侧垛型：``true`` 最左侧，``false`` 右侧。
   * - ``model_mod``
     - ``int``
     - 输入
     - 面模式：``0`` 第一面，``1`` 其他面。
   * - ``inclx_angle``
     - ``double``
     - 输入
     - 倾角仪角度；两个顶吸接口默认 ``0.0``，侧吸接口需显式传入。此处头文件未标注角度单位。

返回值：``Pose``，最终机器人工具端目标位姿；位置为 mm。``Pose`` 的姿态字段 ``rx/ry/rz`` 采用度，所有字段默认构造值为 ``0.0``。

Side_suction_angle：侧吸目标
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   static Pose Side_suction_angle(
       const Pose& centroid, const BoxDimension& box,
       int fetchMode, int fetchMode_side, int sku_num, float dis_y,
       const Pose& poseOffset, bool ROffset, int model_mod,
       double inclx_angle, float container_h,
       bool switch_top_bottom_suction = false);

共用参数见上表，其中 ``inclx_angle`` 在本接口中没有默认值。以下为侧吸特有参数：

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``fetchMode_side``
     - ``int``
     - 输入
     - 每面垛型左下第一个纸箱的抓取模式；``1/2`` 沿长边，``3/4`` 沿短边。
   * - ``container_h``
     - ``float``
     - 输入
     - 集装箱高度，单位为 mm。
   * - ``switch_top_bottom_suction``
     - ``bool``
     - 输入
     - ``true`` 为下层侧吸（酒类），``false`` 为上层侧吸；默认 ``false``。

返回值：``Pose``，工具端目标位姿，位置为 mm。

top_x_value / top_z_value / side_x_value / side_z_value：斜面补偿
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   static float top_x_value(float benchmark_x, float angleDeg, float h, float x0);
   static float top_z_value(float angleDeg, float h, float x0);
   static float side_x_value(float benchmark_x, float angleDeg, float h, float x0);
   static float side_z_value(float angleDeg, float h, float x0);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``benchmark_x``
     - ``float``
     - 输入
     - 两个 X 方向补偿接口使用的基准 X 值。
   * - ``angleDeg``
     - ``float``
     - 输入
     - 补偿角参数；头文件未逐参数解释。
   * - ``h``
     - ``float``
     - 输入
     - 补偿计算参数 ``h``；头文件未明确其业务定义和单位。
   * - ``x0``
     - ``float``
     - 输入
     - 补偿计算参数 ``x0``；头文件未明确其业务定义和单位。

返回值：``float``；分别为顶吸／侧吸的 X 或 Z 方向补偿计算结果，头文件未给出各标量的完整单位约定。

computeDeltaEulerZYZ_deg：相对旋转
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   static Eigen::Vector3d computeDeltaEulerZYZ_deg(
       const Eigen::Vector3d& euler_before_deg,
       const Eigen::Vector3d& euler_temp_deg);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``euler_before_deg``
     - ``const Eigen::Vector3d&``
     - 输入
     - 变化前的 ZYZ 顺序欧拉角，三个角均为度。
   * - ``euler_temp_deg``
     - ``const Eigen::Vector3d&``
     - 输入
     - 用于比较的 ZYZ 顺序欧拉角，三个角均为度。

返回值：``Eigen::Vector3d``，相对旋转的 ZYZ 欧拉角，单位为度。

C ABI
~~~~~

头文件导出 ``Robot_Create``、``Robot_Destroy``、``Robot_Connect``、``Robot_Disconnect``、``Robot_ControlPosture``、``Robot_ControlJoint``、``Robot_GetCurrentPose``、``Robot_GetCurrentJoint`` 和 ``Robot_GetJoint4Angle``，另外还导出目标位姿补偿和 ZYZ 计算函数。

.. warning::

   虽然这些函数位于 ``extern "C"`` 区域，补偿函数的参数仍包含 ``robot_sdk::Pose`` 和 ``robot_sdk::BoxDimension`` 等 C++ 类型。使用 Python ``ctypes`` 或其他 FFI 前，必须以实际导出 ABI 验证结构体布局；不能仅凭函数名判断它是纯 C 兼容接口。

C ABI 参数与输出映射
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   RobotHandle Robot_Create();
   void Robot_Destroy(RobotHandle handle);
   int Robot_Connect(RobotHandle handle, const char* ip, int motionPort, int statusPort);
   void Robot_Disconnect(RobotHandle handle);
   int Robot_ControlPosture(RobotHandle handle, int mode,
                            double x, double y, double z,
                            double rx, double ry, double rz);
   int Robot_ControlJoint(RobotHandle handle, int mode,
                          double j1, double j2, double j3,
                          double j4, double j5, double j6);
   int Robot_GetCurrentPose(RobotHandle handle, double* x, double* y, double* z,
                            double* rx, double* ry, double* rz);
   int Robot_GetCurrentJoint(RobotHandle handle, double* j1, double* j2, double* j3,
                             double* j4, double* j5, double* j6);
   int Robot_GetJoint4Angle(RobotHandle handle, double* j4);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``handle``
     - ``RobotHandle``
     - 输入
     - ``Robot_Create`` 返回的实例句柄；用 ``Robot_Destroy`` 释放。
   * - ``ip / motionPort / statusPort``
     - ``const char* / int / int``
     - 输入
     - 与 ``connectRobot`` 对应；C ABI 三个参数均需显式传入。
   * - ``mode``
     - ``int``
     - 输入
     - ``ControlMode`` 的整数枚举值。
   * - ``x/y/z / rx/ry/rz``
     - ``double 或 double*``
     - 输入／输出
     - 控制接口接收目标值；读取接口通过指针输出当前值。位置为 mm，姿态为度。
   * - ``j1～j6 / j4``
     - ``double 或 double*``
     - 输入／输出
     - 控制接口接收关节目标；读取接口输出角度，单位为度。

``Robot_Create`` 无参数，返回句柄；销毁和断开接口返回 ``void``。其余上述接口返回 ``int``，官方 Python 封装以 ``1`` 判断成功；头文件未逐一定义其他返回值。

.. code-block:: cpp

   int Robot_TopSuctionAngle(
       RobotHandle handle, robot_sdk::Pose centroid, robot_sdk::BoxDimension box,
       int fetchMode, int sku_num, float dis_y, robot_sdk::Pose poseOffset,
       bool ROffset, int model_mod, double inclx_angle,
       double* x, double* y, double* z);
   int Robot_TopSuctionSpecial(
       RobotHandle handle, robot_sdk::Pose centroid, robot_sdk::BoxDimension box,
       int fetchMode, int sku_num, float dis_y, robot_sdk::Pose poseOffset,
       bool ROffset, int model_mod, double inclx_angle,
       double* x, double* y, double* z);
   int Robot_SideSuctionAngle(
       RobotHandle handle, robot_sdk::Pose centroid, robot_sdk::BoxDimension box,
       int fetchMode, int fetchMode_side, int sku_num, float dis_y,
       robot_sdk::Pose poseOffset, bool ROffset, int model_mod,
       double inclx_angle, float container_h, bool switch_top_bottom_suction,
       double* x, double* y, double* z);

三个抓取 C 接口按值接收 ``Pose`` 和 ``BoxDimension``，业务参数与对应 C++ 算法相同，所有实参均需显式提供。``handle`` 为机器人实例句柄；``x/y/z`` 为调用方提供的三个 ``double*`` 输出，接收目标位置（mm），不通过该接口返回姿态角。返回类型为 ``int``，官方 Python 封装以 ``1`` 判断成功。

Robot_ComputeDeltaEulerZYZ：C ABI 相对旋转
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   int Robot_ComputeDeltaEulerZYZ(
       RobotHandle handle, const double euler_before[3],
       const double euler_temp[3], double delta_out[3]);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``handle``
     - ``RobotHandle``
     - 输入
     - 机器人实例句柄。
   * - ``euler_before``
     - ``const double[3]``
     - 输入
     - 变化前欧拉角 ``[z1, y, z2]``，单位为度。
   * - ``euler_temp``
     - ``const double[3]``
     - 输入
     - 变化后欧拉角 ``[z1, y, z2]``，单位为度。
   * - ``delta_out``
     - ``double[3]``
     - 输出
     - 调用方提供的三个元素输出数组，接收相对欧拉角，单位为度。

返回值：``int``，``1`` 成功，``0`` 失败。

3.5.3 C++ 调用例程（RobotSDK_demo.cpp）
-----------------------------------------

.. code-block:: cpp

   robot_sdk::RobotController robot;
   if (robot.connectRobot("192.168.0.2", 31400, 31401)) {
       robot_sdk::Joint joint{-90.0, -13.73, -96.28,
                              20.0, -97.45, 0.0};
       robot.controlJoint(robot_sdk::ControlMode::Coarse, joint);
       robot.disconnectRobot();
   }

   const robot_sdk::Pose centroid{1.463, 1.524, -0.611};
   const robot_sdk::BoxDimension box{570.0f, 453.0f, 330.0f};
   const robot_sdk::Pose offset{-570.0, -453.0, 330.0, 0.0, 0.0, 0.0};
   const auto target = robot_sdk::RobotController::Top_suction_angle(
       centroid, box, 3, 1, 75.0f, offset, true, 0, 0.0);

3.5.4 Python 调用例程（robot_sdk_demo.py）
-------------------------------------------

以下示例只计算目标位姿，不连接机器人，可用于先核对基准点、SKU 尺寸、抓取模式和单位：

.. code-block:: python

   from robot_sdk import RobotController, Pose, BoxDimension

   robot = RobotController()
   target = robot.top_suction_angle(
       centroid=Pose(1.463, 1.524, -0.611),
       box=BoxDimension(570.0, 453.0, 330.0),
       fetch_mode=3, sku_num=1, dis_y=75.0,
       pose_offset=Pose(-570.0, -453.0, 330.0),
       r_offset=True, model_mod=0, inclx_angle=0.0)
   print(f"目标位姿: {target}")

Python 包装类的 ``inclx_angle`` 是必填参数，不会自动继承 C++ 顶吸接口的默认值。
