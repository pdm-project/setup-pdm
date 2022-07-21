import os
import sys
import unittest
import importlib


PACKAGE_MAP = {
    "3.6": "idna",
    "3.7": "chardet",
    "3.8": "urllib3",
    "3.9": "certifi",
    "3.10": "pytz",
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
                self.assertRaises(
                    ModuleNotFoundError,
                    importlib.import_module,
                    package,
                    msg=f"Package {package} should not be installed",
                )
            else:
                importlib.import_module(package)


if __name__ == "__main__":
    unittest.main()
