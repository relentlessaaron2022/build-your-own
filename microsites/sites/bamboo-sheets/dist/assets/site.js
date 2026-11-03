(() => {
  'use strict';
  const variant = document.body.dataset.variant;
  const size = document.querySelector('#size');
  const color = document.querySelector('#color');
  const key = 'bamboo-campaign';
  let campaign = {};
  try {
    campaign = JSON.parse(sessionStorage.getItem(key) || '{}');
    if (!campaign || typeof campaign !== 'object' || Array.isArray(campaign)) campaign = {};
    for (const field of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      const value = new URLSearchParams(location.search).get(field);
      if (value) campaign[field] = value.slice(0, 100);
    }
    sessionStorage.setItem(key, JSON.stringify(campaign));
  } catch { campaign = {}; }
  // No collector is connected: these events are an integration interface, not a sales report.
  const emit = (name, extra = {}) => {
    const detail = { event: name, variant, ...campaign, ...extra };
    window.dispatchEvent(new CustomEvent('bamboo:analytics', { detail }));
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(detail);
  };
  const update = () => {
    if (!size || !color) return;
    const selected = color.value;
    const image = document.querySelector('#selected-image');
    const caption = document.querySelector('#image-caption');
    // Original Black and White images were aliases; never pretend they are exact previews.
    const hasPreview = !['Black', 'White'].includes(selected);
    const slug = hasPreview ? selected.toLowerCase().replaceAll(' ', '-') : 'teal';
    image.src = `assets/color-${slug}.webp`;
    image.alt = hasPreview ? `${selected} styled bedding preview` : 'Teal styled bedding example; selected color is not pictured';
    caption.textContent = hasPreview ? 'Styled color inspiration. Confirm the actual product when ordering.' : `${selected} is listed; an exact preview is unavailable. Teal example pictured.`;
    document.querySelector('#dimensions').textContent = `${size.value} fitted sheet: ${size.value === 'Queen' ? '60 × 80' : '76 × 80'} in. Confirm mattress depth by phone.`;
    document.querySelector('#selection').textContent = `Ask for: ${size.value} · ${selected} · 6-piece sheet set`;
    try { sessionStorage.setItem('bamboo-selection', JSON.stringify({size: size.value, color: selected})); } catch {}
  };
  if (size && color) {
    for (const input of [size, color]) input.addEventListener('change', () => {
      update(); emit('product_selection', { size: size.value, color: color.value });
    });
    update();
  }
  for (const link of document.querySelectorAll('[data-call]')) link.addEventListener('click', () => {
    emit('call_click', { size: size?.value || '', color: color?.value || '', order_code: link.dataset.code || variant });
  });
  emit('landing_view');
})();
