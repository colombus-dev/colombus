import uuid

import logfire
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
from pydantic_ai import Agent, AgentRunResult, DeferredToolRequests, Tool
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from pydantic_ai.ui.vercel_ai.response_types import BaseChunk, MessageMetadataChunk
from starlette.requests import Request
from starlette.responses import Response

from app.dependencies import DatabaseSession
from app.service.agent import AppAgentDeps, execute_pattern_matching, validate_pattern
from app.settings import get_settings

router = APIRouter()
settings = get_settings()

logfire.configure(send_to_logfire=False)
logfire.instrument_pydantic_ai()
logfire.instrument_httpx(capture_all=True)

provider = OpenAIProvider(
    base_url=f"{settings.llm_base_url}/v1", api_key=settings.llm_api_key
)
agent_model = OpenAIChatModel(settings.llm_model_name or "", provider=provider)


instructions = """\
You are an expert Data Scientist, with extensive knowledge in good practices in Machine Learning.
You work with Canopus patterns, which describes and captures good and bad practices in ML.

Here are some examples of Canopus patterns:

Boundary assertion + negative condition + multiplicity + composition (reusing a
previously defined pattern as a building block):
```canopus
pattern StartDataAcquisitionCSV = start
  -> DataAcquisitionCSV
  -> [step!="Data Preparation"]+
  -> [step="Data Modeling"]
```

Multi-condition filter on the same task:
```canopus
pattern DataAcquisitionCSV = [
  step="Data Collection",
  function="read_csv"
]
```

The supported taxonomy of ML steps is the following:
| Stage | What it covers |
|---|---|
| Data Collection | collecting/integrating data from sources |
| Data Preparation | cleaning, filtering, exploring raw data |
| Data Modeling | model planning, selection, architecture, fitting |
| Model Deployment | applying the model to unknown inputs |
| Model Evaluation | testing against held-out data / metrics |
| Save Results | serializing and persisting data for future use or analysis |


Before executing a pattern, make sure it is valid.
Provide a rational and implications for each pattern.
"""

my_agent = Agent(
    agent_model,
    deps_type=AppAgentDeps,
    # tools=[validate_pattern, execute_pattern_matching],
    output_type=[str, DeferredToolRequests],
    tools=[validate_pattern, Tool(execute_pattern_matching, requires_approval=True)],
    instructions=instructions,
    # TODO: capabilities=[LocalWorkspace("."), Skills(".agents/skills")],
)


async def on_complete(result: AgentRunResult[BaseChunk]):
    # TODO: to check
    yield MessageMetadataChunk(
        message_metadata={
            "usage": {
                "inputTokens": result.usage.input_tokens,
                "outputTokens": result.usage.output_tokens,
                "outputReasoningTokens": result.usage.output_reasoning_tokens,
            }
        }
    )


class ChatRequestContext(BaseModel):
    projectId: uuid.UUID


@router.post("/api/chat")
async def chat(
    request: Request,
    session: DatabaseSession,
) -> Response:
    # Read the custom field sent by useChat's sendMessage body option.
    try:
        payload = await request.json()
        chat_context = ChatRequestContext.model_validate(payload)
    except (ValueError, ValidationError):
        raise HTTPException(
            status_code=422,
            detail="A valid projectId is required",
        )

    deps = AppAgentDeps(
        project_id=chat_context.projectId,
        session=session,
    )

    return await VercelAIAdapter.dispatch_request(
        request,
        agent=my_agent,
        deps=deps,
        on_complete=on_complete,
        sdk_version=6,
    )
