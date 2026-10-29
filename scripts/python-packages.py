"""Install Python packages with verified TLS, including Macs with missing OS metadata.

Some macOS installations return an empty platform.mac_ver(). pip's truststore
backend then raises ValueError before any download. pip's supported legacy-certs
option uses its certifi CA bundle instead; certificate verification stays enabled.
"""
import ensurepip
import platform
import subprocess
import sys


def needs_legacy_certs():
    return sys.platform == 'darwin' and not platform.mac_ver()[0]


def bootstrap():
    original = ensurepip._run_pip
    if needs_legacy_certs():
        print('macOS-verzióadat hiányzik: pip tanúsítványellenőrzés certifi CA-val.', flush=True)
        # ensurepip clears PIP_* variables, so pass the supported pip option
        # directly. Its bundled wheels and --no-index offline mode are retained.
        def run_pip(args, additional_paths=None):
            return original(['--use-deprecated=legacy-certs', *args], additional_paths)
        ensurepip._run_pip = run_pip
    try:
        ensurepip.bootstrap(upgrade=True, default_pip=True)
    finally:
        ensurepip._run_pip = original


def install(requirements):
    flags = ['--use-deprecated=legacy-certs'] if needs_legacy_certs() else []
    subprocess.run([sys.executable, '-m', 'pip', 'install', *flags,
                    '--disable-pip-version-check', '-r', requirements], check=True)


if __name__ == '__main__':
    if len(sys.argv) == 2 and sys.argv[1] == 'bootstrap':
        bootstrap()
    elif len(sys.argv) == 3 and sys.argv[1] == 'install':
        install(sys.argv[2])
    else:
        raise SystemExit('Használat: python-packages.py bootstrap | install requirements.txt')
