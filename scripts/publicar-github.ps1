param([string]$NomeRepositorio = 'meu-casamento')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

function Executar {
    param([string]$Programa, [string[]]$Argumentos)
    & $Programa @Argumentos
    if ($LASTEXITCODE -ne 0) { throw "O comando $Programa falhou. O envio foi interrompido." }
}

if ($NomeRepositorio -notmatch '^[A-Za-z0-9_.-]+$') { throw 'Nome de repositório inválido.' }
Executar 'git' @('init', '-b', 'main')
 $remotos = @(& git remote)
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível consultar os remotos do Git.' }
if ($remotos -contains 'origin') { throw 'Já existe um remoto origin. Confira o repositório existente antes de publicar.' }

Executar 'gh' @('auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web')

Executar 'git' @('add', '--all')
Executar 'node' @('scripts/verificar-segredos.mjs')
& git diff --cached --quiet
if ($LASTEXITCODE -eq 1) { Executar 'git' @('commit', '-m', 'Publica site de casamento de Joao Paulo e Paloma') }
elseif ($LASTEXITCODE -ne 0) { throw 'Não foi possível conferir as alterações do Git.' }

Executar 'gh' @('repo', 'create', $NomeRepositorio, '--private', '--source', '.', '--remote', 'origin', '--push')
Executar 'gh' @('repo', 'view', '--json', 'url', '--jq', '.url')
