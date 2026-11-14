3.1 底盘控制模块（AGV SDK）
============================

头文件：``include/CubeBraidSDK/AGV_SDK/AGV_SDK.h``

参数依据：`官方头文件（固定版本 925af00） <https://github.com/Rossum-Robotics/cubebraid_sdk/blob/925af00e023aacab5a33c5eaf4bd731ad7192342/include/CubeBraidSDK/AGV_SDK/AGV_SDK.h>`__。

``AGVController`` 通过 TCP 连接 AGV 控制器，内部维护接收线程和心跳线程。接口支持 C++ 对象方式，也导出以 ``AGV_Handle`` 为核心的 C ABI。

3.1.1 AGV 结构与状态通信协议
-----------------------------

``AGVPose`` 包含 ``x``、``y``、``z``、``roll``、``pitch``、``yaw`` 六个 ``double`` 字段。仓库 demo 将 ``roll`` 和 ``pitch`` 输出为 AGV 前方/左侧距离；实际坐标含义应以 AGV 控制器协议和现场坐标系为准。

.. list-table:: AGVPose 字段
   :header-rows: 1
   :widths: 20 20 45 15

   * - 字段
     - 类型
     - 含义
     - 单位
   * - ``x, y, z``
     - ``double``
     - 空间笛卡尔坐标位置。
     - 头文件未注明
   * - ``roll``
     - ``double``
     - AGV 前方距离。
     - m
   * - ``pitch``
     - ``double``
     - AGV 左侧距离。
     - m
   * - ``yaw``
     - ``double``
     - 偏航角或航向角。
     - 头文件未注明

目标导航使用 ``GoalPose``，包含 ``double x``、``double y`` 和 ``double yaw``；C ABI 对应 ``C_GoalPose``，字段顺序相同。目标坐标以 AGV 地图坐标系及控制器协议为准，不能直接套用相对位移接口的毫米单位。

目标导航使用 ``GoalPose``，包含 ``double x``、``double y`` 和 ``double yaw``；C ABI 对应 ``C_GoalPose``，字段顺序相同。目标坐标以 AGV 地图坐标系及控制器协议为准，不能直接套用相对位移接口的毫米单位。

通信线程
~~~~~~~~

连接后，AGV 模块通过后台接收线程 ``receiveLoop`` 接收 TCP 数据，并由 ``parseDataStream`` 完成数据流的拆包与粘包解析；``heartbeatLoop`` 定时调用 ``sendHeartBeatsMsg`` 维持系统心跳。断开或销毁对象时应确保这些线程已经停止。

3.1.2 控制模式与运动指令接口
-----------------------------

``ControlMode`` 枚举值：

.. list-table::
   :header-rows: 1
   :widths: 30 20 50

   * - 枚举
     - 值
     - 说明
   * - ``ControlMode::Manual``
     - 2
     - 手动速度控制。
   * - ``ControlMode::Auto``
     - 3
     - 自动位移控制。

连接与状态
~~~~~~~~~~

.. code-block:: cpp

   #include "CubeBraidSDK/AGV_SDK/AGV_SDK.h"

   agv_sdk::AGVController agv;
   if (!agv.connectAGV("192.168.1.91", 5005)) {
       // 处理连接失败
   }

   if (agv.login("admin", password_hash)) {
       agv.switchControlMode(agv_sdk::ControlMode::Auto);
       const bool ok = agv.goForward(500.0, 30000);
       const auto pose = agv.getPose();
       agv.logout();
   }
   agv.disconnectAGV();

生产环境不要直接使用 demo 中的 IP、用户名或密码哈希。登录接口的第二个参数是已经计算好的 ``password_hash`` 字符串，哈希算法和凭据管理不由此接口定义。

运动与状态接口
~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 42 28 30

   * - 接口
     - 返回值
     - 说明
   * - ``connectAGV(ip, port)``
     - ``bool``
     - 建立 TCP 连接并启动后台线程。
   * - ``disconnectAGV()``
     - ``void``
     - 停止后台线程并释放连接。
   * - ``login(username, password_hash)``
     - ``bool``
     - 登录 AGV 系统。
   * - ``logout()``
     - ``bool``
     - 注销当前会话。
   * - ``switchControlMode(mode)``
     - ``bool``
     - 切换手动或自动模式。
   * - ``goForward(dist_mm, timeout_ms)``
     - ``bool``
     - 自动模式下阻塞等待前进动作完成，默认超时 30000 ms。
   * - ``goBack(dist_mm, timeout_ms)``
     - ``bool``
     - 自动模式下阻塞等待位移完成，默认超时 30000 ms。
   * - ``navToPose(pose, timeout_ms = 30000)``
     - ``bool``
     - 导航到 ``GoalPose`` 指定的目标点，任务完成返回 true，超时或中断返回 false。
   * - ``navToStation(stations_num, timeout_ms = 30000)``
     - ``bool``
     - 导航到已配置的站点编号，任务完成返回 true，超时或中断返回 false。
   * - ``manualCtlVelSet(vx, vy, w)``
     - ``bool``
     - 手动模式发送一次速度指令；``vx/vy`` 为 mm/s，``w`` 按头文件为 0.001 rad/s。
   * - ``moveManualForDuration(...)``
     - ``bool``
     - 持续重发手动速度，结束时发送速度归零；仅 C++ 类接口提供。
   * - ``querySystemState()``
     - ``bool``
     - 主动请求 AGV 系统状态。
   * - ``sendHeartBeatsMsg()``
     - ``bool``
     - 手动发送一次心跳；类内部已有心跳线程。
   * - ``getPose()``
     - ``AGVPose``
     - 线程安全读取本地缓存位姿。

