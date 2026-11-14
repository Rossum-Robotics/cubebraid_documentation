3.4 机械臂运动学与轨迹规划模块（Kawasaki Kinematics SDK）
============================================================

头文件：``include/CubeBraidSDK/KawasakiSDK/kawasaki_kinematics_sdk.h``

参数依据：`官方头文件（固定版本 925af00） <https://github.com/Rossum-Robotics/cubebraid_sdk/blob/925af00e023aacab5a33c5eaf4bd731ad7192342/include/CubeBraidSDK/KawasakiSDK/kawasaki_kinematics_sdk.h>`__。

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

forward_kinematics：正运动学
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   Eigen::Matrix4d forward_kinematics(const std::vector<double>& q_deg) const;

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``q_deg``
     - ``const std::vector<double>&``
     - 输入
     - J1～J6 六个关节角，单位为度。

返回值：``Eigen::Matrix4d``，末端 4×4 齐次变换矩阵。

inverse_kinematics：逆运动学
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   std::vector<std::vector<double>> inverse_kinematics(
       const Eigen::Matrix4d& T06) const;

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``T06``
     - ``const Eigen::Matrix4d&``
     - 输入
     - 末端目标齐次变换矩阵。矩阵分解接口以 mm 表示平移，姿态由旋转矩阵表示。

返回值：有效关节角解列表，每组解包含六轴角度，单位为度。

decompose_homogeneous_matrix：矩阵分解
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   static std::tuple<Eigen::Vector3d, Eigen::Vector3d>
   decompose_homogeneous_matrix(const Eigen::Matrix4d& T);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``T``
     - ``const Eigen::Matrix4d&``
     - 输入
     - 待分解的 4×4 齐次变换矩阵。

返回值：按顺序返回 ``(ZYZ 欧拉角, 平移向量)``；角度为度，平移为 mm。

BypassPoint：避障结果字段
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``step_index``
     - ``int``
     - 输出字段
     - 发生奇异点的插值步骤索引，头文件未设置初始值。
   * - ``pose``
     - ``Eigen::VectorXd``
     - 输出字段
     - 调整后的安全位姿，头文件排列为 ``[x, y, z, z1, y, z2]``，后三项为 ZYZ 表示。
   * - ``reason``
     - ``std::string``
     - 输出字段
     - 触发避障的原因说明。

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

check_and_bypass_singularity：轨迹检查
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   std::pair<std::vector<Eigen::VectorXd>, std::vector<BypassPoint>>
   check_and_bypass_singularity(const Eigen::VectorXd& start_pose,
                               const Eigen::VectorXd& end_pose,
                               int steps, bool forward_motion = true) const;

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``start_pose``
     - ``const Eigen::VectorXd&``
     - 输入
     - 起点位姿向量；与终点使用相同的坐标系和位姿表示。
   * - ``end_pose``
     - ``const Eigen::VectorXd&``
     - 输入
     - 终点位姿向量，头文件未对这两个形参逐分量注明单位。
   * - ``steps``
     - ``int``
     - 输入
     - 轨迹插值步骤数；头文件未声明默认值或允许范围。
   * - ``forward_motion``
     - ``bool``
     - 输入
     - 运动方向标志，默认 ``true``；头文件未单独定义两个布尔值的方向含义。

返回值：``std::pair``，第一项为位姿轨迹列表，第二项为 ``BypassPoint`` 避障点列表。

get_bypass_pose：选择避障点
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   static Eigen::VectorXd get_bypass_pose(
       const std::vector<BypassPoint>& bypass_points, size_t index);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``bypass_points``
     - ``const std::vector<BypassPoint>&``
     - 输入
     - 轨迹检查得到的避障点列表。
   * - ``index``
     - ``size_t``
     - 输入
     - 待提取元素的索引，应在列表有效范围内。

返回值：所选避障点的位姿向量；越界时的具体行为未在头文件中约定。

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

C ABI 参数表
~~~~~~~~~~~~~~~~~~~~

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
     - ``create_kinematics_solver`` 返回的求解器句柄，最后由 ``destroy_kinematics_solver`` 释放。
   * - ``q_deg``
     - ``const double*``
     - 输入
     - 指向六个关节角，顺序为 J1～J6，单位为度。
   * - ``out_T16``
     - ``double*``
     - 输出
     - 调用方分配的 16 个 ``double``，接收平铺 4×4 矩阵。
   * - ``T16``
     - ``const double*``
     - 输入
     - 指向目标 4×4 矩阵的 16 个平铺元素；头文件未约定平铺顺序，需按配套示例组织。
   * - ``out_solutions``
     - ``double*``
     - 输出
     - 解集缓冲区，头文件建议预分配 ``double[8][6]``，即 48 个 ``double``；各关节结果为度。

创建函数无参数，返回求解器句柄。销毁和 ``fk_calculator`` 返回 ``void``；``ik_calculator`` 返回有效解数量 ``0～8``，不是通用状态码。

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

   import ctypes as ct
   import numpy as np

   def solve_kinematics(library_path, q_deg):
       sdk = ct.CDLL(library_path)
       pointer = ct.POINTER(ct.c_double)
       sdk.create_kinematics_solver.argtypes = []
       sdk.create_kinematics_solver.restype = ct.c_void_p
       sdk.destroy_kinematics_solver.argtypes = [ct.c_void_p]
       sdk.destroy_kinematics_solver.restype = None
       sdk.fk_calculator.argtypes = [ct.c_void_p, pointer, pointer]
       sdk.fk_calculator.restype = None
       sdk.ik_calculator.argtypes = [ct.c_void_p, pointer, pointer]
       sdk.ik_calculator.restype = ct.c_int

       q = np.ascontiguousarray(q_deg, dtype=np.float64)
       if q.shape != (6,):
           raise ValueError("必须提供 J1～J6 六个关节角")
       matrix = np.zeros(16, dtype=np.float64)
       solutions = np.zeros((8, 6), dtype=np.float64)
       handle = sdk.create_kinematics_solver()
       if not handle:
           raise RuntimeError("求解器创建失败")
       try:
           sdk.fk_calculator(
               handle, q.ctypes.data_as(pointer),
               matrix.ctypes.data_as(pointer))
           count = sdk.ik_calculator(
               handle, matrix.ctypes.data_as(pointer),
               solutions.ctypes.data_as(pointer))
           if not 0 <= count <= 8:
               raise RuntimeError("逆运动学返回数量超出头文件约定")
           return matrix.reshape((4, 4)), solutions[:count].copy()
       finally:
           sdk.destroy_kinematics_solver(handle)

该函数沿用官方示例的矩阵平铺和数组组织方式，显式分配 16 元素矩阵及 8×6 解集缓冲区。调用方传入动态库完整路径和六个以度为单位的关节角，函数返回变换矩阵与有效解列表，并在结束时销毁求解器句柄。
