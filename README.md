# CubeBraid 装卸柜机器人技术文档

本仓库使用 Sphinx 和 Read the Docs 主题构建 CubeBraid 装卸柜机器人技术文档网站。页面内容围绕 `cubebraid_sdk` 的公开头文件、C++ demo、Python ctypes 封装和参数样例整理。

## 文档构建环境

需要 Python 3.11 或更高版本，以及 Sphinx 依赖：

```powershell
python -m venv cubebraiddoc

# 激活
cubebraiddoc\Scripts\activate

# 安装依赖（仅安装一次）
python -m pip install -r requirements.txt -c constraints.txt
```


## 构建 HTML

```powershell
python -m sphinx -E -W -b html -c . source build\html
```

生成结果位于 `build\html`，使用项目内置的禁缓存 HTTP 服务预览：

```powershell
python serve_docs.py --host localhost --port 8000 --directory build\html
```

浏览器访问 <http://localhost:8000>。


## CubeBraid SDK

SDK 源码和二进制文件请从官方仓库获取：

<https://github.com/Rossum-Robotics/cubebraid_sdk>

SDK 仓库包含 `include`、`lib`、`bin`、`src`、`scripts` 和 `doc` 目录。Windows 导入库位于 `lib/win`，DLL 位于 `bin`，Linux 动态库位于 `lib/linux`；`lib/linux_arm` 提供部分 ARM 模块。工程使用 C++14 和 OpenCV，Linux 构建还依赖 PCL、OpenMP、Protobuf 和 Snap7。完整安装说明见网站“2.1 安装与构建”。

SDK 参考包括 AGV、Camera、DlSeg 实例分割、Kawasaki 运动学、Robot、PLC、Sensor、Json 和 Logger 九个模块。模型与配套依赖下载见 [官方 Releases](https://github.com/Rossum-Robotics/cubebraid_sdk/releases)；当前文档接口核对基于提交 `070f3db64968a7064a9104e258ba83b3255acb3c`。

## 目录说明

* `source/`：Sphinx 文档源文件；
* `source/API/`：按模块整理的 API 页面；
* `source/Guides/`：装卸柜工作流、配置、安全和部署指南；
* `conf.py`：项目、主题和构建配置；
* `build/`：HTML 输出目录，不提交到 Git。

## Ubuntu 开机自启动

以下是 systemd 服务模板。创建服务前，将 `YOUR_LINUX_USER` 替换为实际的 Linux 用户名，并将所有 `/ABSOLUTE/PATH/TO/cubebraid_documentation` 替换为本仓库的实际绝对路径。该用户需要能读取已构建的 `build/html`，且仓库内已创建 `cubebraiddoc` 虚拟环境。

```bash
# 创建 systemd 服务
sudo gedit /etc/systemd/system/cubebraiddoc.service
```

`cubebraiddoc.service` 文件内容如下：

```bash
[Unit]
Description=CubeBraid Documentation HTTP Server
After=network.target

[Service]
Type=simple
User=YOUR_LINUX_USER
WorkingDirectory=/ABSOLUTE/PATH/TO/cubebraid_documentation
ExecStart=/ABSOLUTE/PATH/TO/cubebraid_documentation/cubebraiddoc/bin/python -m http.server 8000 --bind 0.0.0.0 --directory /ABSOLUTE/PATH/TO/cubebraid_documentation/build/html
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

替换模板中的用户名和路径后，执行以下命令：

```bash
# 让 systemd 重新读取配置
sudo systemctl daemon-reload

# 设置开机自动启动
sudo systemctl enable cubebraiddoc.service

# 立即启动
sudo systemctl start cubebraiddoc.service

# 检查服务状态
sudo systemctl status cubebraiddoc.service

# 浏览器访问
http://localhost:8000
```
