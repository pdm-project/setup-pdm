import importlib
import os
import sys
import unittest

PACKAGE_MAP = {
    "3.8": "urllib3",
    "3.9": "certifi",
    "3.10": "pytz",
    "3.11": "setuptools",
    "3.12": "six",
}


class TestActionSuite(unittest.TestCase):
    def test_check_python_version(self):
        self.assertEqual(
            ".".join(map(str, sys.version_info[:2])),
            ".".join(os.getenv("PYTHON_VERSION").split(".")[:2]),
        )

    def test_check_dependencies(self):
        python_version = ".".join(map(str, sys.version_info[:2]))
        for package in PACKAGE_MAP.values():
            if package != PACKAGE_MAP[python_version]:
                try:
                    print(importlib.import_module(package))
                except ImportError:
                    pass
                self.assertRaises(
                    ModuleNotFoundError,
                    importlib.import_module,
                    package,
                )
            else:
                importlib.import_module(package)


if __name__ == "__main__":
    unittest.main()
