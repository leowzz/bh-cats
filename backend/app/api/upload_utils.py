from fastapi import UploadFile


def normalize_uploads(files: UploadFile | list[UploadFile] | None) -> list[UploadFile]:
    if files is None:
        return []
    if isinstance(files, list):
        return files
    return [files]
