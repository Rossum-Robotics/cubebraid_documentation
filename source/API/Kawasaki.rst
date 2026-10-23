3.4 机械臂运动学与轨迹规划模块（Kawasaki Kinematics SDK）
============================================================

头文件：``include/CubeBraidSDK/KawasakiSDK/kawasaki_kinematics_sdk.h``

命名空间：``KawasakiRS080N``

本模块针对川崎 RS080N，提供正运动学、逆运动学、轨迹插值中的奇异点检查与规避，以及齐次矩阵分解。

3.4.1 Kawasaki RS080N 机械臂 DH 参数与位姿变换
------------------------------------------------

.. code-block:: cpp

   KawasakiRS080N::KinematicsSolver solver;
   const std::vector<double> q_deg = {
       -144.0, -6.48, -96.01, -7.19, -87.0, 111.97
   };

   const Eigen::Matrix4d T06 = solver.forward_kinematics(q_deg);
   const auto solutions = solver.inverse_kinematics(T06);

主要方法：

* ``forward_kinematics(q_deg)``：输入 6 个关节角（度），返回 4×4 齐次变换矩阵；
* ``inverse_kinematics(T06)``：输入末端齐次矩阵，返回有效关节角解集（度）；
* ``check_and_bypass_singularity(start_pose, end_pose, steps, forward_motion)``：插值并检查奇异点，返回轨迹和 ``BypassPoint`` 列表；
* ``get_bypass_pose(bypass_points, index)``：读取指定避障点位姿；
* ``decompose_homogeneous_matrix(T)``：分解为 ZYZ 欧拉角（度）和平移向量（mm）。

``BypassPoint`` 包含插值步骤 ``step_index``、调整后的 ``pose``（``[x, y, z, z1, y, z2]``）和触发原因 ``reason``。

3.4.2 奇异点检测与安全避障规划
--------------------------------

.. list-table::
   :header-rows: 1
   :widths: 38 62

   * - 结构 / 方法
     - 功能说明
   * - ``BypassPoint``
     - 记录发生奇异点的插值步索引 ``step_index``、调整后的安全位姿 ``pose`` 及触发原因 ``reason``。
   * - ``check_and_bypass_singularity``
     - 在指定插值步数内检测起点到终点的轨迹，发现奇异点后自动重构安全插值轨迹。
   * - ``decompose_homogeneous_matrix``
     - 将齐次变换矩阵分解为平移向量（mm）和 ZYZ 欧拉角（deg）。

调用安全规避算法后，应用仍需检查返回轨迹、关节限位、工具姿态和碰撞区；算法结果不能替代机器人控制器的安全限制。

关节限位
~~~~~~~~

头文件当前使用的关节角限位（度）为：

``J1 [-150, 180]``、``J2 [-70, 140]``、``J3 [-155, 135]``、``J4 [-360, 360]``、``J5 [-145, 145]``、``J6 [-360, 360]``。

限位和奇异点处理属于运动规划的一部分。调用结果仍需结合机器人控制器的实际软限位、工具姿态、碰撞区和安全速度进行验证。

C ABI
~~~~~

.. code-block:: cpp

   void* create_kinematics_solver();
   void destroy_kinematics_solver(void* handle);
   void fk_calculator(void* handle, const double* q_deg,
                      double* out_T16);
   int ik_calculator(void* handle, const double* T16,
                     double* out_solutions);

``q_deg`` 是 6 个元素的角度数组，``out_T16`` 是平铺的 16 元素 4×4 矩阵。``ik_calculator`` 的输出缓冲区建议预分配为 ``double[8][6]``，返回有效解数量（0 到 8）。Python demo 使用 NumPy 数组分配这两个缓冲区。

3.4.3 C++ 调用例程（kawasaki_kinematics_sdk_demo.cpp）
--------------------------------------------------------

.. code-block:: cpp

   KawasakiRS080N::KinematicsSolver solver;
   const std::vector<double> q_deg = {
       -144.0, -6.48, -96.01, -7.19, -87.0, 111.97};
   const Eigen::Matrix4d T06 = solver.forward_kinematics(q_deg);
   const auto solutions = solver.inverse_kinematics(T06);
   std::cout << "有效逆运动学解: " << solutions.size() << std::endl;

3.4.4 Python 调用例程（kawasaki_kinematics_sdk_demo.py）
-----------------------------------------------------------

下例用于离线验证正、逆运动学；在向机器人控制器发送关节或位姿前，仍须完成关节限位、碰撞区和安全速度检查。

.. code-block:: python

   from kawasaki_kinematics import KinematicsSolver

   solver = KinematicsSolver()
   q_deg = [-144.0, -6.48, -96.01, -7.19, -87.0, 111.97]
   T06 = solver.forward_kinematics(q_deg)
   solutions = solver.inverse_kinematics(T06)
   print(f"逆运动学有效解数量: {len(solutions)}")
