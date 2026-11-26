#!/usr/bin/env pwsh
<#
============================================================================
Script: sdd-app-start-script.ps1
Skill:  sdd-app-start
Projeto: Innovation Board (app-innovation-cards)
Propósito: Inicializar o ambiente completo da aplicação (Node.js + Express +
           Vite Middleware + WebSocket + SQLite) conforme docs/SAD.md §1,
           gravar logs detalhados em app-start.log na raiz da aplicação e
           retornar o status final do ambiente.
============================================================================
#>

param(
    [int]$Port = 3000,
    [int]$StartupTimeoutSeconds = 20,
    [string]$ProjectRoot = ""
)

$ErrorActionPreference = "Stop"

# Resolver diretório raiz do projeto
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $candidateRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..") -ErrorAction SilentlyContinue
    if ($candidateRoot -and (Test-Path (Join-Path $candidateRoot.Path "server.ts"))) {
        $ProjectRoot = $candidateRoot.Path
    } else {
        $ProjectRoot = "C:\@projetos\app-innovation-cards"
    }
}

$LogFile = Join-Path $ProjectRoot "app-start.log"
$StdoutTempLog = Join-Path $ProjectRoot ".app-start-stdout.tmp.log"
$StderrTempLog = Join-Path $ProjectRoot ".app-start-stderr.tmp.log"
$HealthUrl = "http://localhost:$Port/api/health"
$AppUrl = "http://localhost:$Port"
$WsUrl = "ws://localhost:$Port/ws"
$DbFile = Join-Path $ProjectRoot "db\innovation-board.db"

