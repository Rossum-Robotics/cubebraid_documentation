3.8 配置文件解析模块（JsonParameter SDK）
===========================================

头文件：``include/CubeBraidSDK/JsonSDK/JsonParameterSDK.h``

参数依据：`官方头文件（固定版本 925af00） <https://github.com/Rossum-Robotics/cubebraid_sdk/blob/925af00e023aacab5a33c5eaf4bd731ad7192342/include/CubeBraidSDK/JsonSDK/JsonParameterSDK.h>`__。

Json SDK 是纯 C ABI 的参数读写库，接口以文件路径、索引和输出结构体为主，适合 C/C++、Python ``ctypes`` 和其他 FFI 调用。

3.8.1 配置文件解析与参数映射
-----------------------------

所有其他接口前调用：

.. code-block:: cpp

   const int ret = JsonParameterSDK_Initialize();
   if (ret != JSONPARAM_SDK_SUCCESS) {
       // 初始化失败
   }

   // 调用读取或写入接口
   JsonParameterSDK_Uninitialize();

数据结构
~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 30 35 35

   * - 类型
     - 字段
     - 单位/用途
   * - ``CalibrationPose``
     - ``x/y/z``, ``qw/qx/qy/qz``
     - 手眼标定平移和四元数姿态。
   * - ``SkuData``
     - ``length/width/height/weight``
     - 产品长宽高为 mm，重量为 kg。
   * - ``RobotPose``
     - ``x/y/z``, ``rx/ry/rz``
     - 机器人取料/放料位姿。
   * - ``ContinuationConfig``
     - ``surface_num``, ``layer_num``, ``work_mode_num``, ``agv_mode_num``, ``action_num``, ``stack_type``
     - 续码任务配置。
   * - ``RobotState``
     - 工作模式、面、层、动作、数量及 ``x/y/z/rx/ry/rz``
     - 机器人运行状态。
   * - ``PalletizingPatternData``
     - 面/层、夹具/抓取模式、吸取方式、偏移量、SKU/集装箱尺寸、数量
     - 垛型与装柜计算输入。

标定、SKU 和位姿字段
~~~~~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``CalibrationPose.x/y/z``
     - ``float``
     - 输出字段
     - 手眼标定位置；本头文件未标注平移单位。
   * - ``CalibrationPose.qw/qx/qy/qz``
     - ``float``
     - 输出字段
     - 手眼标定四元数。
   * - ``SkuData.length/width/height``
     - ``double``
     - 输出字段
     - 产品长／宽／高，单位 mm。
   * - ``SkuData.weight``
     - ``double``
     - 输出字段
     - 产品重量，单位 kg。
   * - ``RobotPose.x/y/z``
     - ``float``
     - 输出字段
     - 机器人位置，单位由配置文件约定，本头文件未标注。
   * - ``RobotPose.rx/ry/rz``
     - ``float``
     - 输出字段
     - 机器人姿态分量，角度约定需与配置文件匹配。

状态与续码字段
~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``ContinuationConfig.surface_num / layer_num``
     - ``int``
     - 输出字段
     - 面数／层数。
   * - ``ContinuationConfig.work_mode_num / agv_mode_num``
     - ``int``
     - 输出字段
     - 工作模式／AGV 模式，头文件未给出完整取值表。
   * - ``ContinuationConfig.action_num``
     - ``int``
     - 输出字段
     - 动作数量。
   * - ``ContinuationConfig.stack_type``
     - ``int``
     - 输出字段
     - 预留码垛类型。
   * - ``RobotState.work_mode_state``
     - ``int``
     - 输出字段
     - 工作模式。
   * - ``RobotState.surface_state / layer_state / action_state``
     - ``int``
     - 输出字段
     - 当前面／层／动作状态。
   * - ``RobotState.total_num``
     - ``int``
     - 输出字段
     - 总数量。
   * - ``RobotState.x/y/z / rx/ry/rz``
     - ``float``
     - 输出字段
     - 当前位置与姿态；本头文件未标注这些字段的单位。

上述结构体没有字段默认初始化声明，接收前应由调用方初始化存储。

