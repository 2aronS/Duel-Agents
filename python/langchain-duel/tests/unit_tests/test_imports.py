from langchain_duel import __all__

EXPECTED_ALL = ["ChatDuel", "__version__"]


def test_all_imports() -> None:
    assert sorted(EXPECTED_ALL) == sorted(__all__)
