# 重新加载系统环境变量
$machinePath = [System.Environment]::GetEnvironmentVariable('PATH','Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('PATH','User')

# 合并系统和用户 PATH
$env:PATH = $machinePath + ';' + $userPath

Write-Host "当前 PATH 环境变量:"
Write-Host $env:PATH

# 测试 Firebase CLI
Write-Host "`n测试 Firebase CLI:"
try {
    firebase --version
    Write-Host "Firebase CLI 工作正常!"
} catch {
    Write-Host "Firebase CLI 仍然无法识别，尝试使用完整路径:"
    C:\Users\大口海子\.npm-global\firebase.cmd --version
}