$Errors = New-Object System.Collections.Generic.List[string]
$ServerProcess = $null
$AlreadyRunning = $false

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR", "OK")]
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Test-TcpPortOpen {
    param([int]$TargetPort)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect("127.0.0.1", $TargetPort, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne(1000, $false)) {
            $client.EndConnect($async)
            return $true
        }
        return $false
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Test-HealthEndpoint {
    param([string]$Url)
    try {
        $resp = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 3 -ErrorAction Stop
        return ($null -ne $resp -and $resp.status -eq "ok")
    } catch {
        return $false
    }
}

function Merge-ProcessLogs {
    foreach ($tmp in @(@{ Label = "SERVER STDOUT"; Path = $StdoutTempLog }, @{ Label = "SERVER STDERR"; Path = $StderrTempLog })) {
        if (Test-Path $tmp.Path) {
            try {
                $content = Get-Content -Path $tmp.Path -Raw -ErrorAction SilentlyContinue
                if (-not [string]::IsNullOrWhiteSpace($content)) {
                    Add-Content -Path $LogFile -Value "`n--- $($tmp.Label) ---" -Encoding UTF8
                    Add-Content -Path $LogFile -Value $content.TrimEnd() -Encoding UTF8
                }
            } catch {
                Write-Log "Não foi possível ler o log temporário $($tmp.Path): $($_.Exception.Message)" "WARN"
            }
        }
    }
}

# Inicializar arquivo de log na raiz da aplicação
Set-Content -Path $LogFile -Value @(
    "===================================================================="
    "  INNOVATION BOARD - Log de Inicialização (sdd-app-start)"
    "  Data/Hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    "  Projeto:   $ProjectRoot"
    "  Porta:     $Port"
    "===================================================================="
) -Encoding UTF8

try {
    # ------------------------------------------------------------------------
    # ETAPA 1: Validação de diretório e pré-requisitos
    # ------------------------------------------------------------------------
    if (-not (Test-Path $ProjectRoot)) {
        $Errors.Add("Diretório do projeto não encontrado: $ProjectRoot")
        throw "Diretório do projeto inexistente."
    }

    Set-Location $ProjectRoot
    Write-Log "Diretório de trabalho definido: $ProjectRoot" "INFO"

    foreach ($cmd in @("node", "npm", "npx")) {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            $Errors.Add("Ferramenta obrigatória não encontrada no PATH: $cmd")
        }
    }

    foreach ($requiredFile in @("package.json", "server.ts", "db\db.ts")) {
        $fullPath = Join-Path $ProjectRoot $requiredFile
        if (-not (Test-Path $fullPath)) {
            $Errors.Add("Arquivo obrigatório ausente: $requiredFile")
        }
    }

    if ($Errors.Count -gt 0) {
        foreach ($e in $Errors) { Write-Log $e "ERROR" }
        throw "Falha na validação de pré-requisitos."
    }

    $nodeVersion = (& node -v 2>&1) -join ""
    Write-Log "Node.js detectado: $nodeVersion" "OK"

    # Instalar dependências se node_modules não existir
    if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
        Write-Log "Pasta node_modules ausente. Executando npm install..." "WARN"
        $installOut = & npm install 2>&1
        $installCode = $LASTEXITCODE
        if ($installOut) {
            Add-Content -Path $LogFile -Value ($installOut | Out-String) -Encoding UTF8
        }
        if ($installCode -ne 0) {
            $Errors.Add("Falha ao executar npm install (exit code $installCode).")
            Write-Log "npm install falhou com exit code $installCode." "ERROR"
            throw "Falha na instalação de dependências."
        }
        Write-Log "Dependências instaladas com sucesso." "OK"
    } else {
        Write-Log "Dependências (node_modules) presentes." "OK"
    }

    # ------------------------------------------------------------------------
    # ETAPA 2: Verificar se o servidor já está ativo na porta configurada
    # ------------------------------------------------------------------------
    if (Test-HealthEndpoint -Url $HealthUrl) {
        $AlreadyRunning = $true
        Write-Log "Servidor já estava em execução e respondendo em $HealthUrl." "OK"
    } elseif (Test-TcpPortOpen -TargetPort $Port) {
        $Errors.Add("A porta $Port já está em uso por outro processo que não responde ao healthcheck $HealthUrl.")
        Write-Log $Errors[$Errors.Count - 1] "ERROR"
        throw "Conflito de porta $Port."
    }

    # ------------------------------------------------------------------------
    # ETAPA 3: Iniciar o servidor Node.js + Express + Vite + WebSocket
    # ------------------------------------------------------------------------
    if (-not $AlreadyRunning) {
        Remove-Item -Path $StdoutTempLog, $StderrTempLog -Force -ErrorAction SilentlyContinue

        $tsxCmd = Join-Path $ProjectRoot "node_modules\.bin\tsx.cmd"
        if (Test-Path $tsxCmd) {
            $fileToRun = $tsxCmd
            $argsToRun = @("server.ts")
            Write-Log "Iniciando servidor com: $tsxCmd server.ts" "INFO"
        } else {
            $fileToRun = "cmd.exe"
            $argsToRun = @("/c", "npx tsx server.ts")
            Write-Log "Iniciando servidor com: npx tsx server.ts" "INFO"
        }

        $ServerProcess = Start-Process `
            -FilePath $fileToRun `
            -ArgumentList $argsToRun `
            -WorkingDirectory $ProjectRoot `
            -RedirectStandardOutput $StdoutTempLog `
            -RedirectStandardError $StderrTempLog `
            -WindowStyle Hidden `
            -PassThru

        Write-Log "Processo do servidor iniciado (PID: $($ServerProcess.Id)). Aguardando disponibilidade..." "INFO"

        # --------------------------------------------------------------------
        # ETAPA 4: Verificar disponibilidade (TCP + Healthcheck + SQLite)
        # --------------------------------------------------------------------
        $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
        $isHealthy = $false

        while ((Get-Date) -lt $deadline) {
            if ($ServerProcess.HasExited) {
                $Errors.Add("O processo do servidor encerrou inesperadamente (exit code $($ServerProcess.ExitCode)).")
                Write-Log $Errors[$Errors.Count - 1] "ERROR"
                break
            }

            if ((Test-TcpPortOpen -TargetPort $Port) -and (Test-HealthEndpoint -Url $HealthUrl)) {
                $isHealthy = $true
                break
            }

            Start-Sleep -Milliseconds 750
        }

        Merge-ProcessLogs

        if (-not $isHealthy -and $Errors.Count -eq 0) {
            $Errors.Add("Timeout após ${StartupTimeoutSeconds}s aguardando healthcheck em $HealthUrl.")
            Write-Log $Errors[$Errors.Count - 1] "ERROR"
        }
    }

    # Validar persistência SQLite (db/innovation-board.db)
    if ($Errors.Count -eq 0) {
        if (Test-Path $DbFile) {
            Write-Log "Banco SQLite disponível em: $DbFile" "OK"
        } else {
            $Errors.Add("Banco de dados SQLite não encontrado após inicialização: $DbFile")
            Write-Log $Errors[$Errors.Count - 1] "ERROR"
        }
    }
} catch {
    if ($Errors.Count -eq 0) {
        $Errors.Add("Erro inesperado ao iniciar o ambiente: $($_.Exception.Message)")
    }
    Write-Log "Exceção capturada: $($_.Exception.Message)" "ERROR"
    Merge-ProcessLogs
}

# ----------------------------------------------------------------------------
# ETAPA 5: Status final do ambiente
# ----------------------------------------------------------------------------
if ($Errors.Count -eq 0) {
    Write-Log "Serviços validados: HTTP ($AppUrl), WebSocket ($WsUrl), Healthcheck ($HealthUrl), SQLite ($DbFile)." "OK"
    Write-Log "STATUS FINAL: Ambiente pronto para uso" "OK"

    Write-Host ""
    Write-Host "Ambiente pronto para uso" -ForegroundColor Green
    Write-Host "  - Aplicação HTTP: $AppUrl" -ForegroundColor Cyan
    Write-Host "  - WebSocket:      $WsUrl" -ForegroundColor Cyan
    Write-Host "  - Healthcheck:    $HealthUrl" -ForegroundColor Cyan
    if ($ServerProcess -and -not $ServerProcess.HasExited) {
        Write-Host "  - PID Servidor:   $($ServerProcess.Id)" -ForegroundColor Gray
    }
    Write-Host "  - Log:            $LogFile" -ForegroundColor Gray
    exit 0
} else {
    Write-Log "STATUS FINAL: Ambiente indisponivel - Consultar log app-start.log" "ERROR"

    Write-Host ""
    Write-Host "Ambiente indisponivel - Consultar log app-start.log" -ForegroundColor Red
    exit 1
}