PalletizingPatternData：垛型字段
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``number_of_surface / number_of_layers``
     - ``int``
     - 输出字段
     - 面数／层数，声明初始值均为 ``0``。
   * - ``fixture_mode``
     - ``int``
     - 输出字段
     - 预留夹具模式，声明初始值 ``0``。
   * - ``fetch_mode``
     - ``int``
     - 输出字段
     - 夹具取料模式，声明初始值 ``0``；本字段注释未列出完整模式取值。
   * - ``mode_switch``
     - ``int``
     - 输出字段
     - 顶吸 ``1``／侧吸 ``2``，声明初始值 ``0``。
   * - ``r_offset``
     - ``bool``
     - 输出字段
     - 是否为每层最左侧垛型，初始值 ``false``。
   * - ``stack_type``
     - ``int``
     - 输出字段
     - 预留垛型类型，初始值 ``0``。
   * - ``product_type``
     - ``int``
     - 输出字段
     - 正常码法 ``1``；特殊码法（第一面最上层右侧两个横纸箱）``2``；初始值 ``0``。
   * - ``special_stack_type``
     - ``int``
     - 输出字段
     - 正常码法 ``0``／一横多竖特殊码法 ``1``；初始值 ``0``。
   * - ``x / y / z``
     - ``float``
     - 输出字段
     - 垛型三个方向的偏移，单位 mm，初始值均为 ``0.0``。
   * - ``sku_l / sku_w / sku_h``
     - ``float``
     - 输出字段
     - 产品长／宽／高，单位 mm，初始值均为 ``0.0``。
   * - ``sku_weight``
     - ``float``
     - 输出字段
     - 产品重量，单位 kg，初始值 ``0.0``。
   * - ``container_l / container_w / container_h``
     - ``float``
     - 输出字段
     - 集装箱长／宽／高，单位 mm，初始值均为 ``0.0``。
   * - ``sku_num``
     - ``int``
     - 输出字段
     - 单次动作抓取数量，单位为箱，初始值 ``0``。

声明初始值表示默认构造状态，不表示该值一定是业务有效配置。

查询接口
~~~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 48 52

   * - 函数
     - 功能
   * - ``JsonParameterSDK_CheckJsonFile(file_path)``
     - 检查 JSON 文件存在性和格式。
   * - ``JsonParameterSDK_GetCalibration(file_path, cam_mode, result)``
     - 读取指定相机模式的手眼标定。
   * - ``JsonParameterSDK_GetSku(file_path, sku_index, result)``
     - 读取 SKU。
   * - ``JsonParameterSDK_GetAgvAngle(file_path, angle_index, angle)``
     - 读取 AGV 航向角。
   * - ``JsonParameterSDK_GetRobotPose(file_path, param_mode, result)``
     - 读取机器人位姿。
   * - ``JsonParameterSDK_GetInclinometerPort(file_path, port_index, port)``
     - 将倾角仪端口写入调用方提供的字符缓冲区。
   * - ``JsonParameterSDK_GetContinuationSurfaceLayer(file_path, index, layer_num, surface_num)``
     - 读取指定索引的续码层数和面数。
   * - ``JsonParameterSDK_GetRobotState(file_path, result)``
     - 读取机器人状态。
   * - ``JsonParameterSDK_GetContinuationConfig(file_path, result)``
     - 读取 TXT 续码配置。
   * - ``JsonParameterSDK_GetStackStyleDiffX(file_path, index, diff_x)``
     - 读取特殊面 ``diff_x`` 补偿。
   * - ``JsonParameterSDK_GetPalletizingPatternData(file_path, index, result)``
     - 读取垛型记录。
   * - ``JsonParameterSDK_GetPalletizingPatternDataSize(file_path, count)``
     - 读取文件中的垛型记录数量，``count`` 为输出指针。

``GetContinuationSurfaceLayer`` 的头文件声明顺序是 ``layer_num`` 后 ``surface_num``。仓库 C++ demo 中变量名与传参顺序容易造成误解，集成代码应按头文件原型传递指针。

垛型缓存
~~~~~~~~

重复访问同一垛型文件时，可先加载到内存，再通过索引读取，避免每次查询都重新读取文件：

* ``JsonParameterSDK_LoadPalletizingPatternData(file_path)``：一次性加载垛型文件；
* ``JsonParameterSDK_GetPalletizingPatternDataCacheSize(count)``：获取缓存记录数；
* ``JsonParameterSDK_GetPalletizingPatternDataFromCache(index, result)``：按索引读取缓存记录；
* ``JsonParameterSDK_ClearPalletizingPatternDataCache()``：清空缓存。

这些函数返回 ``JSONPARAM_SDK_SUCCESS`` 表示成功。输出数据由调用方提供存储；索引应在读取到的记录数量范围内。

修改接口
~~~~~~~~

