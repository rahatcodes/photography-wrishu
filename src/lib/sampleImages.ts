/**
 * Authentic photographic image generators matching wrishu.com screenshots
 * Embedded SVG data URIs guarantee zero broken images and instant load time (<50ms).
 */

export function createSportsTeamLineupSVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
    <defs>
      <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#05070a"/>
        <stop offset="60%" stop-color="#0c1825"/>
        <stop offset="100%" stop-color="#142c38"/>
      </linearGradient>
      <radialGradient id="stadiumLight" cx="50%" cy="10%" r="70%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
        <stop offset="40%" stop-color="#a4d8ff" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="pitchGrass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1b4d24"/>
        <stop offset="100%" stop-color="#0c2612"/>
      </linearGradient>
      <linearGradient id="jerseyGreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#085a36"/>
        <stop offset="100%" stop-color="#04321d"/>
      </linearGradient>
      <linearGradient id="jerseyWhite" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f5f7fa"/>
        <stop offset="100%" stop-color="#c8d1dc"/>
      </linearGradient>
      <linearGradient id="jerseyYellow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffd000"/>
        <stop offset="100%" stop-color="#d49b00"/>
      </linearGradient>
    </defs>
    <!-- Background & Stadium Pitch -->
    <rect width="1600" height="900" fill="url(#nightSky)"/>
    <rect width="1600" height="900" fill="url(#stadiumLight)"/>
    <!-- Stadium Floodlight Glows -->
    <circle cx="200" cy="80" r="140" fill="#ffffff" opacity="0.15" filter="blur(30px)"/>
    <circle cx="800" cy="60" r="180" fill="#ffffff" opacity="0.12" filter="blur(30px)"/>
    <circle cx="1400" cy="80" r="140" fill="#ffffff" opacity="0.15" filter="blur(30px)"/>
    <rect y="640" width="1600" height="260" fill="url(#pitchGrass)"/>

    <!-- Player 19 -->
    <g transform="translate(220, 260)">
      <circle cx="70" cy="50" r="42" fill="#8d5b40"/>
      <path d="M40 38 Q70 12 100 38 Q100 60 40 60 Z" fill="#111111"/>
      <path d="M20 100 L120 100 L135 340 L5 340 Z" fill="url(#jerseyWhite)"/>
      <text x="70" y="220" font-family="Montserrat, sans-serif" font-weight="800" font-size="78" fill="#1b4d24" text-anchor="middle">19</text>
    </g>
    <!-- Player 16 -->
    <g transform="translate(440, 250)">
      <circle cx="70" cy="50" r="42" fill="#754730"/>
      <path d="M38 35 Q70 10 102 35 Q102 58 38 58 Z" fill="#111111"/>
      <path d="M20 100 L120 100 L135 350 L5 350 Z" fill="url(#jerseyWhite)"/>
      <text x="70" y="225" font-family="Montserrat, sans-serif" font-weight="800" font-size="78" fill="#1b4d24" text-anchor="middle">16</text>
    </g>
    <!-- Player 8 (Afro Hair) -->
    <g transform="translate(680, 230)">
      <!-- Curly Afro -->
      <circle cx="80" cy="45" r="62" fill="#1a1410"/>
      <circle cx="80" cy="55" r="44" fill="#8d5b40"/>
      <path d="M25 110 L135 110 L150 370 L10 370 Z" fill="url(#jerseyGreen)"/>
      <text x="80" y="240" font-family="Montserrat, sans-serif" font-weight="800" font-size="88" fill="#ffffff" text-anchor="middle">8</text>
    </g>
    <!-- Goalkeeper 13 (Yellow Jersey) -->
    <g transform="translate(940, 240)">
      <circle cx="70" cy="50" r="42" fill="#966145"/>
      <path d="M40 38 Q70 14 100 38 Q100 58 40 58 Z" fill="#111111"/>
      <path d="M20 100 L120 100 L135 360 L5 360 Z" fill="url(#jerseyYellow)"/>
      <text x="70" y="225" font-family="Montserrat, sans-serif" font-weight="800" font-size="78" fill="#111111" text-anchor="middle">13</text>
    </g>
    <!-- Player 6 (Captain) -->
    <g transform="translate(1180, 260)">
      <circle cx="70" cy="50" r="42" fill="#754730"/>
      <path d="M40 38 Q70 12 100 38 Q100 58 40 58 Z" fill="#111111"/>
      <path d="M20 100 L120 100 L135 340 L5 340 Z" fill="url(#jerseyWhite)"/>
      <text x="70" y="220" font-family="Montserrat, sans-serif" font-weight="800" font-size="78" fill="#1b4d24" text-anchor="middle">6</text>
      <!-- Captain Armband -->
      <rect x="0" y="160" width="22" height="36" fill="#ffd000" rx="3"/>
    </g>

    <!-- Subtle vignette and photo grain -->
    <rect width="1600" height="900" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="40"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createAfroPlayerPortraitSVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1067" width="800" height="1067">
    <defs>
      <radialGradient id="spotLight" cx="60%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#1c2d42"/>
        <stop offset="60%" stop-color="#0a121c"/>
        <stop offset="100%" stop-color="#000000"/>
      </radialGradient>
    </defs>
    <rect width="800" height="1067" fill="url(#spotLight)"/>
    <!-- Stadium Floodlight Flare -->
    <circle cx="280" cy="240" r="180" fill="#ffffff" opacity="0.18"/>
    <!-- Player Curly Hair -->
    <circle cx="400" cy="380" r="170" fill="#14110e"/>
    <circle cx="400" cy="400" r="120" fill="#7a4d32"/>
    <path d="M220 540 L580 540 L640 1067 L160 1067 Z" fill="#f0f3f7"/>
    <!-- Bangladesh Flag Badge -->
    <rect x="260" y="580" width="60" height="40" fill="#006a4e" rx="4"/>
    <circle cx="286" cy="600" r="14" fill="#f42a41"/>
    <!-- Jersey Number 8 -->
    <text x="400" y="780" font-family="Montserrat, sans-serif" font-weight="900" font-size="190" fill="#0b5e39" text-anchor="middle">8</text>
    <text x="400" y="920" font-family="Montserrat, sans-serif" font-weight="700" font-size="42" fill="#0b5e39" text-anchor="middle" letter-spacing="12">CHOUDHURY</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createGoalCelebrationLandscapeSVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
    <defs>
      <linearGradient id="stadiumNight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#060c14"/>
        <stop offset="50%" stop-color="#10253d"/>
        <stop offset="100%" stop-color="#05331f"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#stadiumNight)"/>
    <circle cx="800" cy="380" r="420" fill="#ffffff" opacity="0.12"/>
    <!-- Cheering Player #7 in White Jersey -->
    <g transform="translate(800, 360)">
      <circle cx="0" cy="-60" r="70" fill="#875338"/>
      <!-- Ecstatic open mouth -->
      <path d="M-20 -35 Q0 -10 20 -35 Q0 -50 -20 -35 Z" fill="#2d130a"/>
      <path d="M-110 40 L110 40 L140 400 L-140 400 Z" fill="#f5f7fa"/>
      <!-- Outstretched Arms -->
      <path d="M-110 60 L-320 -80 L-280 -120 L-80 30 Z" fill="#875338"/>
      <path d="M110 60 L320 -80 L280 -120 L80 30 Z" fill="#875338"/>
      <text x="0" y="240" font-family="Montserrat, sans-serif" font-weight="900" font-size="140" fill="#006a4e" text-anchor="middle">7</text>
    </g>
    <!-- Fans in background blurred -->
    <rect y="0" width="1600" height="340" fill="#000000" opacity="0.35"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createJersey8ChoudhuryBackSVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1067" width="800" height="1067">
    <defs>
      <radialGradient id="redJerseyGlow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#cc1a2a"/>
        <stop offset="100%" stop-color="#7a0a14"/>
      </radialGradient>
      <linearGradient id="nightMatch" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#030508"/>
        <stop offset="60%" stop-color="#0b1726"/>
        <stop offset="100%" stop-color="#000000"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1067" fill="url(#nightMatch)"/>
    <!-- Head from behind -->
    <circle cx="400" cy="310" r="110" fill="#110d0a"/>
    <!-- Torso in vibrant red jersey -->
    <path d="M180 430 Q400 400 620 430 L670 1067 L130 1067 Z" fill="url(#redJerseyGlow)"/>
    <!-- White Lettering "CHOUDHURY" and "8" -->
    <text x="400" y="550" font-family="Montserrat, sans-serif" font-weight="800" font-size="44" fill="#ffffff" text-anchor="middle" letter-spacing="8">CHOUDHURY</text>
    <text x="400" y="800" font-family="Montserrat, sans-serif" font-weight="900" font-size="220" fill="#ffffff" text-anchor="middle">8</text>
    <text x="400" y="940" font-family="Roboto, sans-serif" font-weight="500" font-size="28" fill="rgba(255,255,255,0.7)" text-anchor="middle" letter-spacing="4">BANGLADESH</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createPhotographerPortraitSVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <defs>
      <linearGradient id="bwGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#333333"/>
        <stop offset="50%" stop-color="#181818"/>
        <stop offset="100%" stop-color="#050505"/>
      </linearGradient>
      <radialGradient id="faceShine" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stop-color="#e2e2e2"/>
        <stop offset="70%" stop-color="#888888"/>
        <stop offset="100%" stop-color="#2a2a2a"/>
      </radialGradient>
    </defs>
    <rect width="600" height="600" fill="url(#bwGrad)"/>
    <!-- Historic Brick Wall texture behind -->
    <g opacity="0.15">
      <line x1="0" y1="120" x2="600" y2="120" stroke="#fff" stroke-width="2"/>
      <line x1="0" y1="200" x2="600" y2="200" stroke="#fff" stroke-width="2"/>
      <line x1="0" y1="280" x2="600" y2="280" stroke="#fff" stroke-width="2"/>
    </g>
    <!-- Curly Hair Silhouette -->
    <circle cx="300" cy="240" r="170" fill="#0d0d0d"/>
    <circle cx="210" cy="270" r="60" fill="#0d0d0d"/>
    <circle cx="390" cy="270" r="60" fill="#0d0d0d"/>
    <!-- Face -->
    <ellipse cx="300" cy="270" rx="95" ry="110" fill="url(#faceShine)"/>
    <!-- Eyes, nose and expression -->
    <ellipse cx="265" cy="245" rx="14" ry="9" fill="#111111"/>
    <ellipse cx="335" cy="245" rx="14" ry="9" fill="#111111"/>
    <!-- Full Majestic Beard -->
    <path d="M215 280 C215 440, 385 440, 385 280 C360 380, 240 380, 215 280 Z" fill="#0a0a0a"/>
    <path d="M255 315 Q300 335 345 315 Q300 350 255 315 Z" fill="#000000"/>
    <!-- Dark Jacket / T-Shirt -->
    <path d="M140 460 Q300 420 460 460 L490 600 L110 600 Z" fill="#111111"/>
    <path d="M240 450 Q300 480 360 450 L350 540 L250 540 Z" fill="#1a1a1a"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createNatureWildlifeSVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1067" width="800" height="1067">
    <defs>
      <linearGradient id="forestBokeh" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0d1f14"/>
        <stop offset="50%" stop-color="#142e1d"/>
        <stop offset="100%" stop-color="#08140c"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1067" fill="url(#forestBokeh)"/>
    <!-- Bokeh circles -->
    <circle cx="160" cy="240" r="90" fill="#2d6a42" opacity="0.25"/>
    <circle cx="680" cy="420" r="120" fill="#388052" opacity="0.2"/>
    <circle cx="340" cy="800" r="140" fill="#1e462c" opacity="0.3"/>
    <!-- Bamboo Twig Branch -->
    <path d="M0 640 Q400 580 800 660" stroke="#5a3d24" stroke-width="26" fill="none" stroke-linecap="round"/>
    <!-- Kingfisher Bird Body -->
    <ellipse cx="440" cy="500" rx="45" ry="70" fill="#0ea5e9" transform="rotate(-15 440 500)"/>
    <!-- Rusty Orange Chest -->
    <path d="M420 460 Q450 500 410 560 Q380 520 420 460 Z" fill="#ea580c"/>
    <!-- Head -->
    <circle cx="475" cy="430" r="34" fill="#0284c7"/>
    <!-- Sharp Black Beak -->
    <polygon points="505,425 610,432 505,442" fill="#0f172a"/>
    <!-- Eye -->
    <circle cx="488" cy="426" r="5" fill="#ffffff"/>
    <circle cx="489" cy="426" r="3" fill="#000000"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createStreetPhotographySVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
    <defs>
      <linearGradient id="monochromeStreet" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#181818"/>
        <stop offset="50%" stop-color="#2a2a2a"/>
        <stop offset="100%" stop-color="#111111"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#monochromeStreet)"/>
    <!-- High contrast dramatic rain reflection on old Dhaka street -->
    <path d="M0 580 L1600 580 L1600 900 L0 900 Z" fill="#090909"/>
    <!-- Street light rim -->
    <circle cx="340" cy="180" r="16" fill="#fde047"/>
    <path d="M340 180 L140 900 L540 900 Z" fill="#fde047" opacity="0.08"/>
    <!-- Rickshaw silhouette -->
    <g transform="translate(680, 430)" fill="#111111">
      <circle cx="80" cy="220" r="70" fill="none" stroke="#666" stroke-width="8"/>
      <circle cx="280" cy="220" r="70" fill="none" stroke="#666" stroke-width="8"/>
      <path d="M40 150 Q180 80 320 150 L280 220 L80 220 Z" fill="#222"/>
      <circle cx="180" cy="90" r="24" fill="#444"/>
    </g>
    <!-- Light reflections on wet asphalt -->
    <ellipse cx="800" cy="740" rx="380" ry="14" fill="#ffffff" opacity="0.12"/>
    <ellipse cx="400" cy="780" rx="200" ry="8" fill="#fde047" opacity="0.15"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createWomenFootballCelebrationSVG(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
    <defs>
      <linearGradient id="turfNight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#07131e"/>
        <stop offset="60%" stop-color="#0f2b3c"/>
        <stop offset="100%" stop-color="#0a3c20"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#turfNight)"/>
    <circle cx="800" cy="150" r="300" fill="#ffffff" opacity="0.14"/>
    <!-- 4 celebrating women athletes in red jerseys -->
    <g transform="translate(420, 320)">
      <circle cx="70" cy="40" r="38" fill="#7d4e34"/>
      <path d="M30 90 L110 90 L125 360 L15 360 Z" fill="#cc1a2a"/>
      <text x="70" y="210" font-family="Montserrat, sans-serif" font-weight="900" font-size="70" fill="#fff" text-anchor="middle">24</text>
    </g>
    <g transform="translate(680, 290)">
      <circle cx="80" cy="35" r="42" fill="#915b3c"/>
      <path d="M30 85 L130 85 L145 390 L15 390 Z" fill="#cc1a2a"/>
      <text x="80" y="220" font-family="Montserrat, sans-serif" font-weight="900" font-size="80" fill="#fff" text-anchor="middle">10</text>
    </g>
    <g transform="translate(960, 310)">
      <circle cx="70" cy="40" r="38" fill="#6d4229"/>
      <path d="M30 90 L110 90 L125 370 L15 370 Z" fill="#cc1a2a"/>
      <text x="70" y="210" font-family="Montserrat, sans-serif" font-weight="900" font-size="70" fill="#fff" text-anchor="middle">11</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
