$port = 5174
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $root
Write-Host "芽时 Focus 开发服务已启动"
Write-Host "电脑访问: http://127.0.0.1:$port/index.html"
Write-Host "手机访问: 请把 127.0.0.1 换成电脑的 Wi-Fi IPv4 地址"
Write-Host "停止服务: 在这个窗口按 Ctrl+C"

python -m http.server $port --bind 0.0.0.0
