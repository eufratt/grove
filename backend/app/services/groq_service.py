import asyncio
from groq import Groq
from app.config import settings

class GroqService:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = Groq(api_key=settings.GROQ_API_KEY)
        return self._client

    def _get_prompt(
        self,
        commodity_name: str,
        region: str,
        days: int,
        current_price: float,
        price_change_pct: float,
        divergence_score: float,
        classification: str,
        avg_amplitude: float,
        avg_frequency: float
    ) -> str:
        return (
            f"Anda adalah sistem analis harga pasar pangan komoditas pertanian lokal 'Grove'.\n"
            f"Tugas Anda adalah memberikan penjelasan bahasa natural yang sangat ringkas, padat, informatif, dan mudah dipahami oleh petani dan pembeli di Indonesia mengenai stabilitas harga komoditas berdasarkan hasil perhitungan statistik berikut:\n"
            f"- Nama Komoditas: {commodity_name}\n"
            f"- Wilayah: {region}\n"
            f"- Rentang Data: {days} hari terakhir\n"
            f"- Harga Saat Ini: Rp {current_price:,.0f}/kg\n"
            f"- Perubahan Harga Total: {price_change_pct:+.2f}%\n"
            f"- Divergence Score: {divergence_score:+.2f}%\n"
            f"- Klasifikasi Volatilitas: {classification}\n"
            f"- Rata-rata Amplitudo Osilasi: Rp {avg_amplitude:,.0f}\n"
            f"- Rata-rata Periode Osilasi: {avg_frequency:.1f} hari\n\n"
            f"Ketentuan Divergence Score:\n"
            f"- Skor negatif berarti persentase deviasi (volatilitas) harga berkurang bertahap (konvergen/stabil).\n"
            f"- Skor positif berarti persentase deviasi harga bertambah bertahap (divergen/makin bergejolak).\n"
            f"- Skor mendekati nol berarti fluktuasi normal.\n\n"
            f"Berikan penjelasan bahasa Indonesia maksimal 3 kalimat yang berisi:\n"
            f"1. Status stabilitas harga saat ini (menuju stabil, bergejolak, atau normal).\n"
            f"2. Penjelasan statistik osilasi (fluktuasi rata-rata Rp X dalam rentang Y hari).\n"
            f"3. Rekomendasi taktis untuk petani atau pembeli.\n\n"
            f"Jawab hanya teks penjelasan saja langsung ke poinnya, tanpa kata sambutan/salam pembuka atau penutup."
        )

    async def generate_explanation(
        self,
        commodity_name: str,
        region: str,
        days: int,
        current_price: float,
        price_change_pct: float,
        divergence_score: float,
        classification: str,
        avg_amplitude: float,
        avg_frequency: float
    ) -> str:
        prompt = self._get_prompt(
            commodity_name, region, days, current_price, price_change_pct,
            divergence_score, classification, avg_amplitude, avg_frequency
        )

        try:
            loop = asyncio.get_running_loop()
            
            def _call_api():
                chat_completion = self.client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=1024,
                    temperature=0.3
                )
                return chat_completion.choices[0].message.content.strip()

            result = await loop.run_in_executor(None, _call_api)
            return result
        except Exception as e:
            # Fallback explanation if API call fails
            direction = "stabil"
            if divergence_score > 5:
                direction = "makin bergejolak"
            elif divergence_score < -5:
                direction = "makin stabil"
                
            return (
                f"Harga {commodity_name} di wilayah {region} dalam {days} hari terakhir terpantau {direction} "
                f"dengan rata-rata simpangan fluktuasi sekitar Rp {avg_amplitude:,.0f} setiap {avg_frequency:.1f} hari. "
                f"Disarankan bagi pelaku pasar untuk tetap memantau tren harga harian sebelum melakukan transaksi besar."
            )

    async def generate_explanation_stream(
        self,
        commodity_name: str,
        region: str,
        days: int,
        current_price: float,
        price_change_pct: float,
        divergence_score: float,
        classification: str,
        avg_amplitude: float,
        avg_frequency: float
    ):
        prompt = self._get_prompt(
            commodity_name, region, days, current_price, price_change_pct,
            divergence_score, classification, avg_amplitude, avg_frequency
        )

        queue = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def _fetch_stream():
            try:
                stream = self.client.chat.completions.create(
                    model="openai/gpt-oss-120b",
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=1024,
                    temperature=0.3,
                    stream=True
                )
                for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        loop.call_soon_threadsafe(queue.put_nowait, content)
            except Exception as e:
                import traceback
                print("Error in _fetch_stream:")
                traceback.print_exc()
                loop.call_soon_threadsafe(queue.put_nowait, e)
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)

        # Run synchronous stream reader in a thread pool to avoid blocking FastAPI
        loop.run_in_executor(None, _fetch_stream)

        while True:
            item = await queue.get()
            if item is None:
                break
            if isinstance(item, Exception):
                # Fallback yield logic if the stream itself fails
                direction = "stabil"
                if divergence_score > 5:
                    direction = "makin bergejolak"
                elif divergence_score < -5:
                    direction = "makin stabil"
                fallback_msg = (
                    f"Harga {commodity_name} di wilayah {region} dalam {days} hari terakhir terpantau {direction} "
                    f"dengan rata-rata simpangan fluktuasi sekitar Rp {avg_amplitude:,.0f} setiap {avg_frequency:.1f} hari. "
                    f"Disarankan bagi pelaku pasar untuk tetap memantau tren harga harian sebelum melakukan transaksi besar."
                )
                for char in fallback_msg:
                    yield char
                break
            yield item

groq_service = GroqService()
