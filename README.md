# DocFX assistant

An extension for VS Code that provides tools for authoring content using Microsoft DocFX.

![DocFX Assistant in action](docs/images/DocFX-extension.gif)

## Usage

When your workspace contains a DocFX project, press `ctrl+shift+alt+u` to bring up a pick-list of available topic UIDs.
The first time you do this, the extension will scan your DocFX project to find all available topics. To refresh the list of available topics, use the "DocFX: Refresh topic UIDs" command.

## Installation

Since this extension is not available from the VS gallery yet, simply [download](https://github.com/tintoy/docfx-assistant/releases/latest) the VSIX package for the latest release and install it by choosing "Install from VSIX" from the menu on the top right of the extensions panel.

## Known issues

Project scanning is on-demand, and not automatically re-triggered when files change.

**Note**: In a future release, the extension will automatically start scanning and updating in the background as soon as it starts (or you open a workspace with `docfx.json` in the root directory).

Additionally, the design of this extension is a little quick-and-dirty; it works well, but the internals are a little-too-tightly coupled to the VSCode API for comfort. There are no tests either, yet.

## Questions / bug reports

If you have questions, feature requests, or would like to report a bug, please feel free to reach out by creating an issue. When reporting a bug, please try to include as much information as possible about what you were doing at the time, what you expected to happen, and what actually happened.

If you're interested in collaborating that'd be great, too :-)