* ``JsonParameterSDK_InitRobotData(file_path)``：初始化机器人状态文件；
* ``JsonParameterSDK_SetJsonInt(file_path, field_name, value)``；
* ``JsonParameterSDK_SetJsonFloat(file_path, field_name, value)``；
* ``JsonParameterSDK_SetJsonString(file_path, field_name, value)``；
* ``JsonParameterSDK_ModifyJsonField(file_path, field_name, new_value_json)``：传入 JSON 值文本，可写入数字、布尔值、字符串、数组或对象。

``ModifyJsonField`` 的第三个参数使用 JSON 语法：``"123"`` 表示整数，``"true"`` 表示布尔值，``"[1,2,3]"`` 表示数组；写入字符串时，传入文本本身还须包含 JSON 双引号。

这些接口会写入配置文件。生产系统应在写入前备份并校验字段范围，避免在机器人动作执行期间无条件重置状态。

初始化与错误信息
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   int JsonParameterSDK_Initialize();
   void JsonParameterSDK_Uninitialize();
   int JsonParameterSDK_GetLastError(char* buffer, int buffer_size);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``buffer``
     - ``char*``
     - 输出
     - 调用方提供的错误文本缓冲区。
   * - ``buffer_size``
     - ``int``
     - 输入
     - 缓冲区容量；容量不足可返回 ``JSONPARAM_SDK_ERROR_BUFFER_SMALL``。

返回值：初始化返回模块错误码，释放接口返回 ``void``；错误信息接口返回成功、参数无效或缓冲区过小等状态码。初始化和释放无参数。

读取接口：完整声明
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   int JsonParameterSDK_CheckJsonFile(const char* file_path);
   int JsonParameterSDK_GetCalibration(const char* file_path, int cam_mode,
                                       CalibrationPose* result);
   int JsonParameterSDK_GetSku(const char* file_path, int sku_index, SkuData* result);
   int JsonParameterSDK_GetAgvAngle(const char* file_path, int angle_index, float* angle);
   int JsonParameterSDK_GetRobotPose(const char* file_path, int param_mode,
                                     RobotPose* result);
   int JsonParameterSDK_GetInclinometerPort(const char* file_path, int port_index,
                                            char* port);
   int JsonParameterSDK_GetContinuationSurfaceLayer(
       const char* file_path, int index, int* layer_num, int* surface_num);
   int JsonParameterSDK_GetRobotState(const char* file_path, RobotState* result);
   int JsonParameterSDK_GetContinuationConfig(const char* file_path,
                                              ContinuationConfig* result);
   int JsonParameterSDK_GetStackStyleDiffX(const char* file_path, int index,
                                          float* diff_x);
   int JsonParameterSDK_GetPalletizingPatternData(const char* file_path, int index,
                                                 PalletizingPatternData* result);
   int JsonParameterSDK_GetPalletizingPatternDataSize(const char* file_path,
                                                     int* count);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``file_path``
     - ``const char*``
     - 输入
     - 待读取 JSON 文件路径；``GetContinuationConfig`` 使用 TXT 配置路径。
   * - ``cam_mode``
     - ``int``
     - 输入
     - 手眼标定的相机模式。
   * - ``sku_index / angle_index / port_index / index``
     - ``int``
     - 输入
     - 对应 SKU、航向角、端口、续码或垛型记录的选择索引；各文件的有效范围由实际内容决定。
   * - ``param_mode``
     - ``int``
     - 输入
     - ``GetRobotPose`` 的位姿参数模式，头文件未给出取值枚举。
   * - ``result``
     - ``CalibrationPose* / SkuData* / RobotPose* / RobotState* / ContinuationConfig* / PalletizingPatternData*``
     - 输出
     - 调用方提供的对应结构体地址；具体类型见各函数签名。
   * - ``angle``
     - ``float*``
     - 输出
     - AGV 航向角结果，本函数声明未标注单位。
   * - ``port``
     - ``char*``
     - 输出
     - 倾角仪串口名称的字符缓冲区；接口没有长度参数，头文件未给出最大容量约定。
   * - ``layer_num / surface_num``
     - ``int*``
     - 输出
     - 续码层数／面数，签名顺序是先层后面。
   * - ``diff_x``
     - ``float*``
     - 输出
     - 特殊面 X 方向补偿值，单位未在该声明中标注。
   * - ``count``
     - ``int*``
     - 输出
     - 垛型记录数量；不是 JSON 文件字节大小。

