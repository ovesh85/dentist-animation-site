IVORY DENTAL CLINIC - one-page website (static, no build step)

RUN LOCALLY
  npx http-server . -p 8080    then open http://localhost:8080

EDIT (top of assets/js/app.js)
  CONFIG      WhatsApp number, phone, address, maps query, clinic hours (IST)
              >>> whatsapp/phone are PLACEHOLDERS (98765 43210). Replace before going live. <<<
  STEPS       captions for the 4 film steps (Comfort, Root canal, Cleaning, Result)
  TREATMENTS  the 8 treatment cards (name, text, meta, icon)
  FAQ         questions and answers
  Film scroll length: data-vh="640" on <section id="film"> in index.html

FILES
  assets/seq/film/d   165 WebP frames 1440w + smile.webp (desktop, 5.4 MB)
  assets/seq/film/m   165 WebP frames portrait 960h + smile.webp (phones, 3.1 MB)
  assets/img          before.webp / after.webp (comparison slider), og.jpg, favicon.svg

HOW IT WORKS
  The hero card grows to full screen on scroll, then the treatment film plays
  (frames drawn on <canvas>, smoother than scrubbing video), ending in a crossfade
  to the result. Booking opens https://wa.me/<number>?text=<prefilled message>.
  Font: Schibsted Grotesk (Google Fonts). Smooth scroll: Lenis 1.1.13.

WORDPRESS PORT
  Page template + enqueued style.css/app.js, assets copied into the theme.

CREDIT
  Template created by Perception System - design studio.
