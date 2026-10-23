"""Fills the List of Tables/Figures/Plates page numbers and exports BHSMS_Capstone_Paper.pdf.

Run with LibreOffice's bundled Python (it has the uno module):
  "C:/Program Files/LibreOffice/program/python.exe" docs/paper/to_pdf.py
"""
import subprocess, time, uno
from pathlib import Path
from com.sun.star.beans import PropertyValue

HERE = Path(__file__).resolve().parent
DOCX = HERE / "BHSMS_Capstone_Paper.docx"
PDF = HERE / "BHSMS_Capstone_Paper.pdf"
SOFFICE = Path(uno.__file__).resolve().parent / "soffice.exe"

def prop(name, value):
    p = PropertyValue(); p.Name = name; p.Value = value
    return p

office = subprocess.Popen([str(SOFFICE), "--headless", "--invisible", "--nologo", "--norestore",
                           "--accept=socket,host=127.0.0.1,port=2002;urp;"])
try:
    resolver = uno.getComponentContext().ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", uno.getComponentContext())
    for _ in range(60):
        try:
            ctx = resolver.resolve("uno:socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext")
            break
        except Exception:
            time.sleep(1)
    desktop = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
    doc = desktop.loadComponentFromURL(DOCX.as_uri(), "_blank", 0, (prop("Hidden", True),))
    indexes = doc.getDocumentIndexes()
    for _ in range(2):  # second pass picks up page shifts caused by the first
        for i in range(indexes.getCount()):
            indexes.getByIndex(i).update()
        doc.refresh()
    print("lists updated:", indexes.getCount())
    doc.storeToURL(DOCX.as_uri(), (prop("FilterName", "MS Word 2007 XML"),))
    doc.storeToURL(PDF.as_uri(), (prop("FilterName", "writer_pdf_Export"),))
    print("pages:", doc.getCurrentController().getPropertyValue("PageCount"))
    doc.close(True)
finally:
    try:
        desktop.terminate()
    except Exception:
        pass
    office.wait(timeout=30)
print("wrote", PDF)
