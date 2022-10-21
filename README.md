# Setup PDM for GitHub Action

A GitHub Action that installs pdm properly for all Python versions

## Why do I need this action?

As you know, PDM requires Python 3.7 and higher to install the package, while till now(March 2021) Python 3.6 is still widely used by many libraries. The version requirement will prevent potential users from adopting PDM. However, it is a misunderstanding, PDM CAN run projects using Python 3.6 or even Python 2!
But it is still not obvious and it is a pain for developers to properly build their CI workflows. So I made `pdm-project/setup-pdm` to solve the problem. It is PDM-for-CI done right!

## Usage

Include the action in your workflow yaml file with the following arguments:

```yaml
steps:
    ...
    - uses: pdm-project/setup-pdm@main
      name: Setup PDM
      with:
        python-version: 3.9  # Version range or exact version of a Python version to use, the same as actions/setup-python
        architecture: x64    # The target architecture (x86, x64) of the Python interpreter. the same as actions/setup-python
        version: 1.4.0       # The version of PDM to install. Leave it as empty to use the latest version from PyPI, or 'head' to use the latest version from GitHub
        prerelease: true     # Allow prerelease versions to be installed
        enable-pep582: true  # Enable PEP 582 package loading globally
    - name: Install dependencies
      run: pdm install       # Then you can use pdm in the following steps.
    ...
```

You don't need `actions/setup-python` actually.

## Action Outputs

This action also exposes the following outputs:

```yaml
outputs:
  python-version:
    description: "The installed Python or PyPy version. Useful when given a version range as input."
  python-path:
    description: "The absolute path to the Python or PyPy executable."
  pdm-version:
    description: "The installed PDM version."
  pdm-bin:
    description: "The absolute path to the PDM executable."
```
