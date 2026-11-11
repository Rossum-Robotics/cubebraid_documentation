3.6 电气控制与 PLC 交互模块（PLC SDK）
========================================

头文件：``include/CubeBraidSDK/PLC_SDK/PLC_SDK.h``

命名空间：``plc_sdk``

PLC_SDK 基于 Snap7 客户端连接 PLC，提供 DB 块安全读写、装卸柜离散信号、取料参数发送和实时状态缓存。Windows 依赖 ``bin/snap7.dll``，Linux 依赖 ``lib/linux/libsnap7.so``。

3.6.1 Siemens S7 通信与数据结构定义
------------------------------------

``PLCStatus`` 使用 ``#pragma pack(push, 1)``，包含 11 个 ``int16_t`` 状态字段，共 22 字节，字段顺序如下：

* ``suction_cup_state``：吸盘状态；
* ``fixture_state``：底托状态；
* ``robot_pick_state``：机器人取料状态；
* ``robot_leave_state``：允许机器人取料离开状态；
* ``table_control_state``：摆台控制状态；
* ``hydraulic_rod_rise_state`` / ``hydraulic_rod_lower_state``：液压杆状态；
* ``plc_init_state``：PLC 初始化状态；
* ``table_init_control_ok_state``：摆台初始化完成状态；
* ``plc_data_request_state``：PLC 数据请求状态；
* ``plc_unload_state``：PLC 卸货允许请求状态。

``PickUpData`` 同样按 1 字节对齐，包含 ``fetch_mode``、``mode_switch``、SKU 长宽高、``sku_num`` 和单箱重量 ``sku_weight``。尺寸单位为 mm，重量单位为 kg。

3.6.2 DB 块读写与离散信号控制
-------------------------------

.. code-block:: cpp

   plc_sdk::PLCController plc;
   if (plc.connect("192.168.30.49", 0, 1)) {
       PickUpData data{};
       data.fetch_mode = 4;
       data.mode_switch = 2;
       data.sku_l = 600;
       data.sku_w = 500;
       data.sku_h = 400;
       data.sku_num = 1;
       data.sku_weight = 5.5;

       plc.triggerPLCInit();
       plc.sendPickUpData(data);
       const PLCStatus status = plc.getStatus();
       plc.disconnect();
   }

主要接口：

* 连接：``connect(ip, rack = 0, slot = 1)``、``disconnect``、``isConnected``；
* DB：``safeDBWrite``、``safeDBRead``；
* 吸盘/底托：``setOpenSuctionCup``、``setCloseSuctionCup``、``setSuctionCupPickingOK``、``setFixtureRollOut``、``setFixtureInitialization``；
* 异常：``setInclinometerErrorSignal``；
* 卸柜完成：``setUnloadOKSignal(enable)``，发送或复位卸柜放置 OK 信号；
* 状态：``getStatus``；
* 业务同步：``controlTableAngle``、``updateBoxState``、``updateInclinometerAngle``、``updateTotalBoxState``、``sendPickUpData``；
* 初始化：``triggerPLCInit``、``triggerTableInit``。

C ABI
~~~~~

C 接口使用 ``PLC_HANDLE``：

.. code-block:: cpp

   PLC_HANDLE plc_create(void);
   void plc_destroy(PLC_HANDLE handle);
   bool plc_connect(PLC_HANDLE handle, const char* ip, int rack, int slot);
   void plc_disconnect(PLC_HANDLE handle);
   bool plc_is_connected(PLC_HANDLE handle);
   bool plc_safe_db_write(PLC_HANDLE handle, int dbNumber,
                          int start, int size, void* buffer);
   bool plc_safe_db_read(PLC_HANDLE handle, int dbNumber,
                         int start, int size, void* buffer);
   bool plc_get_status(PLC_HANDLE handle, PLCStatus* status_out);
   bool plc_send_pickup_data(PLC_HANDLE handle, const PickUpData* data);

   void plc_set_open_suction_cup(PLC_HANDLE handle, bool enable);
   void plc_set_close_suction_cup(PLC_HANDLE handle, bool enable);
   void plc_set_fixture_roll_out(PLC_HANDLE handle, bool enable);
   void plc_set_fixture_initialization(PLC_HANDLE handle, bool enable);
   void plc_set_suction_cup_picking_ok(PLC_HANDLE handle, bool enable);
   void plc_set_retrieving_completion_side(PLC_HANDLE handle, bool enable);
   void plc_set_inclinometer_error_signal(PLC_HANDLE handle, bool enable);
   void plc_set_unload_ok_signal(PLC_HANDLE handle, bool enable);
   void plc_control_table_angle(PLC_HANDLE handle, int angle_mode);
   void plc_update_box_state(PLC_HANDLE handle, int surface_num,
                             int lay_num, int box_num);
   void plc_update_inclinometer_angle(PLC_HANDLE handle, float angle_value);
   void plc_update_total_box_state(PLC_HANDLE handle, int totalbox_num,
                                  int remain_num);
   bool plc_trigger_plc_init(PLC_HANDLE handle);
   bool plc_trigger_table_init(PLC_HANDLE handle);

3.6.3 C++ 调用例程（plc_sdk_demo.cpp）
---------------------------------------

.. code-block:: cpp

   plc_sdk::PLCController plc;
   if (!plc.connect("192.168.30.49", 0, 1)) return -1;
   plc.triggerPLCInit();
   PickUpData data{4, 2, 600.0, 500.0, 400.0, 1, 5.5};
   plc.sendPickUpData(data);
   plc.setOpenSuctionCup(true);
   plc.setFixtureRollOut(true);
   plc.updateBoxState(6, 9, 4);
   const auto status = plc.getStatus();
   plc.disconnect();

3.6.4 Python 调用例程（plc_sdk_demo.py）
------------------------------------------

Python 与当前头文件对接时，``PLCStatus`` 必须包含末尾的 ``plc_unload_state``，并设置 ``_pack_ = 1``。公开仓库的 ``plc_sdk_demo.py`` 定义了 ``PLCController``；其状态结构尚为 10 字段，使用当前 11 字段接口时需按以下完整映射对接。

下面的只读函数接收 SDK 根目录和现场 PLC 地址，绑定 C API 读取状态，最后断开连接并销毁句柄。Linux 下先按部署说明准备动态库搜索路径。

.. code-block:: python

   from contextlib import ExitStack
   from pathlib import Path
   import ctypes as ct
   import os
   import sys

   class PLCStatus(ct.Structure):
       _pack_ = 1
       _fields_ = [
           ("suction_cup_state", ct.c_int16),
           ("fixture_state", ct.c_int16),
           ("robot_pick_state", ct.c_int16),
           ("robot_leave_state", ct.c_int16),
           ("table_control_state", ct.c_int16),
           ("hydraulic_rod_rise_state", ct.c_int16),
           ("hydraulic_rod_lower_state", ct.c_int16),
           ("plc_init_state", ct.c_int16),
           ("table_init_control_ok_state", ct.c_int16),
           ("plc_data_request_state", ct.c_int16),
           ("plc_unload_state", ct.c_int16),
       ]

   assert ct.sizeof(PLCStatus) == 22

   def read_plc_status(sdk_root, ip):
       root = Path(sdk_root).resolve()
       with ExitStack() as stack:
           if sys.platform.startswith("win"):
               lib_dir = root / "bin"
               if hasattr(os, "add_dll_directory"):
                   stack.enter_context(os.add_dll_directory(str(lib_dir)))
               snap7 = ct.CDLL(str(lib_dir / "snap7.dll"))
               sdk = ct.CDLL(str(lib_dir / "PLC_SDK.dll"))
           elif sys.platform.startswith("linux"):
               lib_dir = root / "lib" / "linux"
               snap7 = ct.CDLL(str(lib_dir / "libsnap7.so"), mode=ct.RTLD_GLOBAL)
               sdk = ct.CDLL(str(lib_dir / "libPLC_SDK.so"))
           else:
               raise OSError("该示例支持 Windows 和 Linux")

           sdk.plc_create.argtypes = []
           sdk.plc_create.restype = ct.c_void_p
           sdk.plc_destroy.argtypes = [ct.c_void_p]
           sdk.plc_destroy.restype = None
           sdk.plc_connect.argtypes = [ct.c_void_p, ct.c_char_p, ct.c_int, ct.c_int]
           sdk.plc_connect.restype = ct.c_bool
           sdk.plc_disconnect.argtypes = [ct.c_void_p]
           sdk.plc_disconnect.restype = None
           sdk.plc_get_status.argtypes = [ct.c_void_p, ct.POINTER(PLCStatus)]
           sdk.plc_get_status.restype = ct.c_bool

           handle = sdk.plc_create()
           if not handle:
               raise RuntimeError("PLC 句柄创建失败")
           connected = False
           try:
               connected = sdk.plc_connect(handle, ip.encode("utf-8"), 0, 1)
               if not connected:
                   raise RuntimeError("PLC 连接失败")
               status = PLCStatus()
               if not sdk.plc_get_status(handle, ct.byref(status)):
                   raise RuntimeError("PLC 状态读取失败")
               return status
           finally:
               if connected:
                   sdk.plc_disconnect(handle)
               sdk.plc_destroy(handle)

卸柜完成信号对应 C++ ``setUnloadOKSignal(bool)`` 和 C API ``plc_set_unload_ok_signal(handle, enable)``，应按现场 PLC 信号时序发送与复位。
