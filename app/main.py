import json

from pathlib import Path

from fastapi import FastAPI, UploadFile
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.models.model import Base
from app.utils.save_notebook_sql import save_notebook_as_sql
from app.utils.convert_ppm_to_sql import convert_ppm_to_sql_query

app = FastAPI()


engine = create_engine(
    "mysql+pymysql://christopher:pinta@colombus_mysql:3306/colombusdb",
    echo=False,
)
# engine = create_engine("sqlite:///db.sqlite", echo=False)

Base.metadata.create_all(engine)


@app.post("/api/profile/import")
async def import_profile(profile_files: list[UploadFile]):
    for profile_file in profile_files:
        profile_path = Path(profile_file.filename)
        profile_content = await profile_file.read()
        profile = json.loads(profile_content)
        save_notebook_as_sql(profile_path.stem, profile, engine)
    return {"status": "ok"}


@app.post("/app/ppm/execute")
async def execute_ppm(ppm_file: UploadFile) -> list[str]:
    ppm_content = await ppm_file.read()
    ppm = json.loads(ppm_content)
    query = convert_ppm_to_sql_query(ppm)
    with Session(engine) as session:
        return [r[0] for r in session.execute(text(query)).all()]
