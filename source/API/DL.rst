3.3 深度学习箱体识别与实例分割模块（DlSeg SDK）
================================================

头文件：``include/CubeBraidSDK/DL_SDK/DlSegSdk.h``

命名空间：``dlseg_sdk``；Python 封装：``scripts/DL_SDK/dlseg_sdk.py``。

DlSegSDK 加载 ONNX 实例分割模型，对输入图像中的箱体进行识别，输出目标类别、置信度、边框和掩膜。一次推理同时返回带识别框、标签及掩膜的可视化图，以及供后续图像处理使用的全局纯净掩膜。识别类别由所加载的模型决定。

3.3.1 模型与运行环境
--------------------

模型与类别文件
~~~~~~~~~~~~~~

官方 `v1.4 发布页 <https://github.com/Rossum-Robotics/cubebraid_sdk/releases/tag/v1.4>`__ 提供 ``unload.onnx`` 箱体分割模型和 Windows 依赖包。仓库中的示例使用以下工作目录结构：

.. code-block:: text

   scripts/DL_SDK/
   ├── dlseg_sdk.py
   ├── dlseg_sdk_img_demo.py
   ├── dlseg_sdk_cam_demo.py
   └── data/
       ├── models/
       │   ├── unload.onnx
       │   └── classes.txt
       └── img/
           ├── demo.png
           └── output_masks/

``unload.onnx`` 需从发布页下载；``classes.txt`` 按模型的类别 ID 顺序逐行填写类别名称。模型和类别文件不随 Git 源码目录自动生成。``net_width``、``net_height`` 应与模型导出时的输入尺寸一致。

运行依赖
~~~~~~~~

* C++：C++14、OpenCV 开发文件，以及配套的 DlSegSDK 动态库与导入库。
* Python：``numpy``、``opencv-python``，通过仓库中的 ``dlseg_sdk.py`` 加载原生动态库。
* 原生推理运行时：ONNX Runtime；使用 CUDA 时还需与发行库匹配的 NVIDIA 驱动、CUDA 和 cuDNN 运行时。
* Windows 使用 ``bin/DlSegSDK.dll`` 和 ``lib/win/DlSegSDK.lib``；Linux 使用 ``lib/linux/libDlSegSDK.so``。当前 ``lib/linux_arm`` 未提供该模块。

Python 封装默认从 SDK 根目录的 ``build/SDK_Demos`` 加载动态库。运行前须将 DlSegSDK 及其配套依赖部署到该目录，或通过 ``DlSegSDK(lib_path=...)`` 指定库文件，并配置对应的动态库搜索路径。顶层 CMake 构建不会自动完成这些运行库和模型的部署。

``use_cuda = false``（Python 为 ``0``）选择 CPU；``true``（``1``）选择 CUDA，设备由 ``cuda_id`` 指定。初始化或推理失败时应读取错误信息，再检查模型路径和运行时依赖。

模型导出
~~~~~~~~

``scripts/DL_SDK/pt_to_onnx/pt_to_onnx.py`` 使用 Ultralytics 将实例分割权重导出为 ONNX。仅在需要转换自有模型时安装 ``ultralytics``；原生 SDK 推理不通过该 Python 包执行。

.. code-block:: python

   from ultralytics import YOLO

   model = YOLO("best_11.pt")
   model.export(format="onnx")

3.3.2 初始化配置与状态码
------------------------

``SdkConfig`` 的字段及默认值如下，Python ``initialize`` 使用同名参数：

.. list-table::
   :header-rows: 1
   :widths: 28 22 50

   * - 字段
     - 默认值
     - 用途
   * - ``model_path``
     - 空字符串
     - ONNX 模型文件路径。
   * - ``class_names_path``
     - 空字符串
     - 类别名称文本文件路径，每行一个名称。
   * - ``use_cuda`` / ``cuda_id``
     - ``true`` / ``0``
     - 是否使用 CUDA，以及 GPU 设备编号。
   * - ``warm_up``
     - ``true``
     - 初始化时执行模型预热。
   * - ``net_width`` / ``net_height``
     - ``640`` / ``640``
     - 模型输入宽高，单位为像素。
   * - ``class_threshold``
     - ``0.25``
     - 类别置信度阈值。
   * - ``nms_threshold``
     - ``0.45``
     - 非极大值抑制阈值。
   * - ``mask_threshold``
     - ``0.5``
     - 掩膜二值化阈值。
   * - ``batch_size``
     - ``1``
     - 推理批大小。

