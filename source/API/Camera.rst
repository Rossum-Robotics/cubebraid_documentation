3.2 3D视觉与基准点感知模块（Camera3D SDK）
=============================================

头文件：``include/CubeBraidSDK/CameraSDK/CameraSDK.h``

参数依据：`官方头文件（固定版本 925af00） <https://github.com/Rossum-Robotics/cubebraid_sdk/blob/925af00e023aacab5a33c5eaf4bd731ad7192342/include/CubeBraidSDK/CameraSDK/CameraSDK.h>`__。

命名空间：``camera3d_sdk``

CameraSDK 面向装卸柜视觉定位和几何计算。公开头文件提供 C++ ``Camera3D`` 类，使用 PImpl 隐藏实现；SDK 仓库的 Python 脚本还尝试绑定 ``Camera3D_Create`` 等 C 导出符号，使用前应确认当前 DLL 确实导出了这些符号。

3.2.1 视觉系统硬件与网络配置
-----------------------------

``StatusCode``：

.. list-table::
   :header-rows: 1
   :widths: 38 15 47

   * - 枚举
     - 值
     - 含义
   * - ``SUCCESS``
     - 0
     - 执行成功。
   * - ``CAMERA_CONNECT_FAILED``
     - 1
     - 相机连接失败。
   * - ``CAMERA_CAPTURE_FAILED``
     - 2
     - 图像采集失败。
   * - ``INVALID_PARAMETER``
     - 3
     - 参数无效。
   * - ``CALIBRATION_FAILED``
     - 4
     - 标定失败。
   * - ``POINT_CLOUD_FAILED``
     - 5
     - 点云处理失败。
   * - ``ALGORITHM_FAILED``
     - 6
     - 算法处理失败。
   * - ``INTERNAL_ERROR``
     - 99
     - 内部错误。

数据结构
~~~~~~~~

* ``Point3D``：``float x/y/z`` 三维点；算法 demo 以米打印结果。
* ``CalibrationPose``：``x/y/z`` 为米，``qw/qx/qy/qz`` 为四元数姿态。
* ``CameraConfig``：主相机 ``camera_ip``、装卸一体模式的上相机 ``camera_ip_up``、深度文件和颜色文件路径。

初始化与连接
~~~~~~~~~~~~

.. code-block:: cpp

   camera3d_sdk::Camera3D camera;
   camera3d_sdk::CameraConfig config;
   config.camera_ip = "192.168.23.203";
   config.camera_ip_up = "192.168.23.88";
   config.depth_file = "./data/img/depth.tiff";
   config.color_file = "./data/img/demo.png";

   const auto status = camera.initialize(config);
   if (status == camera3d_sdk::StatusCode::SUCCESS && camera.connect()) {
       // 进行视觉算法调用
       camera.disconnect();
   }

也可以使用 ``isConnected``、``getLastStatus`` 和 ``getLastError`` 诊断连接或算法失败。``Camera3D`` 禁止拷贝，但支持移动构造和移动赋值。

配置与结果字段
~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``Point3D.x/y/z``
     - ``float``
     - 输出字段
     - 三维点；默认均为 ``0.0f``。算法 demo 以米打印结果。
   * - ``CalibrationPose.x/y/z``
     - ``float``
     - 输入字段
     - 手眼标定平移，单位 m，默认均为 ``0.0f``。
   * - ``CalibrationPose.qw/qx/qy/qz``
     - ``float``
     - 输入字段
     - 四元数，默认 ``qw=1.0f``，其余为 ``0.0f``。
   * - ``CameraConfig.camera_ip``
     - ``std::string``
     - 配置
     - 主／下相机地址；头文件默认 ``192.168.23.203``，现场使用实际配置。
   * - ``CameraConfig.camera_ip_up``
     - ``std::string``
     - 配置
     - 上相机地址，用于装卸一体模式；头文件默认 ``192.168.23.88``。
   * - ``CameraConfig.depth_file``
     - ``std::string``
     - 配置
     - 深度文件路径，默认 ``./data/img/depth.tiff``。
   * - ``CameraConfig.color_file``
     - ``std::string``
     - 配置
     - 颜色图路径，默认 ``./data/img/demo.png``。

