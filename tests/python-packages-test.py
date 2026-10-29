"""Regression tests for the macOS empty-version truststore failure."""
import importlib.util
import pathlib
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('packages',pathlib.Path(__file__).parents[1]/'scripts/python-packages.py')
packages=importlib.util.module_from_spec(spec);spec.loader.exec_module(packages)

class PackagesTest(unittest.TestCase):
    def test_empty_macos_version_uses_offline_bootstrap_and_supported_flag(self):
        calls=[]
        def runner(args, paths=None): calls.append((args,paths))
        def bootstrap(**kwargs):
            self.assertEqual(kwargs,dict(upgrade=True,default_pip=True))
            packages.ensurepip._run_pip(['install','--no-index','pip'],['bundled-wheel.whl'])
        with patch.object(packages.sys,'platform','darwin'),patch.object(packages.platform,'mac_ver',return_value=('',('', '', ''),'')),patch.object(packages.ensurepip,'_run_pip',runner),patch.object(packages.ensurepip,'bootstrap',bootstrap):
            packages.bootstrap()
            self.assertIs(packages.ensurepip._run_pip,runner)
        self.assertEqual(calls,[(['--use-deprecated=legacy-certs','install','--no-index','pip'],['bundled-wheel.whl'])])

    def test_empty_macos_version_install_keeps_certificate_verification(self):
        with patch.object(packages.sys,'platform','darwin'),patch.object(packages.platform,'mac_ver',return_value=('',('', '', ''),'')),patch.object(packages.subprocess,'run') as run:
            packages.install('requirements.txt')
        args=run.call_args.args[0]
        self.assertIn('--use-deprecated=legacy-certs',args)
        self.assertNotIn('--trusted-host',args)
        self.assertEqual(run.call_args.kwargs,dict(check=True))

    def test_normal_macos_version_uses_default_certificate_backend(self):
        with patch.object(packages.sys,'platform','darwin'),patch.object(packages.platform,'mac_ver',return_value=('15.0',('', '', ''),'')),patch.object(packages.subprocess,'run') as run:
            packages.install('requirements.txt')
        self.assertNotIn('--use-deprecated=legacy-certs',run.call_args.args[0])

if __name__=='__main__': unittest.main()
