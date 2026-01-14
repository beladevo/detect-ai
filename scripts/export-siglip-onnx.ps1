param(
  [string]$Python = "py"
)

$ErrorActionPreference = "Stop"

$outputDir = "public/models/onnx"
$venvDir = ".venv-export"

if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

if (-not (Test-Path $venvDir)) {
  & $Python -m venv $venvDir
}

$pip = Join-Path $venvDir "Scripts\\pip.exe"
$python = Join-Path $venvDir "Scripts\\python.exe"

& $pip install --upgrade pip
& $pip install "torch" "transformers" "safetensors" "pillow" "onnxscript"

& $python "scripts\\export_siglip_onnx.py" --output $outputDir

Write-Host "ONNX export complete. Ensure $outputDir\\model.onnx exists."
