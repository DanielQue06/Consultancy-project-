import sqlite3, os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from chromadb.utils import embedding_functions
import ollama

# ── Config ───────────────────────────────────────────────────
DB_PATH    = r"C:\Projects\Consultancy-project-\shared\borgwarner_threats.db"
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
MODEL      = "llama3.2:3b"

# ── App setup ────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── ChromaDB ─────────────────────────────────────────────────
chroma   = chromadb.PersistentClient(path=CHROMA_DIR)
embed_fn = embedding_functions.DefaultEmbeddingFunction()

def get_collection():
    return chroma.get_or_create_collection("threats", embedding_function=embed_fn)

# ── Serve HTML ───────────────────────────────────────────────
@app.get("/")
def home():
    html_path = os.path.join(os.path.dirname(__file__), "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

# ── Chat ─────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: list = []

@app.post("/chat")
def chat(req: ChatRequest):

    # ── STEP 1: Check if greeting ──
    greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "howdy"]
    is_greeting = req.message.strip().lower() in greetings

    if is_greeting:
        context = ""
    else:
        # ── STEP 2: Search ChromaDB for relevant threats ──
        results = get_collection().query(query_texts=[req.message], n_results=5)
        docs    = results["documents"][0] if results["documents"] else []
        context = "\n\n".join(docs) if docs else ""

    # ── STEP 3: Check if user wants simpler explanation ──
    rephrase_words = ["don't understand", "didnt understand", "didn't understand",
                      "explain again", "simpler", "what does that mean",
                      "too complicated", "confusing", "clarify", "not clear"]
    needs_rephrase = any(word in req.message.lower() for word in rephrase_words)

    # ── STEP 4: Build the system prompt ──
    # This is INSIDE the chat function so needs_rephrase is available!
    system = f"""You are the BorgWarner Help Chatbot, an enterprise-grade cybersecurity
intelligence assistant for BorgWarner's Cyber Intelligence Dashboard.

YOUR ROLE:
Provide precise, professional threat intelligence based exclusively on
BorgWarner's internal security database. You assist security analysts,
engineers, and executives with actionable threat insights.

RESPONSE GUIDELINES:
- Respond in a professional, concise manner appropriate for enterprise security operations
- Keep responses to 3-5 lines unless detail is specifically requested
- Always include CVE ID, Severity level, and CVSS Score when available
- Flag active exploits with: ⚠️ ACTIVE EXPLOIT CONFIRMED
- Present data in a structured, readable format
- Never include raw database notes like "(available in BorgWarner threat database)"

HANDLING REPHRASE REQUESTS (rephrase requested = {needs_rephrase}):
- Reframe the same intelligence using clearer terminology
- Provide a brief analogy if it aids understanding
- Maintain professional tone throughout

GREETING RESPONSE:
Reply with exactly one line:
"Good day. I am the BorgWarner Help Chatbot. How may I assist you with threat intelligence today?"

WHEN ASKED ABOUT A SPECIFIC COMPONENT OR SYSTEM (e.g. TC377, ECU, CAN Bus):
- Search the available database context carefully for any related threats
- If found: present the relevant threat intelligence professionally
- If not found: respond with exactly:
  "No threat intelligence records currently exist for that specific component
   in the BorgWarner database. For further investigation, please consult
   the BorgWarner security team or submit a formal threat assessment request."

OUT OF SCOPE QUERIES:
Respond with exactly:
"This query falls outside the scope of BorgWarner's threat intelligence database.
 Please direct general cybersecurity enquiries to the appropriate security team."

DATABASE CONTEXT:
{context if context else "No relevant threat records found for this query."}"""

    # ── STEP 5: Stream the response from Ollama ──
    def stream():
        messages = [{"role": "system", "content": system}]

        # Only include last 4 messages of history
        for h in req.history[-4:]:
            messages.append(h)

        messages.append({"role": "user", "content": req.message})

        for chunk in ollama.chat(model=MODEL, messages=messages, stream=True):
            yield chunk["message"]["content"]

    return StreamingResponse(stream(), media_type="text/plain")

# ── Ingest ───────────────────────────────────────────────────
@app.post("/ingest")
def ingest():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM threats").fetchall()
        conn.close()

        c = get_collection()
        existing = c.get()
        if existing["ids"]:
            c.delete(ids=existing["ids"])

        docs, metas, ids = [], [], []

        for row in rows:
            r = dict(row)

            # Clean description — remove raw database notes
            description = str(r.get('description', 'N/A'))
            description = description.replace('(available in BorgWarner threat database)', '').strip()

            doc = f"""Title: {r.get('title','N/A')}
CVE ID: {r.get('cve_id','N/A')}
Severity: {r.get('severity','N/A')}
CVSS Score: {r.get('cvss_score','N/A')}
Description: {description}
Component Affected: {r.get('component_affected','N/A')}
Source: {r.get('source','N/A')}
Date Published: {r.get('date_published','N/A')}
Exploit Confirmed: {'YES - ACTIVE EXPLOIT' if r.get('exploit_confirmed') else 'No'}
Exploit Detail: {r.get('exploit_detail','N/A')}
Threat Actor: {r.get('exploiter_name','N/A')}
Actor Group: {r.get('exploiter_group','N/A')}
Actor Country: {r.get('exploiter_country','N/A')}"""

            docs.append(doc)
            metas.append({
                "id":       str(r.get("id", "")),
                "severity": str(r.get("severity", "")),
                "cve_id":   str(r.get("cve_id", ""))
            })
            ids.append(f"threat_{r['id']}")

        for i in range(0, len(docs), 100):
            c.add(documents=docs[i:i+100], metadatas=metas[i:i+100], ids=ids[i:i+100])

        return {"status": "ok", "ingested": len(docs)}

    except Exception as e:
        print(f"INGEST ERROR: {e}")
        raise HTTPException(500, str(e))

# ── Stats ────────────────────────────────────────────────────
@app.get("/stats")
def stats():
    try:
        conn = sqlite3.connect(DB_PATH)
        cur  = conn.cursor()
        total    = cur.execute("SELECT COUNT(*) FROM threats").fetchone()[0]
        sev      = dict(cur.execute("SELECT severity, COUNT(*) FROM threats GROUP BY severity").fetchall())
        exploits = cur.execute("SELECT COUNT(*) FROM threats WHERE exploit_confirmed=1").fetchone()[0]
        recent   = cur.execute("SELECT title, severity, cve_id FROM threats ORDER BY date_scraped DESC LIMIT 5").fetchall()
        conn.close()
        return {
            "total":    total,
            "severity": sev,
            "exploits": exploits,
            "vectors":  get_collection().count(),
            "recent":   [{"title": r[0], "severity": r[1], "cve": r[2]} for r in recent]
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/generate-report")
def generate_report():
    from report_generator.report_generator import generate_html_report
    generate_html_report()
    return {"status": "ok"}

# ── Run ──────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)