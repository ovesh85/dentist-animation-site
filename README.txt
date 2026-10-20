RADIX ENDODONTIC STUDIO — animated root canal website (static, no build step)

RUN LOCALLY
  The film scrubs best from a server that supports HTTP Range requests:
    npx http-server -p 8080      (then open http://localhost:8080)
  Any real host (Netlify, Vercel, cPanel, WordPress theme) works.

STRUCTURE
  index.html                 all sections and the booking form
  assets/css/style.css       design tokens at the top (:root)
  assets/js/app.js           config at the top: TOUR_STOPS, TIME_SLOTS, STAGE_CANAL
  assets/seq/film/d/         466 WebP frames (157 intro + 309 treatment), 1920w (desktop surgery film)
  assets/seq/film/m/         466 WebP frames (157 intro + 309 treatment), 900x900 square crop (phones)
  assets/img/                tour rooms (1920 + 960 "-m"), doctor, before/after, og-image
  assets/vendor/lenis.min.js smooth scroll (local copy)

SECTIONS
  1 Surgery film: scroll-scrubbed, 5 steps, live meter (discomfort 8→0, chair time 0→75 min)
  2 Book an appointment: the whole section is clickable and opens the form
  3 Before/after drag slider · 4 Studio tour (5 rooms, hotspots, autoplay, swipe, keys)
  5 Doctor + counters · 6 Aftercare timeline · 7 FAQ · Footer
  Booking form: symptoms, next 6 working days, time slots, validation, reference number, .ics export

TUNING
  Film scroll length: .film{height:860vh} in style.css (820vh on phones)
  Film holds: P_HOLD_A / P_HOLD_B in app.js. Desktop size: DESK_ZOOM, DESK_SHIFT.
  Slow devices automatically drop the frame cross-fade, then resolution. Data-saver loads half the frames.

WORDPRESS / WOOCOMMERCE PORT
  Page template + enqueued CSS/JS, assets in the theme.
  Booking submit (see "Demo: no server" comment in app.js) -> CF7 / WPForms / WooCommerce Bookings REST.
  TOUR_STOPS -> ACF repeater; doctor -> CPT.

NOTES
  Clinic name, address, phone and statistics are demo placeholders. All imagery is AI-generated.
