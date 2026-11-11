5.4 配置与联调
===============

Python 与 C++ 工程分别使用各自的 ``robot_rs080n_real.yaml``。现场控制器地址、证书和设备凭据应在本地受控配置中管理。

Python 配置
-----------

插件 ``config/robot_rs080n_config.yaml`` 选择 ``mock``，用于离线检查；``config/robot_rs080n_real.yaml`` 选择 ``cubebraid``，用于现场连接。现场配置中的连接字段示例如下；``CONTROLLER_IP`` 须替换为实际控制器地址，其余轴限位和运动参数仍以完整配置文件为准：

.. code-block:: yaml

   hardware:
     config:
       dry_run: true
       driver:
         mode: cubebraid
         host: "CONTROLLER_IP"
         motion_port: 31400
         status_port: 31401

需要核对的字段包括：

* ``hardware.config.dry_run``：是否阻止发送真实动作。即使为 ``true``，``connect()`` 和 ``get_observation()`` 仍会访问实际控制器。
* ``driver.host``、``motion_port``、``status_port``：控制器地址和运动、状态端口；示例配置中的端口为 31400 和 31401。
* ``joints.names``、``lower_deg``、``upper_deg``：六轴顺序和经控制器核准的度数限位；``absolute_degrees_confirmed`` 与 ``feedback_layout_confirmed`` 只能在核对实际反馈后确认。
* ``motion.control_mode``、``max_target_step_deg``、``position_tolerance_deg``、``settle_time_s``、``settle_samples``、``timeout_s``：控制模式、单步变化上限和到位判定参数。

R2C 对外关节数据使用弧度，插件内部验证和 CubeBraid 控制器调用使用度。``send_action()`` 的 ``joint_target_names`` 必须与配置的六个轴名一一对应。离线 mock 配置中的宽限位只是模拟值，不能作为现场机器人软限位。

C++ 配置
--------

C++ 的 ``configs/robot_rs080n_real.yaml`` 由 ``RobotConfig::load`` 读取，包含控制器地址、端口、六轴上下限、最大单步变化、到位容差和超时等。``RS080NAdapter`` 在构造时尝试从相对路径 ``configs/robot_rs080n_real.yaml`` 加载，因此运行目录必须使该路径可解析；部署前应核对文件已复制到程序旁的 ``configs`` 子目录。

C++ 配置可读取 ``control_mode``；``CubeBraidDriver`` 的关节和位姿调用使用固定的 ``robot_sdk::ControlMode::Fine`` 模式。Python 与 C++ 都应在首次联调前由现场负责人确认轴序、单位、限位、网络隔离和反馈有效性。

联调顺序
--------

#. 用 Python mock 配置验证安装、配置解析和观测字段。
#. 核对两个工程分别使用的 CubeBraid 库版本、Windows 位数与依赖文件。
#. 现场人员确认控制器地址、端口、关节轴序、姿态单位和安全回路。
#. 在受控条件下先验证连接与只读反馈，再按现场批准的动作规程测试运动。

动作完成须以设备反馈和 ``reached`` 状态共同确认。反馈异常时停止后续动作，由现场人员核对实际位置及控制器状态。
