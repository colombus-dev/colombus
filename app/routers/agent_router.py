# import ai
# from ai.providers.openai.protocol import OpenAIChatCompletionsProtocol
# from fastapi import APIRouter
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel

# from app.service import agent as agent_service
# from app.settings import get_settings

# router = APIRouter()
# settings = get_settings()

# provider = ai.get_provider(
#     "openai",
#     base_url=f"{settings.llm_base_url}/v1",
#     api_key=settings.llm_api_key,
#     protocol=OpenAIChatCompletionsProtocol(),
# )
# model = ai.Model(id=settings.llm_model_name, provider=provider)
# colombus_agent = ai.Agent(
#     tools=[agent_service.validate_pattern, agent_service.execute_pattern_matching]
# )


# class ChatRequest(BaseModel):
#     messages: list[ai.ui.ai_sdk.UIMessage]


# @router.post("/api/chat")
# async def chat(req: ChatRequest):
#     messages, approvals = ai.ui.ai_sdk.to_messages(req.messages)

#     async def body():
#         async with colombus_agent.run(model, messages) as stream:
#             ai.ui.ai_sdk.apply_approvals(approvals)  # resolve matching pending hook

#             async def events():
#                 async for event in stream:
#                     if (
#                         isinstance(event, ai.events.HookEvent)
#                         and event.hook.status == "pending"
#                     ):
#                         ai.defer_hook(event.hook)  # end turn here, don't block
#                     yield event

#             async for chunk in ai.ui.ai_sdk.to_sse(events()):
#                 yield chunk

#     return StreamingResponse(body(), headers=ai.ui.ai_sdk.UI_MESSAGE_STREAM_HEADERS)

import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError
from pydantic_ai import Agent, DeferredToolRequests, Tool
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.ui.vercel_ai import VercelAIAdapter
from starlette.requests import Request
from starlette.responses import Response

from app.service.agent import AppAgentDeps, execute_pattern_matching, validate_pattern
from app.settings import get_settings

router = APIRouter()
settings = get_settings()


provider = OpenAIProvider(
    base_url=f"{settings.llm_base_url}/v1", api_key=settings.llm_api_key
)
agent_model = OpenAIChatModel(settings.llm_model_name, provider=provider)


my_agent = Agent(
    agent_model,
    deps_type=AppAgentDeps,
    # tools=[validate_pattern, execute_pattern_matching],
    output_type=[str, DeferredToolRequests],
    tools=[validate_pattern, Tool(execute_pattern_matching, requires_approval=True)],
    instructions=[
        "You are an expert Data Scientist, with extensive knowledge in good practices in Machine Learning."
    ],
)


class ChatRequestContext(BaseModel):
    projectId: uuid.UUID


@router.post("/api/chat")
async def chat(request: Request) -> Response:
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
    )

    return await VercelAIAdapter.dispatch_request(
        request,
        agent=my_agent,
        deps=deps,
        sdk_version=6,
    )
