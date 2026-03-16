from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-1.5-flash")

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in allowed_origins_raw.split(",")]

app = FastAPI(title="BuildForge AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health():
    return {"status": "BuildForge AI backend running", "version": "1.0.0"}


@app.websocket("/ws/generate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        data = await websocket.receive_text()
        payload = json.loads(data)

        prompt = payload.get("prompt", "").strip()
        build_type = payload.get("type", "website")

        if not prompt:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Prompt is required"
            }))
            return

        system_context = {
            "website": "a complete modern responsive HTML website with hero, features, and footer sections",
            "tool": "a functional interactive web tool with clean UI and JavaScript logic",
            "software": "a full web application with state management and CRUD operations",
        }.get(build_type, "a complete web project")

        full_prompt = f"""Generate {system_context}.

Requirements:
- Include Tailwind CSS via CDN
- Mobile responsive design
- Professional modern layout
- Clean semantic HTML5

User request: {prompt}

Return ONLY the complete HTML code starting with <!DOCTYPE html>."""

        response = model.generate_content(full_prompt)
        html = response.text

        await websocket.send_text(json.dumps({
            "type": "chunk",
            "content": html
        }))

        await websocket.send_text(json.dumps({
            "type": "done"
        }))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": str(e)
            }))
        except Exception:
            pass
