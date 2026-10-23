4.3 部署与运行时依赖
====================

CubeBraid SDK 将头文件、库和示例分开存放。Windows 导入库位于 ``lib/win``，DLL 位于 ``bin``；Linux 动态库位于 ``lib/linux``。部署应用时，将与编译时同一版本的 SDK 库、第三方依赖和配置作为一个整体发布。

运行时目录
----------

通常需要准备：

* 应用程序或 demo 可执行文件；
* 对应平台的 SDK DLL/SO；
* PLC 模块使用的 ``snap7.dll`` 或 ``libsnap7.so``；
* CameraSDK/AGV 等模块自身依赖的厂商或协议 DLL（以现场发布包为准）；
* DlSegSDK 使用的 ONNX Runtime、OpenCV，以及 CUDA 模式所需的 CUDA/cuDNN 运行时；
* DlSegSDK 的 ONNX 模型、类别名称文件、输入图片或视频设备配置；
* 与任务匹配的 JSON/TXT 配置和日志目录。

推荐通过应用启动器配置 DLL 搜索路径，而不是把不同 SDK 版本的 DLL 混放在系统目录。Windows 下可以把 SDK ``bin`` 加入进程环境的 ``PATH``，Python 3.8 及以上也可以使用 ``os.add_dll_directory``。

Linux 下，在启动应用或 Python 解释器前配置 ``LD_LIBRARY_PATH``，包括 SDK 的 ``lib/linux`` 和第三方库目录。使用 ``ldd`` 检查依赖是否能解析；当前顶层 CMake 还链接 OpenCV、PCL、OpenMP 和 Protobuf，需保持版本及 ABI 匹配。

DlSegSDK Python 封装默认查找 ``build/SDK_Demos/DlSegSDK.dll`` 或 ``build/SDK_Demos/libDlSegSDK.so``。该目录需要手动部署 SDK 和运行依赖；指定 ``lib_path`` 只改变主库路径，其他依赖仍需由系统加载器找到。顶层 CMake 不会自动复制 DLL、SO、模型或配置文件。

``lib/linux_arm`` 当前不含 DlSegSDK 和 PLC_SDK，且顶层 CMake 的 Linux 分支默认使用 ``lib/linux``。部署 ARM 应用时应按实际可用的模块和目标架构准备工程。

配置文件
--------

配置文件路径应由应用传入绝对路径或由明确的工作目录规则解析。仓库 demo 使用 ``./data/...`` 相对路径，但这些数据位于 ``scripts/JsonSDK/data``，并不自动出现在 CMake demo 的工作目录中。

DlSegSDK 示例使用 ``./data/models/unload.onnx``、``classes.txt`` 和 ``./data/img/demo.png``；相应工作目录位于 ``scripts/DL_SDK``。从其他位置启动时，应复制数据或调整路径，并提前创建输出目录。模型输入尺寸、类别顺序和阈值配置见 :doc:`分割模块 <../API/DL>`。

日志与诊断
----------

为每个任务设置独立日志目录，记录 SDK 版本、设备连接结果、状态变化、动作 ID、返回码和异常原因。日志中不要写入密码、密码哈希、客户数据或未脱敏的生产网络信息。

发布检查
--------

#. 在干净机器上验证 DLL 可以加载；
#. 验证所有 DLL/SO 的架构和依赖与应用一致；
#. 对分割模块先以离线图像验证模型加载、识别和两种结果图的保存；
#. 验证配置文件字段、单位和版本；
#. 在无负载/低风险环境验证状态读取；
#. 完成急停、断线、超时和恢复测试；
#. 锁定 SDK commit、二进制校验和与设备固件版本。
