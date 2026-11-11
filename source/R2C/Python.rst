5.2 Python 安装与插件
=====================

``RS080N_R2C_Runtime_v1`` 面向 Windows，``environment.yml`` 指定 Python 3.12 和 ``rs080n_r2c`` Conda 环境。准备 Miniforge 后，在该运行时目录内依次安装随目录提供的华为 R2C Python 包和 RS080N 插件。

安装前准备
----------

* 使用 Miniforge Prompt，确认已安装 Miniforge，且 Python 位数与随插件提供的 CubeBraid 运行时库一致。
* 运行时目录包含 ``packages/r2c_sdk_python``；插件安装目录为 ``plugin/RS080N_R2C_Plugin_v1``。安装和离线 mock 检查不需要连接机器人。
* 现场连接前核对控制器网络、IP、端口及经批准的关节限位，参见 :doc:`配置与联调 <Configuration>`。

目录中的主要文件与用途如下：

.. code-block:: text

   RS080N_R2C_Runtime_v1/
   ├── environment.yml               # Conda 环境
   ├── requirements.txt              # Python 依赖
   ├── install.bat                   # 运行时安装脚本
   ├── check_environment.py         # 环境导入检查
   ├── packages/r2c_sdk_python/     # 华为 R2C Python SDK
   └── plugin/RS080N_R2C_Plugin_v1/
       ├── adapter/                 # R2C 适配器
       ├── drivers/                 # 机器人驱动
       ├── config/                  # 机器人配置
       ├── examples/r2c_n_step_motion_test.py
       └── vendor/CubeBraidSDK/     # CubeBraid Python 封装及运行时依赖

安装与环境检查
--------------

在 ``RS080N_R2C_Runtime_v1`` 根目录执行：

.. code-block:: bat

   conda env create -f environment.yml
   conda activate rs080n_r2c
   python -m pip install ./packages/r2c_sdk_python
   python -m pip install -e ./plugin/RS080N_R2C_Plugin_v1
   python check_environment.py

``packages/r2c_sdk_python`` 须包含已授权的华为 R2C Python SDK。``install.bat`` 可创建环境并安装该 SDK；插件 ``plugin/RS080N_R2C_Plugin_v1`` 需单独安装。``check_environment.py`` 检查 Python 版本以及 ``r2c_sdk``、NumPy 和 Pydantic 的导入状态。它不检查插件；插件安装后可单独验证入口模块：

.. code-block:: bat

   python -c "from rs080n_r2c.adapter.r2c_plugin import create_rs080n_adapter; print('RS080N plugin: OK')"

接口与数据
----------

插件入口 ``create_rs080n_adapter(config)`` 创建 ``RS080NR2CAdapter``，对外实现 ``connect``、``disconnect``、``get_observation``、``send_action``、``stop`` 和 ``diagnostics``。其中：

* ``get_observation()`` 返回 ``joint_names``、弧度制 ``joint_positions``，以及供现场核对的度数 ``joint_positions_deg``。
* ``send_action()`` 要求 ``joint_target`` 为六个绝对关节目标弧度值，``joint_target_names`` 为与配置一致的六个轴名；插件按轴名重排并换算成度。
* ``move_joints_deg()`` 使用度数，校验反馈、关节限位、单步变化量和故障，并返回动作完成状态。
* ``stop()`` 在 CubeBraid Python 驱动中返回 ``False``；现场急停由安全回路执行。

离线读取示例
------------

以下片段从 ``RS080N_R2C_Runtime_v1`` 根目录运行，显式加载插件的 ``robot_rs080n_config.yaml``。该配置选择 ``mock`` 且 ``dry_run: true``，只读取内存中的模拟关节状态，不连接实际控制器：

.. code-block:: python

   from rs080n_r2c.adapter.config_loader import load_document
   from rs080n_r2c.adapter.rs080n_adapter import RS080NAdapter

   config = load_document(
       "plugin/RS080N_R2C_Plugin_v1/config/robot_rs080n_config.yaml"
   )
   robot = RS080NAdapter(config)
   try:
       robot.connect()
       observation = robot.get_observation()
       print(observation["joint_names"], observation["joint_positions"])
   finally:
       robot.disconnect()

``examples/r2c_n_step_motion_test.py`` 加载真实设备配置、连接控制器并读取初始关节状态，依次生成 J1、J2、J3 的正向与反向目标，共六步；每一步读取反馈并输出动作结果。``dry_run: true`` 时不发送运动指令，但连接和状态查询仍会访问真实控制器。

现场连接与功能验证
------------------

.. warning::

   以下步骤会连接真实 RS080N 控制器。先确认网络、配置、急停与人员隔离，并保持 ``dry_run: true``。此模式验证连接、状态读取和动作目标生成，不验证真实机器人运动到位。

从运行时根目录进入插件根目录，再运行示例。脚本按当前工作目录解析 ``config/robot_rs080n_real.yaml``，因此应在插件根目录执行：

.. code-block:: bat

   cd plugin\RS080N_R2C_Plugin_v1
   python examples\r2c_n_step_motion_test.py

示例输出连接状态、初始关节角度、每一步的目标与反馈，以及断开连接结果。真实运动仅在完成现场确认后按批准的联调规程执行；现场确认要求见 :doc:`安全与故障排查 <Safety-and-Troubleshooting>`。

CloudRobo 在线接入
------------------

本地适配器验证完成后，可使用平台签发的凭据包和插件机器人配置启动 R2C 客户端。以下命令在插件根目录执行；将 ``BUNDLE_ZIP_PATH`` 替换为本地受控存储中的凭据包完整路径：

.. code-block:: bat

   python -m r2c_sdk.cloudroboclient ^
     --bundle "BUNDLE_ZIP_PATH" ^
     --robot-config "config\robot_rs080n_real.yaml"

该命令会连接 R2C 平台及配置中的机器人控制器，并持续运行，直到客户端停止。凭据包、私钥密码及现场地址不得写入公开仓库或命令历史；如凭据包使用加密私钥，客户端会在需要时提示输入密码。
