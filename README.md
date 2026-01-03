# Pink Parquet Opener

Open `.parquet` files directly in Pink Parquet viewer from VS Code.

## Features

- Right-click any `.parquet` file to open in Pink Parquet
- Works in Windows, WSL, and macOS environments
- Configurable executable path
- Status bar integration

## Requirements

- Pink Parquet must be installed on your system
- Default installation paths:
  - Windows: `C:\Program Files\Pink Parquet\pinkparquet.exe`
  - macOS: `/Applications/Pink Parquet.app`

## Extension Settings

This extension contributes the following settings:

* `pinkParquet.executablePath`: Set the path to Pink Parquet executable

## Usage

1. Right-click any `.parquet` file in the Explorer
2. Select "Open in Pink Parquet"
3. The file will open in Pink Parquet viewer

## Known Issues

- WSL2 paths are automatically converted to Windows paths

## Release Notes

### 0.1.0

Initial release of Pink Parquet Opener