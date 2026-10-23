2.1 安装与构建
==============

SDK 源码、头文件、动态库和示例位于 `Rossum-Robotics/cubebraid_sdk <https://github.com/Rossum-Robotics/cubebraid_sdk>`__。获取完整仓库，并将同一版本的头文件、导入库和动态库一起使用。

SDK 目录
--------

.. list-table::
   :header-rows: 1
   :widths: 23 47 30

   * - 路径
     - 用途
     - 备注
   * - ``include/``
     - CubeBraid 头文件及配套头文件
     - 编译时加入 include path。
   * - ``lib/win/``
     - 9 个 SDK 模块的 Windows 导入库
     - 包含 ``DlSegSDK.lib``。
   * - ``bin/``
     - Windows SDK 与部分第三方 DLL
     - 完整依赖按所用模块准备。
   * - ``lib/linux/``
     - Linux SDK 动态库
     - 包含 ``libDlSegSDK.so`` 和 ``libsnap7.so``。
   * - ``lib/linux_arm/``
     - 部分 ARM 平台动态库
     - 当前不含 DlSegSDK 和 PLC_SDK；顶层 CMake 默认不选择此目录。
   * - ``src/``
     - C++ demo
     - 由顶层 CMake 创建目标。
   * - ``scripts/``
     - Python 封装、示例和参数样例
     - 各模块的库加载路径需分别核对。
   * - ``doc/``
     - Markdown/PDF API 说明
     - 包含 AGV 和 JsonParameter 文档。

获取代码
--------

在 PowerShell、Git Bash 或 Linux 终端执行：

.. code-block:: console

   git clone https://github.com/Rossum-Robotics/cubebraid_sdk.git
   cd cubebraid_sdk

模型和完整第三方运行时从 `官方 Releases <https://github.com/Rossum-Robotics/cubebraid_sdk/releases>`__ 获取。DlSegSDK 的 ``unload.onnx`` 位于 `v1.4 发布页 <https://github.com/Rossum-Robotics/cubebraid_sdk/releases/tag/v1.4>`__。准备依赖时保留与当前头文件配套的 SDK DLL/LIB/SO，不用旧发行包中的 SDK 文件覆盖当前版本。

Windows 构建
------------

准备 Visual Studio 2022 x64 C++ 工具链、CMake 3.5 或更高版本，以及 OpenCV 开发包。工程使用 C++14，默认启用 ``USE_OPENCV``，通过 ``OpenCVConfig.cmake`` 查找 OpenCV。

在 SDK 根目录创建构建目录，并将 ``OpenCV_DIR`` 指向本机包含 ``OpenCVConfig.cmake`` 的目录：

.. code-block:: console

   mkdir build
   cd build
   cmake -G "Visual Studio 17 2022" -A x64 -DOpenCV_DIR="C:/path/to/opencv/cmake" ..
   cmake --build . --config Release

顶层 CMake 从 ``lib/win`` 查找 SDK 导入库；可执行文件输出到 ``build/SDK_Demos``。运行前还需部署对应 DLL、模型和数据文件。

Ubuntu 构建
-----------

当前顶层 CMake 的 Linux 分支使用 ``lib/linux``，并引用 x86_64 系统 Protobuf 路径。以下流程用于匹配该发行库的 Ubuntu x86_64 环境，编译器和系统库 ABI 应与发行库一致。

准备编译工具和开发依赖：

.. code-block:: console

   sudo apt update
   sudo apt install -y build-essential cmake libopencv-dev libpcl-dev libprotobuf-dev protobuf-compiler

CMake 查找 OpenCV、PCL 的 common/io/features/segmentation 组件及 OpenMP，并链接 Protobuf 与 Snap7。GCC 的 OpenMP 支持由对应工具链提供。当前配置使用 ``/usr/lib/x86_64-linux-gnu/libprotobuf.so``，源码注释对应 Protobuf 3.12.4；部署前应确认系统版本和发行库兼容。

.. code-block:: console

   mkdir build
   cd build
   cmake -DCMAKE_BUILD_TYPE=Release ..
   cmake --build . -- -j4

完整构建需要所有模块的库及其依赖，包括 DlSegSDK 的推理运行时。早期 Linux 依赖包不包含新增分割模块的全部依赖；以当前库实际依赖为准。ARM 目录只提供部分模块，不适用上述完整构建流程。

构建目标
--------

* ``logger_demo``
* ``plc_sdk_demo``
* ``sensorsdk_demo``
* ``jsonsdk_demo``
* ``kawasaki_kinematics_sdk_demo``
* ``RobotSDK_demo``
* ``agv_sdk_demo``
* ``CameraSDK_demo``
* ``dlseg_sdk_demo``

示例的数据路径相对于启动时的工作目录解析。JsonSDK 样例位于 ``scripts/JsonSDK/data``，DlSegSDK 的图片与模型目录位于 ``scripts/DL_SDK/data``。构建不会自动把这些文件部署到输出目录。

运行时库
--------

Windows 下将 SDK 的 ``bin`` 及配套依赖目录加入当前进程的 DLL 搜索路径，例如在 SDK 根目录的 PowerShell 中执行：

.. code-block:: powershell

   $sdkRoot = (Get-Location).Path
   $env:Path = "$sdkRoot\bin;$env:Path"

Linux 下，在启动程序或 Python 解释器前设置库搜索路径；以下命令从 SDK 根目录执行：

.. code-block:: bash

   export LD_LIBRARY_PATH="$PWD/lib/linux${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

第三方运行时所在目录也须加入搜索路径。顶层 CMake 配置了相对 RPATH，但仍需保证部署后的目录结构与该路径匹配。依赖检查和打包要求见 :doc:`部署与运行时依赖 <../Guides/Deployment>`。

Python 示例
-----------

Python 封装位于 ``scripts``，通过 ``ctypes.CDLL`` 或 ``ctypes.WinDLL`` 加载原生库。各模块的默认库路径不同：DlSegSDK 默认使用 ``build/SDK_Demos``，其他模块需按脚本核对，不应统一假设为 ``bin``。

使用分割模块时安装 Python 图像处理依赖：

.. code-block:: console

   python -m pip install numpy opencv-python

DlSegSDK 的 ONNX Runtime 是原生动态库依赖，不能仅靠安装 Python 图像处理包替代。配置、模型和完整调用例程见 :doc:`深度学习箱体识别与实例分割 <../API/DL>`。

涉及设备连接、运动和 PLC 输出的示例，应在核对设备配置和现场操作条件后运行，参见 :doc:`安全须知 <../Guides/Safety>`。
