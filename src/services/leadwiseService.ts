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
  const payload = {
    fields: {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      company: data.company,
    },
  };
  console.log('[Leadwise] Submitting:', payload);
  try {
    const res = await fetch(LEADWISE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    console.log('[Leadwise] Response:', res.status, json);
  } catch (e) {
    console.warn('[Leadwise] Submission failed (non-blocking):', e);
  }
}
