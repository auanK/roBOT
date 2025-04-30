import fetch from "node-fetch";

import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;

// Com base no clima retorna um emoji apropriado
function getEmoji(desc) {
  const d = desc.toLowerCase();
  if (d.includes("chuva")) return "🌧️";
  if (d.includes("nuvem")) return "⛅";
  if (d.includes("nublado")) return "☁️";
  if (d.includes("céu limpo")) return "☀️";
  if (d.includes("neve")) return "❄️";
  if (d.includes("tempestade")) return "⛈️";
  return "🌡️";
}

// Formata a resposta da API de clima
export async function formatWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric&lang=pt_br`;

  try {
    const res = await fetch(url);
    const { cod, main, weather, name, message } = await res.json();

    if (cod !== 200 || !main || !weather) {
      throw new Error(message || "Dados incompletos");
    }

    return `• ${name}: ${Math.round(main.temp)}°C ${getEmoji(
      weather[0].description
    )} — ${weather[0].description}`;
  } catch (err) {
    console.error(`Erro ao obter clima de ${city}:`, err.message);
    console.log(API_KEY);
    return `• ${city}: erro ao obter clima`;
  }
}
