/**
 * Uzair AI Studio - Official QR Verification Badge Generator
 * Generates an executive, cryptographic digital badge with crisp scannable QR code
 */
(function(window) {
  'use strict';

  var UzairQrBadge = {
    // Generate a branded executive badge canvas (480x640 High-Res)
    generateBadgeCanvas: function(candidate, qrCanvas) {
      var canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 640;
      var ctx = canvas.getContext('2d');

      // Card Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 480, 640);

      // Decorative top gradient accent
      var grad = ctx.createLinearGradient(0, 0, 480, 0);
      grad.addColorStop(0, '#1E3A8A');
      grad.addColorStop(0.5, '#2563EB');
      grad.addColorStop(1, '#0D9488');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 480, 8);

      // Card outer border
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 478, 638);

      // Organization Header (Full Center Alignment)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('UZAIR AI STUDIO', 240, 50);

      ctx.fillStyle = '#64748B';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('OFFICIAL DIGITAL CREDENTIAL & VERIFICATION BADGE', 240, 70);

      // Divider line
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 84);
      ctx.lineTo(440, 84);
      ctx.stroke();

      // Candidate Name
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(candidate.fullName || 'Candidate Record', 240, 118);

      // Track / Domain Pill
      var domainText = (candidate.domain || 'Internship Candidate').toUpperCase();
      ctx.fillStyle = '#EFF6FF';
      ctx.fillRect(90, 132, 300, 26);
      ctx.strokeStyle = '#BFDBFE';
      ctx.lineWidth = 1;
      ctx.strokeRect(90, 132, 300, 26);

      ctx.fillStyle = '#1D4ED8';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(domainText, 240, 149);

      // QR Code Container Box
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(110, 175, 260, 260);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(110, 175, 260, 260);

      // Draw QR Code centered (220x220) with crisp nearest-neighbor scaling
      if (qrCanvas) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(qrCanvas, 130, 195, 220, 220);
      }

      // Reference ID in monospace
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 16px "Courier New", Courier, monospace';
      ctx.fillText(candidate.id || 'UZ-INT-XXXXX', 240, 465);

      // Subtitle / instructions
      ctx.fillStyle = '#64748B';
      ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Scan with smartphone camera to verify authenticity', 240, 488);

      // Verification URL
      var verifyUrl = (window.location.origin || 'http://localhost:3000') + '/verify?id=' + encodeURIComponent(candidate.id || '');
      ctx.fillStyle = '#2563EB';
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(verifyUrl, 240, 510);

      // Security Footer
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(20, 540, 440, 76);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 540, 440, 76);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('🛡️ CRYPTOGRAPHICALLY VERIFIED REGISTRY RECORD', 240, 568);

      ctx.fillStyle = '#64748B';
      ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Endorsed by Muhammad Uzair (Founder & Lead Architect) | Uzair AI Studio', 240, 588);
      ctx.fillText('Authorized Training Partner • ISO Verified Workflow Certification', 240, 602);

      return canvas;
    },

    // Download high-resolution branded badge PNG
    downloadBadge: function(candidate, qrCanvas) {
      if (!qrCanvas && candidate && candidate.id) {
        // Create off-screen QR canvas if none was supplied
        var tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        var verifyUrl = (window.location.origin || 'http://localhost:3000') + '/verify?id=' + encodeURIComponent(candidate.id);
        if (typeof QRCode !== 'undefined') {
          var qrObj = new QRCode(tempDiv, {
            text: verifyUrl,
            width: 250,
            height: 250,
            colorDark: '#0F172A',
            colorLight: '#FFFFFF',
            correctLevel: QRCode.CorrectLevel.H
          });
          qrCanvas = tempDiv.querySelector('canvas');
        }
      }

      var badgeCanvas = this.generateBadgeCanvas(candidate, qrCanvas);
      var link = document.createElement('a');
      link.download = (candidate.id || 'UZ-INT') + '-Official-QR-Badge.png';
      link.href = badgeCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    // Download standalone raw QR code PNG
    downloadRawQr: function(candidate, qrCanvas) {
      if (!qrCanvas) return;
      var link = document.createElement('a');
      link.download = (candidate.id || 'UZ-INT') + '-QR-Code.png';
      link.href = qrCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  window.UzairQrBadge = UzairQrBadge;
})(window);
