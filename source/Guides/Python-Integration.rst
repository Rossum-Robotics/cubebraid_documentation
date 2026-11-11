4.1 Python 对接规范
====================

应用层使用 Python ``ctypes`` 整合底层 SDK 时，必须遵循以下标准开发规范。

结构体对齐
----------

``ctypes.Structure`` 的字段类型、顺序和内存对齐必须与 C++ 结构体严格一致。对于使用 ``#pragma pack(1)`` 的结构体，Python 侧也必须设置 ``_pack_ = 1``。

当前 ``PLCStatus`` 按 1 字节对齐，包含 11 个 ``int16_t`` 字段，总长 22 字节。应包含末尾的 ``plc_unload_state``；完整映射见 :doc:`PLC SDK <../API/PLC>`。

DlSegSDK Python 接口使用 BGR 三通道 ``uint8`` NumPy 图像；``detect`` 返回目标数量、目标列表、可视化图和单通道掩膜。其数量返回值不等同于初始化接口的状态码，参见 :doc:`DlSeg SDK <../API/DL>`。

句柄管理
--------

遵循“谁创建、谁释放”的原则。调用 ``AGV_Create``、``Robot_Create`` 或 ``plc_create`` 后，在程序退出和每个异常处理分支中显式调用相应的 Destroy 函数，避免内存泄漏或遗留设备连接。

字符串传递
----------

传入 C ABI 的字符串先使用 ``.encode('utf-8')`` 转换为字节流指针，并确保该指针在调用期间有效。``argtypes``、``restype``、数组长度和输出缓冲区大小也必须以随 SDK 发布的头文件为准。