``goBack`` 的正负方向由 AGV 控制器协议定义；仓库 C++/Python demo 使用 ``+500`` 表示单步前进、``-500`` 表示单步后退，集成前应在现场确认。

connectAGV / login：连接与会话
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   bool connectAGV(const std::string& ip, int port);
   bool login(const std::string& username, const std::string& password_hash);

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
     - AGV 服务器 IP 地址，无默认实参。
   * - ``port``
     - ``int``
     - 输入
     - AGV 服务端口，无默认实参。
   * - ``username``
     - ``const std::string&``
     - 输入
     - 登录用户名。
   * - ``password_hash``
     - ``const std::string&``
     - 输入
     - 已计算好的密码哈希字符串，不是原始密码。

返回值：``bool``，分别表示连接或登录结果。

switchControlMode：控制模式
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   bool switchControlMode(ControlMode mode);

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
     - ``Manual=2`` 为手动模式，``Auto=3`` 为自动模式。

返回值：``bool``。

goForward / goBack：自动位移
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   bool goForward(double dist_mm, int timeout_ms = 30000);
   bool goBack(double dist_mm, int timeout_ms = 30000);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``dist_mm``
     - ``double``
     - 输入
     - 位移距离，单位 mm；方向与正负号按控制器协议使用。
   * - ``timeout_ms``
     - ``int``
     - 输入
     - 等待超时，单位 ms；两个 C++ 接口均默认 ``30000``。

返回值：``bool``，接口阻塞至完成或超时。

navToPose / navToStation：目标导航
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   bool navToPose(GoalPose pose, int timeout_ms = 30000);
   bool navToStation(int stations_num, int timeout_ms = 30000);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``pose``
     - ``GoalPose``
     - 输入
     - 目标点，包含 ``double x/y/yaw``，默认构造值均为 ``0.0``；目标坐标及航向单位未在头文件中注明。
   * - ``stations_num``
     - ``int``
     - 输入
     - 已配置的站点编号。
   * - ``timeout_ms``
     - ``int``
     - 输入
     - 单位 ms，两个 C++ 接口均默认 ``30000``。

返回值：``true`` 表示任务完成，``false`` 表示超时或中断。

manualCtlVelSet / moveManualForDuration：手动速度
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   bool manualCtlVelSet(float vx, float vy, float w);
   bool moveManualForDuration(float vx, float vy, float w,
                              int duration_ms, int interval_ms = 100);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``vx``
     - ``float``
     - 输入
     - X 方向线速度，单位 mm/s。
   * - ``vy``
     - ``float``
     - 输入
     - Y 方向线速度，单位 mm/s。
   * - ``w``
     - ``float``
     - 输入
     - 角速度，单位为 ``0.001 rad/s``。
   * - ``duration_ms``
     - ``int``
     - 输入
     - 持续重发速度的总时长，单位 ms；仅持续运动接口使用。
   * - ``interval_ms``
     - ``int``
     - 输入
     - 重发间隔，单位 ms，默认 ``100``；仅持续运动接口使用。

返回值：``bool``。单次接口发送一次速度；持续接口在到期后自动发送归零速度。

无参数接口
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   void disconnectAGV();
   bool logout();
   bool querySystemState();
   bool sendHeartBeatsMsg();
   AGVPose getPose() const;

``disconnectAGV`` 清理连接，无返回值；``logout`` 返回注销结果。``querySystemState`` 和 ``sendHeartBeatsMsg`` 分别发送状态请求和心跳，返回 ``bool``。``getPose`` 返回线程安全读取的本地缓存 ``AGVPose``；其六个 ``double`` 字段默认构造值均为 ``0.0``。

3.1.3 C-API 跨语言封装接口
---------------------------

