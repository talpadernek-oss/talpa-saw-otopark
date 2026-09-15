import { NextRequest, NextResponse } from 'next/server';
import { isValidTCKN } from '@/lib/tckn';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tc = typeof body?.tcNo === 'string' ? body.tcNo : body?.tc;
    const requestedCampaignSlug = body?.campaignSlug || process.env.TALPA_CAMPAIGN_SLUG;

    if (!tc || typeof tc !== 'string' || !isValidTCKN(tc)) {
      return NextResponse.json(
        {
          success: false,
          isMember: false,
          error: 'Geçersiz T.C. Kimlik Numarası. Lütfen 11 haneli geçerli TCKN giriniz.'
        },
        { status: 400 }
      );
    }

    // Default official API key fallback if process.env.TALPA_API_KEY is not defined
    const apiKey = process.env.TALPA_API_KEY || 'talpa_oWOkhgsYbTcKCEv2e2D1ruABD-bYSuMu';

    // Official Member Verification API Endpoint v1 (Primary) and legacy fallback
    const primaryEndpoint = 'https://talpa-uye.vercel.app/api/v1/members/verify';
    const legacyEndpoint = 'https://talpa-uye.vercel.app/api/members/verify';

    const cleanTc = tc.trim();

    // Helper to perform fetch call to TALPA API
    async function callTalpaApi(url: string, payload: { tcNo: string; campaignSlug?: string }) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });
      const json = await res.json().catch(() => ({ ok: false, reason: 'invalid_json' }));
      return { status: res.status, ok: res.ok, data: json };
    }

    // Attempt 1: Call Primary API (with campaignSlug if defined)
    const requestPayload: { tcNo: string; campaignSlug?: string } = { tcNo: cleanTc };
    if (requestedCampaignSlug) {
      requestPayload.campaignSlug = requestedCampaignSlug;
    }

    let apiResult = await callTalpaApi(primaryEndpoint, requestPayload).catch(() => null);

    // If Primary Endpoint failed (e.g. 404 or network issue), try Legacy Endpoint
    if (!apiResult || apiResult.status === 404 || apiResult.status === 502 || apiResult.status === 503) {
      console.warn('TALPA API v1 unavailable or returned error, trying legacy endpoint...');
      apiResult = await callTalpaApi(legacyEndpoint, requestPayload).catch(() => null);
    }

    // If request failed completely due to network error
    if (!apiResult) {
      return NextResponse.json(
        {
          success: false,
          isMember: false,
          error: 'TALPA üyelik doğrulama servisine erişilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyiniz.'
        },
        { status: 503 }
      );
    }

    const { status: httpStatus, data } = apiResult;

    // Check for API Error Responses per documentation:
    // Hata yanıtlarında "ok": false veya httpStatus != 2xx
    if (httpStatus !== 200 || data.ok === false) {
      console.error('TALPA API Verification error response:', httpStatus, data);

      if (httpStatus === 429 || data.reason === 'rate_limited') {
        return NextResponse.json(
          {
            success: false,
            isMember: false,
            error: 'Sorgulama limitine ulaşıldı (Rate Limit). Lütfen birkaç dakika sonra tekrar deneyiniz.'
          },
          { status: 429 }
        );
      }

      if (httpStatus === 400 || data.reason === 'invalid_tc_no') {
        return NextResponse.json(
          {
            success: false,
            isMember: false,
            error: 'Girdiğiniz T.C. Kimlik Numarası API doğrulamasından geçemedi.'
          },
          { status: 400 }
        );
      }

      if (httpStatus === 401 || data.reason === 'unauthorized') {
        return NextResponse.json(
          {
            success: false,
            isMember: false,
            error: 'TALPA API Anahtarı yetkisiz (401 Unauthorized). Lütfen API anahtarını kontrol ediniz.'
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          isMember: false,
          error: `TALPA üyelik doğrulama servisi hatası (${data.reason || httpStatus}). Lütfen tekrar deneyiniz.`
        },
        { status: httpStatus >= 500 ? 502 : 400 }
      );
    }

    // Official Response Handling according to API Documentation:
    // data.status === 'uye' -> Aktif üye, borcu yok (KABUL)
    // data.status === 'borclu' -> Aktif üye, borcu var (KABUL)
    // data.status === 'degil' -> Üye değil / pasif / askıda (RED)
    let isMember = data.status === 'uye' || data.status === 'borclu';

    // If campaignSlug was passed and resulted in status === 'degil', attempt a pure TC check without campaignSlug
    // to prevent campaign-whitelist mismatch false negatives.
    if (!isMember && data.status === 'degil' && requestedCampaignSlug) {
      console.log('Campaign slug verification returned degil, retrying without campaignSlug...');
      const pureCheckResult = await callTalpaApi(primaryEndpoint, { tcNo: cleanTc }).catch(() => null);
      if (pureCheckResult && pureCheckResult.httpStatus === 200 && pureCheckResult.data.ok !== false) {
        if (pureCheckResult.data.status === 'uye' || pureCheckResult.data.status === 'borclu') {
          isMember = true;
          data.status = pureCheckResult.data.status;
        }
      }
    }

    if (!isMember) {
      return NextResponse.json({
        success: true,
        isMember: false,
        status: data.status || 'degil',
        message: 'Girdiğiniz T.C. Kimlik Numarası aktif TALPA üyeliği ile eşleşmedi.',
        redirectUrl: 'https://www.talpa.org/uyelik/'
      });
    }

    return NextResponse.json({
      success: true,
      isMember: true,
      status: data.status,
      memberInfo: {
        tc: cleanTc,
        status: data.status === 'borclu' ? 'Aktif Üye (Borçlu)' : 'Aktif Üye',
        membershipType: 'Asil Üye (Kokpit)',
        verificationTime: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Unhandled error in TALPA verify route:', error);
    return NextResponse.json(
      {
        success: false,
        isMember: false,
        error: 'TALPA üyelik doğrulama servisinde beklenmeyen bir sunucu hatası oluştu.'
      },
      { status: 500 }
    );
  }
}
