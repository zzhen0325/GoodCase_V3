#!/bin/bash

# E2E测试运行脚本
# 提供多种测试运行选项

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 显示帮助信息
show_help() {
    echo "E2E测试运行脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help              显示此帮助信息"
    echo "  -s, --smoke             运行快速冒烟测试"
    echo "  -f, --full              运行完整的综合测试"
    echo "  -a, --all               运行所有测试"
    echo "  -d, --debug             启用调试模式"
    echo "  -v, --verbose           启用详细输出"
    echo "  -k, --keep-data         保留测试数据（用于调试）"
    echo "  -p, --parallel          并行运行测试"
    echo "  -r, --report            生成HTML报告"
    echo "  -c, --clean             清理测试环境"
    echo ""
    echo "示例:"
    echo "  $0 -s                   运行快速冒烟测试"
    echo "  $0 -f -v               运行完整测试并显示详细输出"
    echo "  $0 -a -r               运行所有测试并生成报告"
    echo "  $0 -s -d -k             运行冒烟测试，启用调试并保留数据"
}

# 检查依赖
check_dependencies() {
    print_message $BLUE "检查依赖..."
    
    if ! command -v npx &> /dev/null; then
        print_message $RED "错误: 未找到 npx 命令"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        print_message $RED "错误: 未找到 package.json 文件"
        exit 1
    fi
    
    if [ ! -f "playwright.config.ts" ]; then
        print_message $RED "错误: 未找到 playwright.config.ts 文件"
        exit 1
    fi
    
    print_message $GREEN "依赖检查通过"
}

# 清理测试环境
clean_environment() {
    print_message $BLUE "清理测试环境..."
    
    # 清理测试生成的文件
    rm -rf tests/e2e/fixtures/*.png
    rm -rf tests/e2e/fixtures/*.jpg
    rm -rf tests/e2e/fixtures/*.webp
    rm -rf tests/e2e/fixtures/*.gif
    rm -rf tests/e2e/fixtures/*.txt
    
    # 清理测试报告
    rm -rf playwright-report
    rm -rf test-results
    
    print_message $GREEN "测试环境清理完成"
}

# 设置环境变量
setup_environment() {
    local debug=$1
    local verbose=$2
    local keep_data=$3
    
    print_message $BLUE "设置测试环境..."
    
    # 基础环境变量
    export NODE_ENV=test
    export API_BASE_URL=${API_BASE_URL:-"http://localhost:3000"}
    
    # 调试模式
    if [ "$debug" = true ]; then
        export DEBUG=true
        export PWDEBUG=1
        print_message $YELLOW "调试模式已启用"
    fi
    
    # 详细输出
    if [ "$verbose" = true ]; then
        export TEST_VERBOSE=true
        print_message $YELLOW "详细输出已启用"
    fi
    
    # 保留测试数据
    if [ "$keep_data" = true ]; then
        export KEEP_TEST_DATA=true
        export SKIP_CLEANUP=true
        print_message $YELLOW "测试数据将被保留"
    fi
    
    print_message $GREEN "测试环境设置完成"
}

# 运行快速冒烟测试
run_smoke_tests() {
    local parallel=$1
    local report=$2
    
    print_message $BLUE "运行快速冒烟测试..."
    
    local cmd="npx playwright test tests/e2e/quick-smoke.spec.ts"
    
    if [ "$parallel" = true ]; then
        cmd="$cmd --workers=3"
    else
        cmd="$cmd --workers=1"
    fi
    
    if [ "$report" = true ]; then
        cmd="$cmd --reporter=html"
    fi
    
    eval $cmd
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "快速冒烟测试完成 ✅"
    else
        print_message $RED "快速冒烟测试失败 ❌"
        exit 1
    fi
}

# 运行完整综合测试
run_full_tests() {
    local parallel=$1
    local report=$2
    
    print_message $BLUE "运行完整综合测试..."
    
    local cmd="npx playwright test tests/e2e/comprehensive-crud.spec.ts"
    
    if [ "$parallel" = true ]; then
        cmd="$cmd --workers=2"
    else
        cmd="$cmd --workers=1"
    fi
    
    if [ "$report" = true ]; then
        cmd="$cmd --reporter=html"
    fi
    
    eval $cmd
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "完整综合测试完成 ✅"
    else
        print_message $RED "完整综合测试失败 ❌"
        exit 1
    fi
}

# 运行所有测试
run_all_tests() {
    local parallel=$1
    local report=$2
    
    print_message $BLUE "运行所有测试..."
    
    local cmd="npx playwright test tests/e2e/"
    
    if [ "$parallel" = true ]; then
        cmd="$cmd --workers=4"
    else
        cmd="$cmd --workers=1"
    fi
    
    if [ "$report" = true ]; then
        cmd="$cmd --reporter=html"
    fi
    
    eval $cmd
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "所有测试完成 ✅"
    else
        print_message $RED "测试失败 ❌"
        exit 1
    fi
}

# 显示测试报告
show_report() {
    if [ -d "playwright-report" ]; then
        print_message $BLUE "打开测试报告..."
        npx playwright show-report
    else
        print_message $YELLOW "未找到测试报告"
    fi
}

# 主函数
main() {
    local smoke=false
    local full=false
    local all=false
    local debug=false
    local verbose=false
    local keep_data=false
    local parallel=false
    local report=false
    local clean=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -s|--smoke)
                smoke=true
                shift
                ;;
            -f|--full)
                full=true
                shift
                ;;
            -a|--all)
                all=true
                shift
                ;;
            -d|--debug)
                debug=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -k|--keep-data)
                keep_data=true
                shift
                ;;
            -p|--parallel)
                parallel=true
                shift
                ;;
            -r|--report)
                report=true
                shift
                ;;
            -c|--clean)
                clean=true
                shift
                ;;
            *)
                print_message $RED "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 如果没有指定任何测试类型，默认运行冒烟测试
    if [ "$smoke" = false ] && [ "$full" = false ] && [ "$all" = false ] && [ "$clean" = false ]; then
        smoke=true
    fi
    
    # 执行清理
    if [ "$clean" = true ]; then
        clean_environment
        exit 0
    fi
    
    # 检查依赖
    check_dependencies
    
    # 设置环境
    setup_environment $debug $verbose $keep_data
    
    # 运行测试
    if [ "$smoke" = true ]; then
        run_smoke_tests $parallel $report
    fi
    
    if [ "$full" = true ]; then
        run_full_tests $parallel $report
    fi
    
    if [ "$all" = true ]; then
        run_all_tests $parallel $report
    fi
    
    # 显示报告
    if [ "$report" = true ]; then
        show_report
    fi
    
    print_message $GREEN "测试执行完成！"
}

# 运行主函数
main "$@"