仓库图片示例使用 ``class_threshold=0.94``、``mask_threshold=0.25``，摄像头示例使用 ``class_threshold=0.25``、``mask_threshold=0.25``；这些是示例配置，不是接口默认值。

``StatusCode`` 定义如下：

.. list-table::
   :header-rows: 1
   :widths: 12 42 46

   * - 值
     - 枚举
     - 含义
   * - 0
     - ``SUCCESS``
     - 执行成功。
   * - 1
     - ``MODEL_LOAD_FAILED``
     - 模型加载失败。
   * - 2
     - ``INFERENCE_FAILED``
     - 模型推理失败。
   * - 3
     - ``INVALID_PARAMETER``
     - 参数无效。
   * - 4
     - ``POINT_CLOUD_FAILED``
     - 点云处理错误。
   * - 5
     - ``ALGORITHM_FAILED``
     - 算法处理失败。
   * - 99
     - ``INTERNAL_ERROR``
     - 内部错误。

C++ 使用 ``getLastError()``、``getLastStatus()`` 和 ``statusToString(status)`` 查询诊断信息；Python 使用 ``get_last_error()`` 和 ``get_last_status()``。模型加载采用异步方式，仓库示例说明 ``detect`` 会等待加载完成；示例中的两秒等待用于推理计时准备，不是调用接口的必要步骤。

3.3.3 检测接口与结果输出
------------------------

C++ 接口
~~~~~~~~

.. code-block:: cpp

   StatusCode initialize(const SdkConfig& config);
   StatusCode detect(cv::Mat& img, std::vector<OutputParams>& output,
                     cv::Mat& canvas, cv::Mat& mask_img);
   StatusCode SaveMask(cv::Mat& img, const std::vector<OutputParams>& result,
                       const std::string& save_path,
                       const std::string& file_name);

``OutputParams`` 包含类别 ``id``、置信度 ``confidence``、轴对齐矩形 ``box``、旋转矩形 ``rotatedBox`` 和框内掩膜 ``boxMask``。矩形坐标与尺寸使用图像像素单位。``SaveMask`` 按识别结果提取并保存掩膜图片；保存 ``detect`` 返回的全局掩膜则可直接使用 ``cv::imwrite``。

Python 接口
~~~~~~~~~~~

.. code-block:: python

   count, boxes, rendered_img, mask_img = segmenter.detect(img, max_boxes=100)
   status = segmenter.save_mask(img, boxes, save_path, file_name)

输入 ``img`` 使用 OpenCV 的 BGR 三通道 ``uint8`` 图像，形状为 ``(height, width, 3)``。封装内部将输入转换为连续内存。返回值说明如下：

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - 返回项
     - 含义
   * - ``count``
     - 非负数表示检测到的目标数量，``0`` 表示无目标；负数表示失败。它不是 C++ ``StatusCode``。
   * - ``boxes``
     - ``DlSegBox`` 列表，包含 ``id``、``confidence``、``x/y/width/height`` 和 ``class_name``；最多复制 ``max_boxes`` 个目标，默认上限为 50。
   * - ``rendered_img``
     - 形状为 ``(height, width, 3)`` 的 ``uint8`` 可视化图，包含识别框、标签和掩膜。
   * - ``mask_img``
     - 形状为 ``(height, width)`` 的 ``uint8`` 全局纯净掩膜，不含文字和识别框，不是深度图。

Python 目标结构不单独返回 C++ 的 ``rotatedBox`` 和 ``boxMask``；可视化图与全局掩膜通过独立数组返回。使用上下文管理器时自动创建和销毁句柄；手动管理时依次调用 ``create()``、``initialize()``、``detect()``、``destroy()``。

3.3.4 C++ 调用例程（dlseg_sdk_demo.cpp）
--------------------------------------------------------------------------

