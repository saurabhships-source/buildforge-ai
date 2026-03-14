from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("AIzaSyBXfBkXx7S5c6lkRCosHH4EHNAfqTzR1to"))

model = genai.GenerativeModel("gemini-1.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health():
    return {"status": "BuildForge AI backend running"}


@app.websocket("/ws/generate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        data = await websocket.receive_text()
        payload = json.loads(data)

        prompt = payload.get("prompt", "")

        response = model.generate_content(
            f"""
Generate a complete modern responsive HTML website.

Requirements:
- include CSS styling
- mobile responsive
- modern design
- professional layout
- hero section
- features section
- footer

Website idea:
{prompt}
"""
        )

        html = response.text

        # send as chunk
        await websocket.send_text(json.dumps({
            "type": "chunk",
            "content": html
        }))

        await websocket.send_text(json.dumps({
            "type": "done"
        }))

    except Exception as e:
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": str(e)
        }))