上述读取接口均返回 ``int`` 模块状态码，``JSONPARAM_SDK_SUCCESS=0`` 表示成功。结果通过输出参数传回，状态码本身不是记录数量、角度或位姿值。所有 C API 均没有默认实参。

垛型缓存：参数与生命周期
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   int JsonParameterSDK_LoadPalletizingPatternData(const char* file_path);
   int JsonParameterSDK_GetPalletizingPatternDataFromCache(
       int index, PalletizingPatternData* result);
   int JsonParameterSDK_GetPalletizingPatternDataCacheSize(int* count);
   int JsonParameterSDK_ClearPalletizingPatternDataCache();

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``file_path``
     - ``const char*``
     - 输入
     - 一次性加载到缓存的垛型 JSON 路径。
   * - ``index``
     - ``int``
     - 输入
     - 缓存内记录索引；与缓存记录数量配套检查。
   * - ``result``
     - ``PalletizingPatternData*``
     - 输出
     - 调用方提供的垛型结构体地址。
   * - ``count``
     - ``int*``
     - 输出
     - 缓存记录数量。

四个函数均返回模块状态码；清理缓存接口无参数。``GetPalletizingPatternDataFromCache`` 从内存查询，因而不再接收文件路径。

写入接口：字段和值
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   int JsonParameterSDK_InitRobotData(const char* file_path);
   int JsonParameterSDK_SetJsonInt(const char* file_path, const char* field_name,
                                   int value);
   int JsonParameterSDK_SetJsonFloat(const char* file_path, const char* field_name,
                                     float value);
   int JsonParameterSDK_SetJsonString(const char* file_path, const char* field_name,
                                      const char* value);
   int JsonParameterSDK_ModifyJsonField(const char* file_path,
                                        const char* field_name,
                                        const char* new_value_json);

.. list-table::
   :header-rows: 1
   :widths: 22 24 10 44

   * - 参数
     - 类型
     - 方向
     - 说明
   * - ``file_path``
     - ``const char*``
     - 输入
     - 目标 JSON 文件路径；初始化机器人状态时也使用该参数。
   * - ``field_name``
     - ``const char*``
     - 输入
     - 要修改的字段名；头文件没有约定嵌套字段路径语法。
   * - ``value``
     - ``int / float / const char*``
     - 输入
     - 按三个 SetJson 接口分别传入整数、浮点数或普通字符串。
   * - ``new_value_json``
     - ``const char*``
     - 输入
     - JSON 值文本，可表示数字、布尔值、字符串、数组或对象；字符串值需要保留 JSON 双引号。

返回值：``int`` 模块状态码，成功为 ``0``。``InitRobotData`` 仅接收文件路径；其余函数还需要字段名与新值。

错误码
~~~~~~

.. list-table::
   :header-rows: 1
   :widths: 12 38 50

   * - 值
     - 常量
     - 含义
   * - 0
     - ``JSONPARAM_SDK_SUCCESS``
     - 成功。
   * - -1
     - ``JSONPARAM_SDK_ERROR_UNKNOWN``
     - 未知错误。
   * - -2
     - ``JSONPARAM_SDK_ERROR_INVALID_PARAM``
     - 参数无效。
   * - -3
     - ``JSONPARAM_SDK_ERROR_FILE_NOT_FOUND``
     - 文件不存在或无法打开。
   * - -4
     - ``JSONPARAM_SDK_ERROR_JSON_PARSE``
     - JSON 解析失败。
   * - -5
     - ``JSONPARAM_SDK_ERROR_JSON_EMPTY``
     - JSON 内容为空。
   * - -6
     - ``JSONPARAM_SDK_ERROR_FIELD_MISSING``
     - 缺少字段。
   * - -7
     - ``JSONPARAM_SDK_ERROR_INDEX_INVALID``
     - 索引非法。
   * - -8
     - ``JSONPARAM_SDK_ERROR_BUFFER_SMALL``
     - 输出缓冲区过小。
   * - -9
     - ``JSONPARAM_SDK_ERROR_WRITE_FAILED``
     - 文件写入失败。
   * - -10
     - ``JSONPARAM_SDK_ERROR_CONFIG``
     - TXT 配置错误。

失败后可使用 ``JsonParameterSDK_GetLastError(buffer, buffer_size)`` 读取文本错误信息。

.. _parameter-configuration:

参数与配置文件
~~~~~~~~~~~~~~

JsonSDK 使用 JSON 和 TXT 文件为装卸柜任务提供运行参数。SDK 仓库中的样例位于 ``scripts/JsonSDK/data``，包括 Keba 和 Kuka 命名的部分配置文件。

