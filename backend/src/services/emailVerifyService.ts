import dns from 'dns';
import net from 'net';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export type EmailStatus = 'valid' | 'risky' | 'invalid';

const EMAIL_SYNTAX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

type SmtpResult = 'valid' | 'invalid' | 'unknown';

// Port 25 aksar ISP/home network pe blocked hota hai — us surat mein 'unknown' return
// hota hai aur email 'risky' mark hoti hai (invalid nahi), taake false negatives na banein.
function smtpCheck(email: string, mxHost: string, timeoutMs = 7000): Promise<SmtpResult> {
  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxHost);
    let step = 0;
    let buffer = '';
    let settled = false;

    const finish = (result: SmtpResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs, () => finish('unknown'));
    socket.on('error', () => finish('unknown'));
    socket.on('close', () => finish('unknown'));

    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      if (!buffer.endsWith('\n')) return;
      const lines = buffer.trim().split(/\r?\n/);
      const last = lines[lines.length - 1];
      buffer = '';
      // Multi-line replies ("250-...") ke liye final line ("250 ...") ka wait karo
      if (/^\d{3}-/.test(last)) return;
      const code = parseInt(last.slice(0, 3), 10);

      if (step === 0) {
        if (code !== 220) return finish('unknown');
        socket.write('EHLO leadfinderpro.local\r\n');
        step = 1;
      } else if (step === 1) {
        if (code !== 250) return finish('unknown');
        socket.write('MAIL FROM:<verify@leadfinderpro.local>\r\n');
        step = 2;
      } else if (step === 2) {
        if (code !== 250) return finish('unknown');
        socket.write(`RCPT TO:<${email}>\r\n`);
        step = 3;
      } else if (step === 3) {
        socket.write('QUIT\r\n');
        if (code === 250 || code === 251) return finish('valid');
        if (code === 550 || code === 551 || code === 553) return finish('invalid');
        return finish('unknown');
      }
    });
  });
}

export async function verifyEmail(
  email: string,
  source: 'website' | 'facebook' | 'guessed' | null
): Promise<EmailStatus> {
  if (!EMAIL_SYNTAX.test(email)) return 'invalid';

  const domain = email.split('@')[1];
  let mxHost: string;
  try {
    const records = await resolveMx(domain);
    if (!records || records.length === 0) return 'invalid';
    mxHost = records.sort((a, b) => a.priority - b.priority)[0].exchange;
  } catch (err: any) {
    // Sirf "domain/MX exist nahi karta" invalid hai; DNS timeout jaisi transient errors risky
    return err?.code === 'ENOTFOUND' || err?.code === 'ENODATA' ? 'invalid' : 'risky';
  }

  const smtp = await smtpCheck(email, mxHost);
  if (smtp === 'invalid') return 'invalid';
  // Guessed (info@domain) emails pe catch-all servers "valid" bol dete hain, isliye risky hi rakho
  if (smtp === 'valid' && source !== 'guessed') return 'valid';
  return 'risky';
}
