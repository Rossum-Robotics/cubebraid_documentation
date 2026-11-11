第五章：华为 R2C 与 RS080N 集成
=================================

本章介绍川崎 RS080N 机器人与 R2C 方案的两套实现。Python 工程是接入华为 ``hw-r2c-sdk`` 的插件，底层通过 CubeBraid Python RobotSDK 与控制器通信；C++ 工程基于 CubeBraid RobotSDK 实现 RS080N 适配。

.. toctree::
   :maxdepth: 1

   R2C/Overview
   R2C/Python
   R2C/Cpp
   R2C/Configuration
   R2C/Safety-and-Troubleshooting

阅读与验证顺序
--------------

#. 阅读 :doc:`概览与架构 <R2C/Overview>`，区分两套实现及其依赖。
#. 使用 :doc:`Python 安装与插件 <R2C/Python>` 中的 mock 配置完成离线验证。
#. 按需阅读 :doc:`C++ 构建与接口 <R2C/Cpp>`，了解构建方法与适配接口。
#. 现场联调前核对 :doc:`配置与联调 <R2C/Configuration>` 和 :doc:`安全与故障排查 <R2C/Safety-and-Troubleshooting>`。

.. warning::

   实际连接、读取反馈和发送动作前，须遵守 :doc:`安全须知 <Guides/Safety>` 与现场联调规程。
