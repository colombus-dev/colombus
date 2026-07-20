from fastapi import HTTPException, status


class AuthException(HTTPException):
    def __init__(self, name) -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"{name} auth failed."
        )


class ElementNotFoundException(HTTPException):
    def __init__(self, element_name: str) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{element_name.capitalize()} not found.",
        )


class UnsupportedFilesException(HTTPException):
    def __init__(self, expected_file_extension) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported files. Expected file extension is {expected_file_extension}.",
        )


class UnsupportedTaxonomyException(HTTPException):
    def __init__(self, allowed_taxonomies: list[str] | None = None) -> None:
        detail = "Unsupported taxonomy."
        if allowed_taxonomies:
            formatted_taxonomies = "\n".join(f"• {t}" for t in allowed_taxonomies)
            detail += f"\n\nExpected values:\n{formatted_taxonomies}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class InvalidPatternDefinitionException(HTTPException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pattern definition.",
        )
