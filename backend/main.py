from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
from supabase import create_client
import httpx
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))


@app.get("/")
def root():
    return {"message": "ScanSnap API is running 🚀"}


@app.get("/product/{barcode}")
async def get_product(barcode: str):
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    async with httpx.AsyncClient() as http:
        res = await http.get(url, timeout=30.0)
        data = res.json()

    if data.get("status") != 1:
        raise HTTPException(status_code=404, detail="Product not found")

    p = data["product"]
    nutrition = {
        "calories": p.get("nutriments", {}).get("energy-kcal_100g", "N/A"),
        "protein": p.get("nutriments", {}).get("proteins_100g", "N/A"),
        "carbs": p.get("nutriments", {}).get("carbohydrates_100g", "N/A"),
        "fat": p.get("nutriments", {}).get("fat_100g", "N/A"),
        "sugar": p.get("nutriments", {}).get("sugars_100g", "N/A"),
    }

    return {
        "type": "food",
        "barcode": barcode,
        "name": p.get("product_name", "Unknown"),
        "brand": p.get("brands", "Unknown"),
        "image": p.get("image_url", ""),
        "ingredients": p.get("ingredients_text", "Not available"),
        "nutrition": nutrition,
        "nutriscore": p.get("nutriscore_grade", "N/A"),
    }


@app.post("/ai-insight")
async def get_ai_insight(payload: dict):
    product = payload.get("product")
    if not product:
        raise HTTPException(status_code=400, detail="Product data required")

    prompt = f"""You are a nutritionist AI. Analyze this food product and give a short, helpful health insight.

Product: {product['name']} by {product['brand']}
Nutriscore: {product['nutriscore'].upper()}
Nutrition per 100g:
- Calories: {product['nutrition']['calories']} kcal
- Sugar: {product['nutrition']['sugar']}g
- Fat: {product['nutrition']['fat']}g
- Protein: {product['nutrition']['protein']}g
- Carbs: {product['nutrition']['carbs']}g

Give exactly 3 short bullet points:
1. Overall health verdict (1 sentence)
2. What to watch out for (1 sentence)
3. Who should/shouldn't consume this (1 sentence)

Keep it conversational, clear and under 80 words total. No markdown, just plain bullet points starting with •"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
    )

    return {"insight": response.choices[0].message.content}


@app.post("/scan-history")
async def save_scan(payload: dict):
    try:
        existing = supabase.table("scans")\
            .select("barcode")\
            .eq("barcode", payload.get("barcode"))\
            .order("scanned_at", desc=True)\
            .limit(1)\
            .execute()

        if not existing.data:
            supabase.table("scans").insert({
                "barcode": payload.get("barcode"),
                "name": payload.get("name"),
                "brand": payload.get("brand"),
                "image": payload.get("image"),
                "nutriscore": payload.get("nutriscore"),
                "health_score": payload.get("health_score"),
            }).execute()
        return {"status": "saved"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@app.get("/scan-history")
async def get_scan_history():
    try:
        result = supabase.table("scans")\
            .select("*")\
            .order("scanned_at", desc=True)\
            .limit(10)\
            .execute()
        return {"scans": result.data}
    except Exception as e:
        return {"scans": [], "error": str(e)}