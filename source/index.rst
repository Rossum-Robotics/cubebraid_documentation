CubeBraid 装卸柜机器人技术文档
==============================

CubeBraid SDK 面向集装箱装卸柜机器人系统，提供 AGV、工业相机、箱体识别与实例分割、机器人、PLC、倾角仪、运动学、参数管理和日志等基础能力。文档涵盖 CubeBraid SDK 接口，以及 RS080N 与华为 R2C 的 Python 插件和 C++ 适配工程。

.. toctree::
   :titlesonly:
   :maxdepth: 2
   :hidden:

   系统总体架构与工程设计 <System-Architecture>
   快速入门 <Get-Started>
   SDK 参考 <API-Reference>
   跨语言集成与部署指南 <Integration-and-Deployment>
   华为 R2C 与 RS080N 集成 <R2C-Integration>
   安全须知 <Guides/Safety>
   版本与变更 <Releases>
   联系与支持 <Contact>

快速开始
--------

如果您第一次使用 CubeBraid SDK，建议按以下顺序阅读：

* :doc:`产品与能力 <About-CubeBraid>`：了解 SDK 在装卸柜机器人中的职责边界。
* :doc:`安装与构建 <Get-Started/Installation>`：从 GitHub 获取 SDK，并使用 CMake 生成 demo。
* :doc:`第一个程序 <Get-Started/Quickstart>`：先从不连接硬件的参数读取和算法调用开始。
* :ref:`装卸柜业务流程 <container-workflow>`：了解视觉、AGV、机器人和 PLC 如何协同。
* :ref:`模块总览 <module-overview>`：根据设备或功能进入对应的 API 参考。

核心模块
--------

* **AGV_SDK**：AGV 网络连接、登录、自动/手动运动和位姿读取。
* **CameraSDK**：集装箱基准点、最后一面侧吸基准点和航向角偏差计算。
* **DlSegSDK**：基于深度学习的箱体识别与实例分割，输出目标信息、可视化分割图和全局掩膜。
* **RobotSDK**：机械臂连接、笛卡尔/关节运动和顶吸、侧吸目标位姿补偿。
* **PLC_SDK**：PLC DB 块读写、吸盘/底托信号、装柜状态和取料参数同步。
* **SensorSDK**：DXL360 倾角仪串口采集、自动重连和角度归零。
* **JsonSDK**：读取手眼标定、SKU、机器人位姿、垛型及续码配置。
* **KawasakiSDK**：川崎 RS080N 运动学正解、逆解和奇异点规避。
* **LoggerSDK**：线程安全日志、格式化输出和紧急停止记录。

接口形态
--------

SDK 同时提供原生 C++ 接口和部分 C ABI 接口。C ABI 适合 Python ``ctypes``、C# 或其他 FFI 封装；使用时必须保证调用方的结构体布局、参数类型、单位和 DLL 位数与头文件一致。

.. important::

   任何会调用 ``connect``、``control``、``goForward``、``goBack`` 或 PLC 输出信号的示例，都可能驱动真实设备。首次运行前请阅读 :doc:`安全须知 <Guides/Safety>`，并在断开执行机构或仿真环境中完成验证。

版本说明
--------

当前页面对应 CubeBraid SDK 仓库中的接口快照。若头文件、动态库和本文档版本不一致，请优先以随 SDK 发布的 ``include`` 目录头文件为准，并记录 SDK commit 或发布版本。

* `CubeBraid 官方网站 <https://www.rossum-robot.com/product/776.html>`__
* `CubeBraid SDK GitHub 仓库 <https://github.com/Rossum-Robotics/cubebraid_sdk>`__
