第二章：快速入门
================

本节从 SDK 获取、编译和第一次调用开始，适用于希望集成 CubeBraid 装卸柜机器人能力的 C++ 开发者。Python 示例通过 ``ctypes`` 加载 SDK 动态库，需要先准备对应平台的 DLL 或 SO 及其依赖。

.. toctree::
   :maxdepth: 2

   Get-Started/Installation
   Get-Started/Quickstart

推荐顺序
--------

#. 阅读 :doc:`安全须知 <Guides/Safety>`，确认测试环境和急停措施。
#. 从 `CubeBraid SDK GitHub 仓库 <https://github.com/Rossum-Robotics/cubebraid_sdk>`__ 获取 SDK。
#. 按 :doc:`安装与构建 <Get-Started/Installation>` 生成 demo 并准备 DLL 搜索路径。
#. 使用 :doc:`第一个程序 <Get-Started/Quickstart>` 验证参数读取或纯算法调用。
#. 根据设备进入 :ref:`模块总览 <module-overview>` 和对应 API 页面。