顶层 CMake 创建 ``dlseg_sdk_demo`` 目标，输出到 ``build/SDK_Demos``。原示例读取 ``./data/models/unload.onnx``、``classes.txt`` 和 ``./data/img/demo.png``，输出可视化图 ``result_mask.png`` 与全局掩膜 ``global_pure_mask.png``。运行前准备对应工作目录和输出目录。

以下最小示例使用 CPU 推理，将两种输出保存到当前目录：

.. code-block:: cpp

   #include <iostream>
   #include "CubeBraidSDK/DL_SDK/DlSegSdk.h"

   int main()
   {
       dlseg_sdk::DlSegSdk segmenter;
       dlseg_sdk::SdkConfig config;
       config.model_path = "./data/models/unload.onnx";
       config.class_names_path = "./data/models/classes.txt";
       config.use_cuda = false;
       if (segmenter.initialize(config) != dlseg_sdk::StatusCode::SUCCESS) {
           std::cerr << segmenter.getLastError() << '\n';
           return 1;
       }

       cv::Mat image = cv::imread("./data/img/demo.png");
       if (image.empty()) return 1;
       std::vector<dlseg_sdk::OutputParams> targets;
       cv::Mat rendered, mask;
       if (segmenter.detect(image, targets, rendered, mask)
           != dlseg_sdk::StatusCode::SUCCESS) {
           std::cerr << segmenter.getLastError() << '\n';
           return 1;
       }
       std::cout << "目标数量: " << targets.size() << '\n';
       const bool image_saved = cv::imwrite("recognition.png", rendered);
       const bool mask_saved = cv::imwrite("mask.png", mask);
       return image_saved && mask_saved ? 0 : 1;
   }

3.3.5 Python 图片分割例程（dlseg_sdk_img_demo.py）
--------------------------------------------------------------------------

在 ``scripts/DL_SDK`` 目录运行。下面的片段使用上下文管理器释放句柄，保存可视化图和全局掩膜；先按本节运行环境部署原生库与模型：

.. code-block:: python

   from pathlib import Path
   import cv2
   from dlseg_sdk import DlSegSDK

   image = cv2.imread("./data/img/demo.png")
   if image is None:
       raise RuntimeError("无法读取输入图像")
   output = Path("./data/img/output_masks")
   output.mkdir(parents=True, exist_ok=True)

   with DlSegSDK() as segmenter:
       status = segmenter.initialize(
           model_path="./data/models/unload.onnx",
           class_names_path="./data/models/classes.txt",
           use_cuda=0)
       if status != 0:
           raise RuntimeError(segmenter.get_last_error())
       count, boxes, rendered, mask = segmenter.detect(image, max_boxes=100)
       if count < 0:
           raise RuntimeError(segmenter.get_last_error())
       print(f"目标数量: {count}")
       for box in boxes:
           print(box)
       if not cv2.imwrite(str(output / "recognition.png"), rendered):
           raise RuntimeError("可视化图保存失败")
       if not cv2.imwrite(str(output / "mask.png"), mask):
           raise RuntimeError("掩膜图保存失败")

原仓库示例默认使用 CUDA，输出 ``python_rotated_mask_result.png`` 和 ``global_pure_segmentation_mask.png``。模型、类别文件和图片路径相对于启动程序时的工作目录解析。

3.3.6 Python 摄像头实时分割例程（dlseg_sdk_cam_demo.py）
--------------------------------------------------------------------------

摄像头示例使用 ``cv2.VideoCapture(0)`` 打开视频设备，申请 1280×720 分辨率；实际输出尺寸由设备决定。模型初始化后循环读取 BGR 图像，执行 ``detect``，在可视化图上显示目标数量和分割结果。按 ``q`` 或 ``Esc`` 退出，结束时释放摄像头并关闭窗口。

完成模型和运行库部署后，在 ``scripts/DL_SDK`` 执行：

.. code-block:: console

   python dlseg_sdk_cam_demo.py

实时示例使用本机视频设备，不直接连接工业 3D 相机。无图形界面的环境可使用图片分割示例保存结果；接入其他图像源时，先转换为 BGR 三通道 ``uint8`` 图像，再调用同一检测接口。
