# Setup PDM for GitHub Action

A GitHub Action that installs pdm properly for all Python versions

## Usage

Include the action in your workflow yaml file with the following arguments:

```yaml
steps:
    ...
    - uses: pdm-project/setup-pdm@v1
      name: Setup PDM
      with:
        python-version: 3.8  # Version range or exact version of a Python version to use, the same as @action/setup-python
        architecture: x64  # The target architecture (x86, x64) of the Python interpreter. the same as @action/setup-python
        version: 1.4.0  # The version of PDM to install. Leave it as empty to use the latest version from PyPI
    - name: Install dependencies
      run: pdm install -d   # Then you can use pdm in the following steps.
    ...
```

You don't need `@action/setup-python` actually.