initialize：初始化配置
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   StatusCode initialize(const CameraConfig& config);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``config``
     - ``const CameraConfig&``
     - 输入
     - 相机地址和图像文件配置，字段见上表。

返回值：``StatusCode``，成功为 ``SUCCESS``。

连接与诊断接口
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   bool connect();
   void disconnect() noexcept;
   bool isConnected() const noexcept;
   std::string getLastError() const;
   StatusCode getLastStatus() const noexcept;

以上接口均无参数。``connect`` 返回连接结果，``disconnect`` 断开连接且无返回值；``isConnected`` 返回连接状态，``getLastError`` 返回错误字符串，``getLastStatus`` 返回最近状态码。

3.2.2 集装箱与斜坡基准点定位算法
---------------------------------

processTradition：基准点定位
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   StatusCode processTradition(
       const CalibrationPose& calib_pose, const std::string& cameraIP,
       int model_mod, float agv_x, float agv_y, float angle,
       float j1_angle, bool integrated_load_unload_mode, Point3D& result);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``calib_pose``
     - ``const CalibrationPose&``
     - 输入
     - 手眼标定外参，平移为 m，姿态为四元数。
   * - ``cameraIP``
     - ``const std::string&``
     - 输入
     - 本次计算使用的相机 IP 地址。
   * - ``model_mod``
     - ``int``
     - 输入
     - ``0`` 第一面顶吸基准点，``1`` 其他面基准点。
   * - ``agv_x``
     - ``float``
     - 输入
     - AGV 导航时的前方距离；此形参的单位未在函数注释中单独标明。
   * - ``agv_y``
     - ``float``
     - 输入
     - AGV 导航时的左侧距离；此形参的单位未在函数注释中单独标明。
   * - ``angle``
     - ``float``
     - 输入
     - 倾角仪的 AGV 倾斜角；函数注释未标明单位。
   * - ``j1_angle``
     - ``float``
     - 输入
     - 拍照时机械臂一轴角度，单位为度，仅装卸一体模式生效。
   * - ``integrated_load_unload_mode``
     - ``bool``
     - 输入
     - ``true`` 装卸一体模式，``false`` 摆台模式。
   * - ``result``
     - ``Point3D&``
     - 输出
     - 调用方提供的结果对象，接收基准点坐标；demo 使用 m。

返回值：``StatusCode``，成功为 ``SUCCESS``；失败时查询 ``getLastError``。

调用示例：

.. code-block:: cpp

   camera3d_sdk::CalibrationPose calib;
   camera3d_sdk::Point3D result;
   const auto status = camera.processTradition(
       calib, camera_ip, 0, agv_x, agv_y, angle,
       j1_angle, false, result);

``model_mod`` 为 ``0`` 时表示第一面顶吸基准点，``1`` 表示其他面；``integrated_load_unload_mode`` 为 ``true`` 表示装卸一体模式，``false`` 表示摆台模式。``agv_x``、``agv_y``、``angle`` 和 ``j1_angle`` 的含义必须与现场坐标及标定流程一致。

3.2.3 集装箱加强筋法向与 AGV 航向角补偿
-----------------------------------------

processLastSurface：最后一面侧吸
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   StatusCode processLastSurface(
       const CalibrationPose& calib_pose, const std::string& cameraIP,
       float agv_x, float agv_y, float j1_angle,
       bool integrated_load_unload_mode, Point3D& result);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``calib_pose``
     - ``const CalibrationPose&``
     - 输入
     - 手眼标定，字段与 ``processTradition`` 相同。
   * - ``cameraIP``
     - ``const std::string&``
     - 输入
     - 相机 IP 地址。
   * - ``agv_x / agv_y``
     - ``float``
     - 输入
     - 前方／左侧导航距离，含义与 ``processTradition`` 相同。
   * - ``j1_angle``
     - ``float``
     - 输入
     - 机械臂一轴角，单位为度，仅装卸一体模式生效。
   * - ``integrated_load_unload_mode``
     - ``bool``
     - 输入
     - ``true`` 装卸一体，``false`` 摆台。
   * - ``result``
     - ``Point3D&``
     - 输出
     - 最后一面侧吸基准点坐标。

