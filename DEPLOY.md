# 静态部署

部署包内的文件直接放到任意静态网站目录，保留层级。可部署在国内的对象存储静态网站、Web服务器或其它静态托管；GitHub Pages作为另一个入口保留。

字体、图标、脚本、样式、目录与二维码都在包内，页面运行不请求Google Fonts或第三方CDN。插件包与安卓下载仍指向官方魔搭来源；添加源链接保持相同源ID和地址。

1. 解压KPM-static.zip，把index.html所在目录作为站点根目录。
2. 使用HTTPS，配置正确MIME：.js为text/javascript、.css为text/css、.svg为image/svg+xml、.woff2为font/woff2。
3. 子路径部署也可用，不需要前端路由重写。请通过HTTP服务访问，不能直接双击file://页面。
4. 在手机/桌面检查标题、插件详情和“添加到KPM”链接。字体可在浏览器开发工具确认Google Sans及KPM Han（思源黑体字形子集）。
5. 此包是目录快照。更新时用项目构建器重新生成并整体替换静态文件，或配置自动构建。

本地预览：python -m http.server 8000 --directory 解压目录

中文为Adobe思源黑体CN字形，遵守保留名条款，Web子集内部名为KPM Han。英文为Google Sans。字体许可、来源与摘要见fonts目录，整体网页及依赖许可见LICENSE和vendor目录。

资源自包含避免外部字体/CDN连接问题；不同地区的可达性仍取决于实际托管网络和域名。

## 2026-10-23 KPM 迁移与网页交互验收
- 仓库迁至 https://github.com/KIGTTS/KPM，Pages 为 https://kigtts.github.io/KPM/。页脚显示 KIGTTS Package Manager。旧个人 Pages URL 返回 404；旧 GitHub 仓库链接仍由 GitHub 转至组织仓库。
- 独立维护 Expressive 样式和交互动效：按压圆角形变、状态颜色、分类入场、弹窗进出、48px 触摸目标和减少动态效果。新增构建资源版本号，目录请求重新验证，避免 Pages 缓存混用版本。
- Python 8 项通过；Playwright CLI 检查 390/1365px 亮暗和 320px 窄屏，无横向溢出或页面脚本异常；弹窗关闭、分类、复制、fallback 同页指引和减少动态效果通过。已查看稳定帧截图。
- 真机 cfc8ef16 Edge：用户手动打开浏览器后，主入口 scheme 唤起 KIGTTS 并显示友好重复源提示。详情页后续唤起被浏览器拦截，最终已验证自动显示手动添加指引；不声称每次都能强制唤起。Edge 保留原生 scheme 确认，Chrome 使用带回退的 Android Intent（Chrome 未真机验证）。
- 真机复制显示成功；下载按钮到达 Edge 的 APK 下载确认，文件名和 8.09 MB 正确，已取消下载，没有覆盖安装或清空数据。二维码解码为同一 HTTPS 源的 scheme 链接。
- 官网、仓库、模板、源目录、APK 和 13 个插件源码主页均 HTTP 200；模板未登录时引导 GitHub 登录，符合预期。
- 官方源仅更新主页/说明元数据，匿名核对成功，无缓存待传播；43 份既有包和 APK 保持不变。Pages 39924063960 成功，公开 HTML、带版本静态文件、site.json 仓库/主页及 APK 目标核对通过。
- 静态部署包 output/KPM-static-kigtts-m3e-20261023.zip，9541840 字节，SHA256 2aebdf3af1a6896d6211279e8a49df960bd64393685cf2ac8899858dcaae4062。真机截图不包含在静态部署包中。
## 2026-10-24 源图标与插件版本
- 官方源使用从KPM原标志提取的透明方框线图，保留原始框形；亮暗主题以对应图标色显示。其它图片保持原色。
- 构建器接受受限静态SVG，并验证大小、哈希与引用；10项Python回归通过。
- Chromium检查390/1365px亮暗布局、源地址复制、详情插件ID跳转、Markdown表格与净化、空目录和加载失败状态通过。公开页链接仍保留手机浏览器的系统唤起确认。
