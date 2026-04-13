from app.exceptions import UnsupportedFilesException


async def get_file_contents(files, expected_file_extension):
    file_contents = []
    for file in files:
        if not file.filename.lower().endswith(expected_file_extension.lower()):
            raise UnsupportedFilesException(expected_file_extension=expected_file_extension)
        file_content = await file.read()
        file_contents.append(file_content)
    return file_contents