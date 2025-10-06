import { load } from "cheerio";

export function parseGrowwOptionChain(html) {
  const regex = /\{"strikePrice":.*?\}\}/gs;
  const matches = html.match(regex) || [];
  const records = [];

  for (const m of matches) {
    try {
      const obj = JSON.parse(m);
      records.push({
        strikePrice: Number(obj.strikePrice) / 100,
        CE: { lastPrice: obj.ce?.liveData?.ltp ?? null },
        PE: { lastPrice: obj.pe?.liveData?.ltp ?? null },
      });
    } catch {
      console.log("Error parsing JSON:", m);
    }
  }

  if (!records.length) {
    const $ = load(html);
    $(".split-scroll-table tr").each((i, row) => {
      const tds = $(row).find("td");
      if (tds.length > 10) {
        const ceLastPrice =
          parseFloat($(tds).eq(7).text().replace(/[^0-9.-]+/g, "")) || null;
        const strikePrice =
          parseFloat($(tds).eq(8).text().replace(/[^0-9.-]+/g, "")) || null;
        const peLastPrice =
          parseFloat($(tds).eq(9).text().replace(/[^0-9.-]+/g, "")) || null;

        if (strikePrice) {
          records.push({
            strikePrice: strikePrice / 100,
            CE: { lastPrice: ceLastPrice },
            PE: { lastPrice: peLastPrice },
          });
        }
      }
    });
  }
  return records;
}