文件与接口
^^^^^^^^^^

.. list-table::
   :header-rows: 1
   :widths: 35 35 30

   * - 数据
     - 典型文件
     - 读取接口
   * - 手眼标定
     - ``Hand-eye_calibration_parameters.json``
     - ``GetCalibration``
   * - SKU
     - ``sku_data.json``
     - ``GetSku``
   * - AGV 航向角
     - ``agv_angle.json``
     - ``GetAgvAngle``
   * - 机器人位姿
     - ``setting_parameters.json`` / ``RobotPose.json``
     - ``GetRobotPose``
   * - 倾角仪端口
     - ``setting_parameters.json``
     - ``GetInclinometerPort``
   * - 机器人状态
     - ``robot_data.json``
     - ``GetRobotState`` / ``InitRobotData``
   * - 垛型
     - ``rd_demo_data_keba.json`` / ``rd_demo_data_kuka.json``
     - ``GetPalletizingPatternData``
   * - 续码
     - ``continuation_config.txt``
     - ``GetContinuationConfig``
   * - 特殊面补偿
     - ``test_demo.json``
     - ``GetStackStyleDiffX``

3.8.2 机器人状态持久化与续码
-----------------------------

``RobotState`` 与 ``ContinuationConfig`` 记录工作模式、当前面、当前层、当前动作及完成数量。发生可恢复中断时，应用应先读取并校验这些状态，再决定是否继续任务；不要在动作执行中无条件调用 ``InitRobotData``。

``JsonParameterSDK_SetJsonInt``、``JsonParameterSDK_SetJsonFloat`` 和 ``JsonParameterSDK_SetJsonString`` 会直接写入配置文件。生产环境应先备份文件、校验字段范围并记录修改来源。

3.8.3 C++ 调用例程（jsonsdk_demo.cpp）
----------------------------------------

.. code-block:: cpp

   if (JsonParameterSDK_Initialize() != JSONPARAM_SDK_SUCCESS) return -1;

   CalibrationPose pose{};
   JsonParameterSDK_GetCalibration(
       "./data/json/Hand-eye_calibration_parameters.json", 0, &pose);

   SkuData sku{};
   JsonParameterSDK_GetSku("./data/json/sku_data.json", 0, &sku);
   JsonParameterSDK_Uninitialize();

垛型缓存调用顺序
~~~~~~~~~~~~~~~~

下面的函数演示初始化、加载、遍历和清理。``file_path`` 为垛型 JSON 文件路径：

.. code-block:: cpp

   #include "CubeBraidSDK/JsonSDK/JsonParameterSDK.h"

   int read_pattern_cache(const char* file_path)
   {
       int ret = JsonParameterSDK_Initialize();
       if (ret != JSONPARAM_SDK_SUCCESS) return ret;
       ret = JsonParameterSDK_LoadPalletizingPatternData(file_path);
       int count = 0;
       if (ret == JSONPARAM_SDK_SUCCESS)
           ret = JsonParameterSDK_GetPalletizingPatternDataCacheSize(&count);
       for (int i = 0; ret == JSONPARAM_SDK_SUCCESS && i < count; ++i) {
           PalletizingPatternData record{};
           ret = JsonParameterSDK_GetPalletizingPatternDataFromCache(i, &record);
           // ret 成功时，可将 record 传入业务计算。
       }
       JsonParameterSDK_ClearPalletizingPatternDataCache();
       JsonParameterSDK_Uninitialize();
       return ret;
   }

3.8.4 Python 调用例程（jsonsdk_demo.py）
------------------------------------------

.. code-block:: python

   from jsonparameter import JsonParameterSDK

   sdk = JsonParameterSDK()
   try:
       calib = sdk.get_calibration(
           "./data/json/Hand-eye_calibration_parameters.json", cam_mode=0)
       sku = sdk.get_sku("./data/json/sku_data.json", sku_index=0)
       print(f"标定 X/Y/Z: {calib['x']}, {calib['y']}, {calib['z']}")
       print(f"SKU 尺寸: {sku['length']} x {sku['width']} x {sku['height']}")
   finally:
       sdk.close()

该片段在 ``scripts/JsonSDK`` 目录使用仓库的 ``jsonparameter.py``，查询结果为字典。当前 Python 类尚未封装上述缓存和通用字段修改接口；需要这些能力时，可按头文件声明绑定 C API，或直接使用 C++ 示例。
