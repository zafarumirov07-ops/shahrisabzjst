# Tanlangan postlarning rasmlarini siqadi (maks. 1600px, JPEG 80%) -> "tg excport\_out"
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $root 'tg excport'
$out = Join-Path $dir '_out'
New-Item -ItemType Directory -Force $out | Out-Null

$sel = Get-Content (Join-Path $dir '_selected.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 80L

$done = 0; $bytesIn = 0; $bytesOut = 0
foreach ($p in $sel) {
  $i = 0
  foreach ($rel in $p.photos) {
    $i++
    $src = Join-Path $dir ($rel -replace '/', '\')
    $dst = Join-Path $out ("{0}-{1}.jpg" -f $p.id, $i)
    if (-not (Test-Path -LiteralPath $src)) { Write-Output "YO'Q: $rel"; continue }
    if (Test-Path -LiteralPath $dst) { $done++; continue }
    $img = [System.Drawing.Image]::FromFile($src)
    try {
      $scale = [Math]::Min(1.0, 1600.0 / [Math]::Max($img.Width, $img.Height))
      $w = [int]($img.Width * $scale); $h = [int]($img.Height * $scale)
      $bmp = New-Object System.Drawing.Bitmap $w, $h
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = 'HighQualityBicubic'
      $g.Clear([System.Drawing.Color]::White)
      $g.DrawImage($img, 0, 0, $w, $h)
      $g.Dispose()
      $bmp.Save($dst, $enc, $ep)
      $bmp.Dispose()
    } finally { $img.Dispose() }
    $bytesIn += (Get-Item -LiteralPath $src).Length
    $bytesOut += (Get-Item -LiteralPath $dst).Length
    $done++
  }
}
"Rasmlar tayyor: $done ta;  hajm: {0:N1} MB -> {1:N1} MB" -f ($bytesIn / 1MB), ($bytesOut / 1MB)
