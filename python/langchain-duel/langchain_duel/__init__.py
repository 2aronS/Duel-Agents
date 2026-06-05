from importlib import metadata

from langchain_duel.chat_models import ChatDuel

try:
    __version__ = metadata.version(__package__)
except metadata.PackageNotFoundError:
    __version__ = ""
del metadata

__all__ = ["ChatDuel", "__version__"]
