from app.service.notebook import NotebookCellIterator

notebook_example_path = "tests/ressources/notebook_example.ipynb"


def test_notebookCellIterator():
    with open(notebook_example_path) as notebook_file:
        file_content = notebook_file.read()
        source_code = "\n".join(c["source"] for c in NotebookCellIterator(file_content))

    print(source_code)

    assert source_code[:14] == "def f(x: int):"
    assert source_code[15:30] == "    return x**2"
    assert source_code[30:32] == "\n\n"
    assert source_code[32:46] == "def g(x: int):"
    assert source_code[47:64] == "    return f(x)+3"
    assert source_code[-39:-20] == 'print("f(5)=",f(5))'
    assert source_code[-19:] == 'print("g(5)=",g(5))'
