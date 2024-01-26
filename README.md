# Setup PDM for GitHub Action

A GitHub Action that installs pdm properly for all Python versions

## Why do I need this action?

Nowadays the main reason to use this action is that `actions/setup-python` [doesn't support](https://github.com/actions/setup-python/issues/587#issuecomment-1455797407) caching for PDM out of the box while `setup-pdm` does.

Historically, this action made it easier to use PDM in repos where the Python version in use was older than the Python version required by PDM. PDM requires >=3.8 but works for projects using older versions.

## Usage

Include the action in your workflow yaml:

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Setup PDM
    uses: pdm-project/setup-pdm@v4
    # You are now able to use PDM in your workflow
  - name: Install dependencies
    run: pdm install
```

You don't need `actions/setup-python` actually.

## Action Inputs

This action supports the following inputs:

| Input                      | Default               | Description                                                                                                                          |
| -------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `python-version`           | Not specified         | Version range or exact version of a Python version to use, using SemVer's version range syntax.                                      |
| `python-version-file`      | `pyproject.toml`      | File containing the Python version to use. Example: .`python-version`                                                                |
| `architecture`             | `x64`                 | The target architecture (x86, x64) of the Python interpreter.                                                                        |
| `allow-python-prereleases` | `false`               | Allow prerelease versions of Python to be installed.                                                                                 |
| `token`                    | `${{ github.token }}` | Used to pull python distributions from actions/python-versions. Since there's a default, this is typically not supplied by the user. |
| `version`                  | Not specified         | The version of PDM to install, or 'head' to install from the main branch.                                                            |
| `prerelease`               | `false`               | Allow prerelease versions of PDM to be installed                                                                                     |
| `enable-pep582`            | `false`               | Enable PEP 582 package loading globally.                                                                                             |
| `cache`                    | `false`               | Cache PDM installation.                                                                                                              |
| `cache-dependency-path`    | `pdm.lock`            | The dependency file(s) to cache.                                                                                                     |
| `update-python`            | `true`                | Whether to update the environment with the requested Python                                                                          |

## Action Outputs

This action also exposes the following outputs:

| Output           | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `python-version` | The installed Python or PyPy version. Useful when given a version range as input. |
| `python-path`    | The absolute path to the Python or PyPy executable.                               |
| `pdm-version`    | The installed PDM version.                                                        |
| `pdm-bin`        | The absolute path to the PDM executable.                                          |

## Caches

This action has a built-in cache support. You can use it like this:

```yaml
- uses: pdm-project/setup-pdm@v3
  with:
    python-version: 3.9
    cache: true
```

The default path to calculate the cache key is `./pdm.lock`, you can change it by setting the `cache-dependency-path` input.

**Using a list of file paths to cache dependencies**

```yaml
- uses: pdm-project/setup-pdm@v3
  with:
    python-version: 3.9
    cache: true
    cache-dependency-path: |
      ./pdm.lock
      ./pdm.new.lock
```

**Using a glob pattern to cache dependencies**

```yaml
- uses: pdm-project/setup-pdm@v3
  with:
    python-version: 3.9
    cache: true
    cache-dependency-path: '**/pdm.lock'
```
