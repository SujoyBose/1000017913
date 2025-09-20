import './index.css';

const app = document.getElementById('app');

app.innerHTML = `
  <div class="container">
    <div class="card">
      <h1 class="title">URL Shortener</h1>
      <form id="shorten-form" class="form">
        ${Array.from({length: 5}).map((_, i) => `
          <div class="multi-row">
            <input type="url" name="long-url-${i}" class="input" placeholder="Long URL..." />
            <input type="number" name="validity-${i}" class="input validity" min="1" placeholder="Validity (min)" />
            <input type="text" name="shortcode-${i}" class="input shortcode" maxlength="20" placeholder="Preferred shortcode" />
          </div>
        `).join('')}
        <button type="submit" class="button">Shorten All</button>
      </form>
      <div id="result" class="result"></div>
    </div>
  </div>
`;

const form = document.getElementById('shorten-form');
const resultDiv = document.getElementById('result');

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultDiv.innerHTML = `<div class='loading'>Shortening...</div>`;
  const rows = Array.from(form.querySelectorAll('.multi-row'));
  const requests = [];
  const errors = [];
  rows.forEach((row, i) => {
    const url = row.querySelector('input[type="url"]').value.trim();
    const validity = row.querySelector('.validity').value.trim();
    const shortcode = row.querySelector('.shortcode').value.trim();
    if (url) {
      if (!isValidUrl(url)) {
        errors.push(`Row ${i+1}: Invalid URL.`);
        return;
      }
      if (validity && (!/^[0-9]+$/.test(validity) || parseInt(validity) < 1)) {
        errors.push(`Row ${i+1}: Validity must be a positive integer.`);
        return;
      }
      requests.push({ url, validity: validity ? parseInt(validity) : undefined, shortcode: shortcode || undefined });
    }
  });
  if (errors.length) {
    resultDiv.innerHTML = `<div class='error'>${errors.join('<br>')}</div>`;
    return;
  }
  if (!requests.length) {
    resultDiv.innerHTML = `<div class='error'>Enter at least one valid URL.`;
    return;
  }
  // Send requests concurrently
  try {
    const responses = await Promise.all(requests.map(async (req) => {
      const res = await fetch('/shorturls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: req.url, validity: req.validity, shortcode: req.shortcode })
      });
      let data = null;
      try { data = await res.json(); } catch {}
      return {
        ok: res.ok,
        shortLink: data?.shortLink,
        expiry: data?.expiry,
        error: !res.ok ? (data?.error || 'Failed to shorten URL') : (!data?.shortLink ? 'No shortLink in response' : null),
        original: req.url
      };
    }));
    resultDiv.innerHTML = `
      <div>
        ${responses.map((r, i) => r.ok && r.shortLink ? `
          <div class='short-link-row'>
            <span class='original-url'>${r.original}</span>
            <a href='${r.shortLink}' target='_blank' rel='noopener noreferrer' class='short-link'>${r.shortLink}</a>
            <span class='expiry'>${r.expiry ? `Expires: ${new Date(r.expiry).toLocaleString()}` : ''}</span>
            <button class='copy-btn' data-link='${r.shortLink}'>Copy</button>
          </div>
        ` : `<div class='error'>Row ${i+1}: ${r.error}</div>`).join('')}
      </div>
    `;
    // Add copy button listeners
    resultDiv.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = () => {
        navigator.clipboard.writeText(btn.getAttribute('data-link'));
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
      };
    });
  } catch (err) {
    resultDiv.innerHTML = `<div class='error'>${err.message}</div>`;
  }
});
