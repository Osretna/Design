import fetch from "node-fetch";

async function testHF() {
  const modelUrl = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1";
  try {
    console.log("Fetching from Hugging Face model:", modelUrl);
    const res = await fetch(modelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: "a cute cat" })
    });
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    const buffer = await res.arrayBuffer();
    console.log("Buffer length:", buffer.byteLength);
  } catch (err: any) {
    console.error("HF failed:", err.message);
  }
}

testHF();
