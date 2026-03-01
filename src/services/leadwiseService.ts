const LEADWISE_URL =
  import.meta.env.DEV
    ? '/api/leadwise'
    : 'https://4d11e845-db5e-4150-9f89-403aeb3ff7cb-00-1mmbu14lh40n0.kirk.replit.dev/api/forms/public/jGrNMS4v31Et/submit';

export async function submitToLeadwise(data: {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
}) {
  console.log('[Leadwise] Submitting:', data);
  try {
    let res: Response;

    if (import.meta.env.DEV) {
      // Dev: use JSON via Vite proxy (no CORS issue)
      res = await fetch(LEADWISE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            company: data.company,
          },
        }),
      });
    } else {
      // Production: use form-urlencoded to avoid CORS preflight
      const params = new URLSearchParams();
      params.append('fields[email]', data.email);
      params.append('fields[first_name]', data.firstName);
      params.append('fields[last_name]', data.lastName);
      params.append('fields[company]', data.company);

      res = await fetch(LEADWISE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    }

    const json = await res.json().catch(() => null);
    console.log('[Leadwise] Response:', res.status, json);
  } catch (e) {
    console.warn('[Leadwise] Submission failed (non-blocking):', e);
  }
}
