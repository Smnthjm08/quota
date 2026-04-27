type ResetPasswordTemplateVariables = {
  resetLink: string;
  userEmail: string;
  userName?: string;
  appName?: string;
  expirationMinutes?: string;
};

type SendEmailInput = {
  template: "reset-password";
  to: string;
  variables: ResetPasswordTemplateVariables;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const emailApiUrl = process.env.EMAIL_API_URL;
  const emailApiKey = process.env.EMAIL_API_KEY;

  if (!emailApiUrl) {
    // Fallback for local development until an email provider is configured.
    console.info("[email] EMAIL_API_URL not set. Logging email payload instead:", input);
    return;
  }

  const response = await fetch(emailApiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(emailApiKey ? { authorization: `Bearer ${emailApiKey}` } : {}),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email provider request failed (${response.status}): ${body}`);
  }
}
