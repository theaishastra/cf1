/**
 * pdf-generator.js
 * Converts the health card HTML to PDF using html2canvas + jsPDF.
 * Card size: 900×560px rendered at 2× scale.
 * Output: A4 landscape with front card on page 1, back card on page 2.
 */

async function generateCardPDF(cardWrapper) {
  // Attach off-screen
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 900px;
    background: transparent;
    z-index: -1;
  `;
  container.appendChild(cardWrapper);
  document.body.appendChild(container);

  try {
    const cardEls = cardWrapper.querySelectorAll('.cf-card');
    if (cardEls.length < 2) throw new Error('Card elements not found');

    // Render each card to canvas
    const canvases = [];
    for (const cardEl of cardEls) {
      // Wait for all images within the card to load before rendering. This ensures
      // that template PNGs are captured by html2canvas.
      const imgs = cardEl.querySelectorAll('img');
      await Promise.all(
        Array.from(imgs).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(res => {
            const onLoad = () => {
              img.removeEventListener('load', onLoad);
              img.removeEventListener('error', onLoad);
              res();
            };
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onLoad);
          });
        })
      );

      const canvas = await html2canvas(cardEl, {
        scale: 2,
        // With Google fonts removed and images hosted locally, we can
        // enable CORS and disable tainting to produce an exportable
        // canvas. This avoids the "Tainted canvases may not be exported"
        // error when calling canvas.toDataURL().
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: 900,
        height: 560,
      });
      canvases.push(canvas);
    }

    // A4 Landscape: 297mm × 210mm
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageW = 297;
    const pageH = 210;
    const margin = 15;
    const cardW = pageW - margin * 2;           // 267mm
    const cardH = cardW * (560 / 900);          // ~166mm
    const startY = (pageH - cardH) / 2;

    // Page 1: Front card
    const frontImg = canvases[0].toDataURL('image/jpeg', 0.92);
    pdf.addImage(frontImg, 'JPEG', margin, startY, cardW, cardH);

    // Small footer text
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text('Cheyutha Foundation for Organ Transplants  |  www.cfotindia.org  |  Helpline: 8328605200', pageW / 2, pageH - 5, { align: 'center' });

    // Page 2: Back card
    pdf.addPage();
    const backImg = canvases[1].toDataURL('image/jpeg', 0.92);
    pdf.addImage(backImg, 'JPEG', margin, startY, cardW, cardH);
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text('Cheyutha Foundation for Organ Transplants  |  www.cfotindia.org  |  Helpline: 8328605200', pageW / 2, pageH - 5, { align: 'center' });

    return pdf.output('blob');

  } finally {
    document.body.removeChild(container);
  }
}
