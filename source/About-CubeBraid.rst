1.2 CubeBraid SDK 简介
======================

.. _AboutCubeBraid:

CubeBraid SDK 是装卸柜机器人控制软件的基础组件集合。它不负责替代机器人控制器、PLC 程序或相机厂商 SDK，而是把装卸柜任务中常用的连接、数据、坐标和控制能力封装成可复用的 C++/C 接口。

系统组成
--------

一个典型的装卸柜系统由以下设备和软件层组成：

* **AGV**：负责机器人在集装箱外部或内部的导航位置，以及自动/手动移动。
* **3D 相机**：采集箱体或集装箱结构信息，计算基准点和航向角偏差。
* **六轴机器人**：执行取料、放料和姿态控制；RobotSDK 同时提供抓取目标补偿算法。
* **PLC 与执行机构**：管理吸盘、底托、摆台、液压杆和状态握手信号。
* **倾角仪**：采集 X/Y 方向倾角，为斜面补偿和异常判断提供输入。
* **参数文件**：保存手眼标定、SKU、机器人位姿、垛型和续码状态。

CubeBraid SDK 的模块关系可概括为：

``JsonSDK`` 读取配置，``CameraSDK`` 计算视觉基准点，``SensorSDK`` 提供倾角，``RobotSDK`` 生成机器人目标位姿，``PLC_SDK`` 负责控制信号与状态同步，``AGV_SDK`` 负责移动，``LoggerSDK`` 记录全过程。

适用任务
--------

SDK 当前头文件和 demo 覆盖以下任务：

* 集装箱内传统基准点计算；
* 最后一面侧吸基准点计算；
* 根据加强筋法向计算 AGV 航向角偏差；
* 顶吸、顶吸特殊码法和侧吸目标点补偿；
* 按面、层、箱数和垛型参数同步装柜进度；
* 机械臂笛卡尔位姿、关节角和 J4 角度查询；
* 川崎 RS080N 的正运动学、逆运动学和轨迹奇异点处理。

单位约定
--------

不同模块沿用其公开头文件中的单位，不能把所有坐标直接当成同一单位：

.. list-table::
   :header-rows: 1
   :widths: 25 25 50

   * - 数据
     - 默认单位
     - 说明
   * - RobotSDK ``Pose``
     - mm / deg
     - ``x/y/z`` 为毫米，``rx/ry/rz`` 为度。
   * - RobotSDK ``Joint``
     - deg
     - 六个关节角均为度。
   * - RobotSDK ``centroid``
     - m
     - 抓取补偿接口的基准点示例使用米；算法返回目标位置为 mm。
   * - ``BoxDimension`` / ``SkuData``
     - mm、kg
     - 箱体长宽高为毫米，重量为千克。
   * - CameraSDK ``CalibrationPose``
     - m + quaternion
     - 平移为米，姿态为 ``qw/qx/qy/qz``。
   * - AGV 手动速度
     - mm/s、0.001 rad/s
     - ``vx/vy`` 为线速度，``w`` 按头文件约定传递。
   * - 倾角仪
     - deg
     - X/Y 角度为度。

接口边界
--------

当前 SDK 提供 Windows ``bin`` 与 ``lib/win``，以及 Linux ``lib/linux`` 动态库。``lib/linux_arm`` 只包含部分模块。应用需匹配目标架构、编译器 ABI 和第三方运行时，具体准备步骤见 :doc:`安装与构建 <Get-Started/Installation>`。

.. _container-workflow:

典型装卸柜业务流程
--------------------

CubeBraid SDK 将参数、感知、位姿计算、设备控制和状态持久化组合为装卸柜任务。以下顺序描述软件协同关系；实际 PLC、机器人和安全回路的动作顺序仍必须以现场控制逻辑和安全评审为准。

任务数据准备
~~~~~~~~~~~~

任务开始时，使用 JsonSDK 读取：

* 手眼标定 ``CalibrationPose``；
* SKU 长、宽、高和重量 ``SkuData``；
* 机器人取料/放料位姿 ``RobotPose``；
* 当前机器人状态 ``RobotState``；
* 面数、层数、动作号和 AGV 模式 ``ContinuationConfig``；
* 当前垛型、抓取模式、吸取方式、集装箱尺寸和偏移量 ``PalletizingPatternData``。

如果任务从断点恢复，还应先读取并校验 JSON/TXT 中的面、层和动作状态，再决定是否继续动作。

感知、计算与设备协同
~~~~~~~~~~~~~~~~~~~~~~

#. 启动 Inclinometer，读取 X/Y 倾角并确认 ``isRunning()``。
#. 连接 Camera3D；根据项目模式选择主相机或上相机，调用 ``processTradition`` 计算集装箱内部或斜坡基准点。
#. 最后一面侧吸时调用 ``processLastSurface``；需要修正 AGV 航向时调用 ``processYaw``，并检查状态码和 yaw 输出。
#. 使用 RobotSDK 的 ``Top_suction_angle``、``Top_suction_special`` 或 ``Side_suction_angle``，将视觉基准点、SKU、垛型偏移和倾角转换为目标位姿。
#. 通过 PLC_SDK 同步取料参数、吸盘/底托信号、摆台角度和装柜进度；通过 AGV_SDK 完成定位移动与位姿查询。
#. 发送机器人运动指令前检查奇异点、限位和现场状态；每个动作完成后再更新面、层、动作和数量状态。

CameraSDK 的 ``CalibrationPose`` 与 ``Point3D`` 示例使用米，RobotSDK 目标 ``Pose`` 使用毫米；跨模块传递数据时必须显式完成单位换算。发生超时、状态不一致或倾角异常时，停止后续动作、记录上下文，并进入项目定义的安全恢复流程。

建议的状态机
~~~~~~~~~~~~

``准备参数`` → ``设备自检`` → ``AGV 定位`` → ``视觉定位`` → ``计算目标`` → ``PLC 握手`` → ``机器人取/放料`` → ``更新状态`` → ``下一箱/下一层``

每个状态转换都应由实际设备反馈确认，不能仅依据“指令发送成功”继续下一步。

.. seealso::

   :doc:`系统架构设计 <SDK-Architecture>`、:doc:`C/C++ 动态导出库设计规范 <Library-Export>` 和 :doc:`安装与构建 <Get-Started/Installation>`。