返回值：``StatusCode``。

processYaw：航向角补偿
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   StatusCode processYaw(
       const CalibrationPose& calib_pose, const std::string& cameraIP,
       float slam_x, float slam_y, float j1_angle,
       bool integrated_load_unload_mode, double& yaw);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``calib_pose``
     - ``const CalibrationPose&``
     - 输入
     - 手眼标定，字段与 ``processTradition`` 相同。
   * - ``cameraIP``
     - ``const std::string&``
     - 输入
     - 用于加强筋法向计算的相机 IP。
   * - ``slam_x / slam_y``
     - ``float``
     - 输入
     - AGV 导航时的前方／左侧距离；本函数注释未标明单位。
   * - ``j1_angle``
     - ``float``
     - 输入
     - 机械臂一轴角，单位为度，仅装卸一体模式生效。
   * - ``integrated_load_unload_mode``
     - ``bool``
     - 输入
     - ``true`` 装卸一体，``false`` 摆台。
   * - ``yaw``
     - ``double&``
     - 输出
     - 偏航角偏差，单位为度；头文件说明计算失败或误差过大时输出 ``90.0``。

返回值：``StatusCode``；``yaw`` 是输出参数，不是该函数的返回值。

statusToString：状态文本
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   std::string statusToString(StatusCode status);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``status``
     - ``StatusCode``
     - 输入
     - 需要转换的状态枚举。

返回值：``std::string`` 状态描述。

三个计算接口均未声明默认实参，所有参数需显式传入。

头文件当前未声明 Camera3D 的 C ABI。Python 脚本的 C ABI 映射属于仓库脚本实现，若要作为稳定公共接口使用，应在发布头文件中补齐并固定 C 结构体声明。

3.2.4 C++ 调用例程（CameraSDK_demo.cpp）
-------------------------------------------

.. code-block:: cpp

   camera3d_sdk::Camera3D camera;
   camera3d_sdk::CalibrationPose calib{0.072f, -0.245f, 0.557f,
                                        -0.625f, 0.153f, 0.353f, -0.679f};
   camera3d_sdk::Point3D benchmark;
   camera.processTradition(
       calib, "192.168.23.203", 0,
       1.348f, 0.395f, 1.35f, -155.69f,
       true, benchmark);

   double yaw_bias = 0.0;
   camera.processYaw(
       calib, "192.168.23.88",
       1.348f, 0.395f, -155.69f, true, yaw_bias);

3.2.5 Python 调用例程（camera_sdk_demo.py）
---------------------------------------------

SDK 脚本中的 Python 封装可按下例调用。相机地址、标定参数和坐标必须使用现场配置；在当前 DLL 的导出符号与脚本不一致时，应以 C++ 接口为准。

.. code-block:: python

   from camera_sdk import Camera3DSDK, Camera3DCalibrationPose

   calib = Camera3DCalibrationPose(
       x=0.12, y=-0.05, z=0.85,
       qw=1.0, qx=0.0, qy=0.0, qz=0.0)

   with Camera3DSDK() as camera:
       status, point = camera.process_tradition(
           pose=calib, camera_ip="192.168.23.203", model_mod=0,
           agv_x=1.25, agv_y=0.85, angle=0.3,
           j1_angle=15.0, integrated_mode=False)
       yaw_status, yaw_deg = camera.process_yaw(
           pose=calib, camera_ip="192.168.23.88",
           slam_x=1.25, slam_y=0.85, j1_angle=15.0,
           integrated_mode=False)
       if status == 0 and yaw_status == 0:
           print(point, yaw_deg)
       else:
           print(camera.get_last_error())

Python 这两个方法分别返回 ``(状态码, 基准点)`` 和 ``(状态码, 偏航角)``，不能把整个二元组当作单独的坐标或角度使用。
