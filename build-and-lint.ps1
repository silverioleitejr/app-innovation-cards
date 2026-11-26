#!/usr/bin/env pwsh
<#
============================================================================
Script: build-and-lint.ps1
Projeto: Innovation Board (app-innovation-cards)
Propósito: Executar lint (tsc --noEmit) e build (vite build) com relatório
           de status final colorido.
============================================================================
#>

# Configurações
$projectDir = "C:\@projetos\app-innovation-cards"
$clearHost = $true

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  INNOVATION BOARD - Lint e Build Automation" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# Mudar para o diretório do projeto
Write-Host "[1/3] Alterando para o diretório do projeto..." -ForegroundColor Yellow
Set-Location $projectDir | Out-Null

# ============================================================================
# ETAPA 1: Lint (TypeScript Check)
# ============================================================================
Write-Host "" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  ETAPA 1: Verificando Lint (tsc --noEmit)" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan

$lintResult = & npm run lint 2>&1
$lintExitCode = $LASTEXITCODE

Write-Host "" -ForegroundColor Cyan

if ($lintExitCode -eq 0) {
    Write-Host "✅ Lint PASSED - Nenhum erro de TypeScript encontrado!" -ForegroundColor Green
} else {
    Write-Host "❌ Lint FAILED - Erros de TypeScript encontrados!" -ForegroundColor Red
    Write-Host "   Execute 'npm run lint' para ver os detalhes." -ForegroundColor DarkYellow
    Write-Host ""

    # Mostrar os primeiros erros (limitado para não encher a tela)
    Write-Host "   Últimos erros encontrados:" -ForegroundColor Gray
    # Extrair linhas com erros do output
    $errorLines = $lintResult | Where-Object { $_ -match 'error TS' } | Select-Object -First 10
    if ($errorLines) {
        $errorLines | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkRed }
    } else {
        Write-Host "   (Não foi possível extrair linhas de erro)" -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "⚠️  Continuando mesmo com erros de lint... (pressione Ctrl+C para cancelar)" -ForegroundColor DarkYellow
    Read-Host "Pressione Enter para continuar ou Ctrl+C para cancelar"
}

# ============================================================================
# ETAPA 2: Build (Vite Production Build)
# ============================================================================
Write-Host "" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  ETAPA 2: Building Produção (vite build)" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan

$buildResult = & npm run build 2>&1
$buildExitCode = $LASTEXITCODE

Write-Host "" -ForegroundColor Cyan

if ($buildExitCode -eq 0) {
    Write-Host "✅ Build PASSED - Aplicação compilada com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Build FAILED - Erros durante a compilação!" -ForegroundColor Red
    Write-Host ""

    # Mostrar os erros do build
    Write-Host "   Erros da compilação:" -ForegroundColor Red
    $buildErrors = $buildResult | Where-Object { $_ -match 'error' } | Select-Object -First 20
    if ($buildErrors) {
        $buildErrors | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    } else {
        Write-Host "   (Verifique o log em: build.log)" -ForegroundColor DarkGray
    }
}

# ============================================================================
# ETAPA 3: Relatório Final de Status
# ============================================================================
Write-Host "" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  RELATÓRIO FINAL" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# Determinar status geral
if ($lintExitCode -eq 0 -and $buildExitCode -eq 0) {
    $overallStatus = "SUCESSO TOTAL"
    $overallColor = "Green"
    $statusIcon = "✅"
    $message = "Todos os passos foram concluídos com sucesso!"
    $nextStep = "A aplicação está pronta para produção."
} else {
    $overallStatus = "PARCIAL/FALHOU"
    $overallColor = "Red"
    $statusIcon = "❌"
    $message = "Alguns passos falharam. Verifique os erros acima."
    $nextStep = "Corrija os erros antes de fazer deploy."
}

Write-Host "Status Geral: $statusIcon $overallStatus" -ForegroundColor $overallColor
$lintStatus = if ($lintExitCode -eq 0) { "PASSED" } else { "FAILED" }
$buildStatus = if ($buildExitCode -eq 0) { "PASSED" } else { "FAILED" }

Write-Host "Lint:          ($lintExitCode) $lintStatus"
Write-Host "Build:         ($buildExitCode) $buildStatus"
Write-Host ""

Write-Host "--------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Corrija os erros de lint/build listados acima" -ForegroundColor White
Write-Host "  2. Reexecute este script: .\build-and-lint.ps1" -ForegroundColor White
Write-Host "  3. Ou inicie o servidor: npx tsx server.ts" -ForegroundColor White
Write-Host ""

Write-Host "Arquivos de log:" -ForegroundColor DarkGray
Write-Host "  - Erros de lint: console acima" -ForegroundColor White
Write-Host "  - Erros de build: build.log" -ForegroundColor White
Write-Host ""

if ($clearHost) {
    # Pequena pausa para o usuário ler o resultado
    Start-Sleep -Seconds 3
    
    # Limpar o console (apenas em ambientes Windows compatíveis)
    try {
        clear-host
    } catch {
        # Ignorar erro se clear-host não estiver disponível
    }
}

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  Fim do Script build-and-lint.ps1" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan