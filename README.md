# Pink Parquet Opener

Open `.parquet` and `.csv` files directly in Pink Parquet viewer from VS Code.

## Features

- Right-click any `.parquet` or `.csv` file to open in Pink Parquet
- Works in Windows, WSL, macOS, and Linux (Ubuntu) environments
- Configurable executable path
- Status bar integration

## Requirements

- [Pink Parquet](https://pinkparquet.com) must be installed on your system
- Default installation paths:
  - Windows: `C:\Program Files\Pink Parquet\pinkparquet.exe`
  - macOS: `/Applications/Pink Parquet.app`
  - Linux: `/usr/bin/pinkparquet`

## Extension Settings

This extension contributes the following settings:

* `pinkParquet.executablePath`: Set the path to Pink Parquet executable

## Usage

1. Right-click any `.parquet` or `.csv` file in the Explorer
2. Select "Open in Pink Parquet"
3. The file will open in Pink Parquet viewer

## Release Notes

### 0.4.0

- Added support for CSV files

### 0.3.0

- Added support for native Linux (Ubuntu)

### 0.2.0

- Added support for macOS

### 0.1.0

Initial release of Pink Parquet Opener