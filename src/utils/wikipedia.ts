export interface WikiLookupResult {
  title: string;
  extract: string;
  lang: 'vi' | 'en';
}

function sanitizeExtract(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchSummaryFromLang(
  lang: 'vi' | 'en',
  term: string,
): Promise<WikiLookupResult | null> {
  const trimmed = term.trim();
  if (!trimmed) return null;

  const directUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(trimmed)}`;
  try {
    const res = await fetch(directUrl, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        extract?: string;
        type?: string;
      };
      if (data.extract && data.type !== 'disambiguation') {
        return {
          title: data.title || trimmed,
          extract: sanitizeExtract(data.extract),
          lang,
        };
      }
    }
  } catch {
    // Fall through to opensearch
  }

  // Fallback via MediaWiki opensearch to resolve casing/diacritics
  const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(trimmed)}&limit=1&namespace=0&format=json&origin=*`;
  try {
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = (await searchRes.json()) as [string, string[]];
    const matchedTitle = searchData?.[1]?.[0];
    if (!matchedTitle) return null;

    const matchedUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(matchedTitle)}`;
    const summaryRes = await fetch(matchedUrl, { headers: { Accept: 'application/json' } });
    if (!summaryRes.ok) return null;
    const summaryData = (await summaryRes.json()) as {
      title?: string;
      extract?: string;
    };
    if (!summaryData.extract) return null;

    return {
      title: summaryData.title || matchedTitle,
      extract: sanitizeExtract(summaryData.extract),
      lang,
    };
  } catch {
    return null;
  }
}

export async function lookupWikipedia(query: string): Promise<WikiLookupResult | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  const viResult = await fetchSummaryFromLang('vi', cleanQuery);
  if (viResult) return viResult;

  const enResult = await fetchSummaryFromLang('en', cleanQuery);
  return enResult;
}
