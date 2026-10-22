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
