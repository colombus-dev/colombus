from fastapi import HTTPException, status


class InvalidApiKeyException(HTTPException):

    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API KEY. Please contact project members.",
            headers={"WWW-Authenticate": "ApiKeyAuth"},
        )


class ElementNotFoundException(HTTPException):

    def __init__(self, element_name: str) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{element_name.capitalize()} not found.",
        )


class UnsupportedFilesException(HTTPException):

    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported files. Expected files extension is .ipynb",
        )