.. code-block:: cpp

   typedef void* AGV_Handle;
   typedef struct {
       double x;
       double y;
       double yaw;
   } C_GoalPose;
   AGV_Handle AGV_Create();
   void AGV_Destroy(AGV_Handle handle);
   bool AGV_Connect(AGV_Handle handle, const char* ip, int port);
   void AGV_Disconnect(AGV_Handle handle);
   bool AGV_Login(AGV_Handle handle, const char* username,
                  const char* password_hash);
   bool AGV_Logout(AGV_Handle handle);
   bool AGV_SwitchControlMode(AGV_Handle handle, C_ControlMode mode);
   bool AGV_GoForward(AGV_Handle handle, double dist_mm, int timeout_ms);
   bool AGV_GoBack(AGV_Handle handle, double dist_mm, int timeout_ms);
   bool AGV_NavToPose(AGV_Handle handle, C_GoalPose pose, int timeout_ms);
   bool AGV_ToStation(AGV_Handle handle, int stations_num, int timeout_ms);
   bool AGV_ManualCtlVelSet(AGV_Handle handle, float vx, float vy, float w);
   bool AGV_QuerySystemState(AGV_Handle handle);
   bool AGV_SendHeartBeatsMsg(AGV_Handle handle);
   C_AGVPose AGV_GetPose(AGV_Handle handle);

C ABI 参数约定
~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``handle``
     - ``AGV_Handle``
     - 输入
     - ``AGV_Create`` 返回的句柄，供除创建外的 C 接口使用；最后交给 ``AGV_Destroy``。
   * - ``ip / username / password_hash``
     - ``const char*``
     - 输入
     - 分别为服务器地址、用户名和密码哈希字符串，含义与同名 C++ 参数一致。
   * - ``port / timeout_ms / stations_num``
     - ``int``
     - 输入
     - 服务器端口、超时（ms）和站点编号；C ABI 不提供默认实参。
   * - ``mode``
     - ``C_ControlMode``
     - 输入
     - ``C_CONTROL_MODE_MANUAL=2`` 或 ``C_CONTROL_MODE_AUTO=3``。
   * - ``dist_mm``
     - ``double``
     - 输入
     - 位移距离，单位 mm。
   * - ``pose``
     - ``C_GoalPose``
     - 输入
     - 按值传递的目标点，包含 ``double x/y/yaw``。
   * - ``vx / vy / w``
     - ``float``
     - 输入
     - 线速度为 mm/s，角速度为 ``0.001 rad/s``。

``AGV_Create`` 无参数并返回句柄；``AGV_Destroy`` 和 ``AGV_Disconnect`` 返回 ``void``。连接、登录、注销、模式切换、位移、导航、速度、查询及心跳接口均返回 ``bool``；业务含义与同名 C++ 接口相同。``AGV_GetPose`` 返回 ``C_AGVPose`` 值，字段与 ``AGVPose`` 对应。C++ 持续手动运动方法没有对应的头文件 C 导出接口。

3.1.4 C++ 调用例程（agv_sdk_demo.cpp）
----------------------------------------

下例展示自动前进、位姿读取和手动速度控制的完整调用顺序。示例地址和凭据仅用于说明格式，必须替换为现场安全配置：

.. code-block:: cpp

   agv_sdk::AGVController agv;
   if (!agv.connectAGV("192.168.1.91", 5005)) return -1;
   if (!agv.login("<username>", "<password_hash>")) return -1;

   agv.switchControlMode(agv_sdk::ControlMode::Auto);
   agv.querySystemState();
   const auto pose = agv.getPose();
   agv.goForward(1800.0, 100000);

   agv.switchControlMode(agv_sdk::ControlMode::Manual);
   agv.moveManualForDuration(100.0f, 0.0f, 0.0f, 2000, 50);
   agv.logout();
   agv.disconnectAGV();

3.1.5 Python 调用例程（agv_sdk_demo.py）
------------------------------------------

下面的示例只展示调用顺序。设备地址、用户名和密码哈希必须替换为现场安全配置，不能直接复制到生产程序：

.. code-block:: python

   from agv_sdk import AGVClient, ControlMode

   def main():
       with AGVClient() as agv:
           if not agv.connect("192.168.1.91", 5005):
               return
           if not agv.login("<username>", "<password_hash>"):
               return
           agv.switch_control_mode(ControlMode.AUTO)
           if agv.go_forward(1800.0, timeout_ms=100000):
               print("前进到达指定位置")
           print(agv.get_pose())
           agv.switch_control_mode(ControlMode.MANUAL)
           agv.move_manual_for_duration(
               vx=100.0, vy=0.0, w=0.0,
               duration_s=2, interval_s=0.1)

   if __name__ == "__main__":
       main()

目标点与站点导航
~~~~~~~~~~~~~~~~

在连接、登录并进入自动模式后，C++ 可调用 ``navToPose(GoalPose{x, y, yaw}, timeout_ms)`` 或 ``navToStation(stations_num, timeout_ms)``。Python 封装提供 ``C_GoalPose``、``navToPose`` 和 ``toStation``，名称大小写与仓库保持一致：

.. code-block:: python

   from agv_sdk import C_GoalPose

   def navigate_to_target(agv, x, y, yaw, timeout_ms=30000):
       goal = C_GoalPose(x=x, y=y, yaw=yaw)
       return agv.navToPose(goal, timeout_ms=timeout_ms)

   def navigate_to_station(agv, station_number, timeout_ms=30000):
       return agv.toStation(station_number, timeout_ms=timeout_ms)

这两个函数接收已连接、登录且处于自动模式的 ``AGVClient``。站点编号须与 AGV 已配置的地图一致。
