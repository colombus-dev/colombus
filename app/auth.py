from fastapi import Security
from fastapi.security import APIKeyHeader

from app.constants import SECURITY_API_KEY_HEADER, SECURITY_API_KEY_VALUE
from app.exceptions import InvalidApiKeyException


api_key_header = APIKeyHeader(name=SECURITY_API_KEY_HEADER)


def get_api_key(
    api_key_header: str = Security(api_key_header),
) -> str:
    """Verify that the expected API key is present in the header.
    This is only useful to avoid spams as the validation is very basic.

    Args:
        api_key_header (str, optional): the APIKeyHeader security dependency.
                                        Defaults to Security(api_key_header).

    Raises:
        InvalidApiKeyException: if the API key is missing or invalid

    Returns:
        str: the validated API key
    """
    if api_key_header == SECURITY_API_KEY_VALUE:
        return api_key_header
    raise InvalidApiKeyException()
