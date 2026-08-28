"""
============================================================
Ranissa Tooling SDK
Filesystem Utilities
============================================================
"""

from pathlib import Path
import shutil
import hashlib


# ============================================================
# PATHS
# ============================================================

def ensure_directory(path):

    path = Path(path)

    path.mkdir(
        parents=True,
        exist_ok=True,
    )

    return path


def exists(path):

    return Path(path).exists()


# ============================================================
# DISCOVERY
# ============================================================

def discover_files(
    directory,
    pattern="*",
    recursive=False,
):

    directory = Path(directory)

    if recursive:

        return sorted(directory.rglob(pattern))

    return sorted(directory.glob(pattern))


# ============================================================
# READ
# ============================================================

def read_text(path):

    return Path(path).read_text(
        encoding="utf-8"
    )


def read_bytes(path):

    return Path(path).read_bytes()


# ============================================================
# WRITE
# ============================================================

def write_text(path, text):

    path = Path(path)

    ensure_directory(path.parent)

    path.write_text(
        text,
        encoding="utf-8",
    )


def write_bytes(path, data):

    path = Path(path)

    ensure_directory(path.parent)

    path.write_bytes(data)


# ============================================================
# COPY
# ============================================================

def copy(src, dst):

    ensure_directory(
        Path(dst).parent
    )

    shutil.copy2(src, dst)


# ============================================================
# DELETE
# ============================================================

def delete(path):

    path = Path(path)

    if path.exists():

        path.unlink()


# ============================================================
# HASH
# ============================================================

def sha256(path):

    h = hashlib.sha256()

    with open(path, "rb") as f:

        while True:

            chunk = f.read(8192)

            if not chunk:

                break

            h.update(chunk)

    return h.hexdigest()


# ============================================================
# SIZE
# ============================================================

def file_size(path):

    return Path(path).stat().st_size


# ============================================================
# FILE NAME
# ============================================================

def filename(path):

    return Path(path).name


def stem(path):

    return Path(path).stem


def extension(path):

    return Path(path).suffix
