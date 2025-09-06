import { createServerFn } from "@tanstack/react-start";
import { setHeader } from "@tanstack/react-start/server";
import z from "zod";
import { OpenAI } from "openai";

export interface HoroscopeData {
  signo: string;
  emoji: string;
  periodo: string;
  preview: string;
  completo: string;
}

export interface HoroscopeResponse {
  success: boolean;
  data: {
    date: string;
    signo: HoroscopeData;
    fallback?: boolean;
    astronomicalData?: {
      sunPosition: {
        rightAscension: number;
        declination: number;
        constellation: string;
      };
    };
  };
}

// 🔑 Suas credenciais do AstronomyAPI
const APP_ID = process.env.ASTRO_API_ID!;
const APP_SECRET = process.env.ASTRO_API_SECRET!;
const AUTH = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString("base64");

const mapaIdsParaNomes: Record<string, string> = {
  sun: "Sol",
  moon: "Lua",
  mercury: "Mercúrio",
  venus: "Vênus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
};

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

async function fetchWithCache(
  url: string,
  options: RequestInit
): Promise<Response> {
  const now = Date.now();

  // Create cache key by removing the time parameter to cache by date only
  const urlObj = new URL(url);
  const cacheKey = `${urlObj.origin}${urlObj.pathname}?${urlObj.searchParams.get("longitude")}&${urlObj.searchParams.get("latitude")}&${urlObj.searchParams.get("elevation")}&${urlObj.searchParams.get("from_date")}&${urlObj.searchParams.get("to_date")}`;

  const cached = cache.get(cacheKey);

  // Return cached response if valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch new data
  const response = await fetch(url, options);

  if (response.ok) {
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: now });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return response;
}

// Função para converter RA/Dec para longitude eclíptica e signo zodiacal tropical
function getZodiacSign(raHours: number, decDeg: number): string {
  const epsilon = 23.439281; // Obliquidade da eclíptica em graus
  const raDeg = raHours * 15; // RA em graus

  const raRad = raDeg * (Math.PI / 180);
  const decRad = decDeg * (Math.PI / 180);
  const epsilonRad = epsilon * (Math.PI / 180);

  // Fórmula para longitude eclíptica
  const sinLambda =
    Math.sin(raRad) * Math.cos(epsilonRad) +
    Math.tan(decRad) * Math.sin(epsilonRad);
  const cosLambda = Math.cos(raRad);
  let lambdaDeg = Math.atan2(sinLambda, cosLambda) * (180 / Math.PI);
  if (lambdaDeg < 0) lambdaDeg += 360;

  const signIndex = Math.floor(lambdaDeg / 30) % 12;
  const signs = [
    "Áries",
    "Touro",
    "Gêmeos",
    "Câncer",
    "Leão",
    "Virgem",
    "Libra",
    "Escorpião",
    "Sagitário",
    "Capricórnio",
    "Aquário",
    "Peixes",
  ];
  return signs[signIndex];
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 📡 Função para buscar dados e gerar horóscopo
export async function generateHoroscope(dataISO: string, signoUsuario: string) {
  const url = `https://api.astronomyapi.com/api/v2/bodies/positions?latitude=0&longitude=0&elevation=0&from_date=${dataISO}&to_date=${dataISO}&time=00:00:00`;

  const res = await fetchWithCache(url, {
    headers: { Authorization: `Basic ${AUTH}` },
  });

  const json = await res.json();

  // Coletar transitos de TODOS os bodies retornados
  const transitos: string[] = [];
  let moonPhase = "";

  json.data.table.rows.forEach((row: any) => {
    const id = row.entry.id;
    const planetaData = row.cells[0]; // Posição do dia (já que from_date == to_date)

    if (!planetaData || !planetaData.position?.equatorial) return; // Skip se dados inválidos

    const nomePlaneta =
      mapaIdsParaNomes[id] || id.charAt(0).toUpperCase() + id.slice(1); // Fallback: 'sun' -> 'Sun'
    const ra = planetaData.position.equatorial.right_ascension?.hours || 0;
    const dec = planetaData.position.equatorial.declination?.degrees || 0;
    const signo = getZodiacSign(ra, dec);

    let extra = "";
    if (id === "moon") {
      moonPhase = planetaData.extra_info?.phase?.string || "Desconhecida";
      extra = ` (fase: ${moonPhase})`;
    }

    transitos.push(`${nomePlaneta} em ${signo}${extra}`);
  });

  // Prompt para OpenAI, agora com todos os transitos para mais variedade
  const prompt = `Gere um horóscopo diário interessante para o signo ${signoUsuario}, incorporando estes transitos astronômicos reais: ${transitos.join(", ")}. Torne positivo e motivador, com no máximo 2 frases. Inclua conselhos práticos baseados nos transitos, mas mantenha leve e divertido.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Você é um astrólogo criativo que gera horóscopos baseados em dados reais. Você não deve usar emojis, caracteres especiais como asteriscos, -- ou qualquer outra coisa que não sejam somente letras e pontuação do alfabeto Brasileiro.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 100,
    temperature: 0.7,
  });

  const textoFinal = completion.choices[0].message.content?.trim();

  return textoFinal;
}
