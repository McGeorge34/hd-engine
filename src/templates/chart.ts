import { HDChart } from '../lib/humandesign';

export function generateChartHTML(chart: HDChart): string {
  const personalityGatesSorted = [...new Set(chart.personalityGates)].sort((a, b) => a - b);
  const designGatesSorted = [...new Set(chart.designGates)].sort((a, b) => a - b);
  const channelsList = chart.definedChannels.map(([a, b]) => `${a}-${b}`).join(', ') || 'Ninguno';

  const planetOrder = ['Sun', 'Earth', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const planetLabels: Record<string, string> = {
    Sun: '☉ Sol', Earth: '⊕ Tierra', Moon: '☽ Luna',
    Mercury: '☿ Mercurio', Venus: '♀ Venus', Mars: '♂ Marte',
    Jupiter: '♃ Júpiter', Saturn: '♄ Saturno', Uranus: '♅ Urano',
    Neptune: '♆ Neptuno', Pluto: '♇ Plutón'
  };

  const planetRows = planetOrder.map(planet => {
    const p = chart.positions.personality[planet];
    const d = chart.positions.design[planet];
    if (!p || !d) return '';
    return `
      <tr>
        <td class="planet-label">${planetLabels[planet] || planet}</td>
        <td class="gate-p">${p.gate}.${p.line}</td>
        <td class="lon-p">${p.longitude.toFixed(2)}°</td>
        <td class="gate-d">${d.gate}.${d.line}</td>
        <td class="lon-d">${d.longitude.toFixed(2)}°</td>
      </tr>`;
  }).join('');

  const designDateStr = chart.positions.designDate
    ? new Date(chart.positions.designDate).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
      })
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Carta de Diseño Humano – ${chart.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Georgia', serif;
      background: #fff;
      color: #222;
      padding: 20px;
      font-size: 13px;
    }
    .page { max-width: 760px; margin: 0 auto; }

    /* Header */
    .header {
      text-align: center;
      border-bottom: 3px solid #c8960a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 { font-size: 26px; color: #1a1a2e; letter-spacing: 1px; }
    .header .subtitle { font-size: 14px; color: #666; margin-top: 6px; }
    .header .meta { font-size: 12px; color: #888; margin-top: 4px; }

    /* Section titles */
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: #c8960a;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #e5d0a0;
      padding-bottom: 4px;
      margin: 20px 0 10px;
    }

    /* Data table */
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table td { padding: 6px 8px; border-bottom: 1px solid #f0e8d0; }
    .data-table td:first-child { font-weight: bold; color: #555; width: 40%; }
    .data-table td:last-child { color: #1a1a2e; }

    /* Type badge */
    .type-badge {
      display: inline-block;
      background: #1a1a2e;
      color: #f0c040;
      padding: 6px 20px;
      border-radius: 20px;
      font-size: 16px;
      font-weight: bold;
      margin: 8px 0 12px;
    }

    /* Planet table */
    .planet-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px; }
    .planet-table th {
      background: #f0e8d0;
      padding: 5px 6px;
      text-align: center;
      font-weight: bold;
      font-size: 10px;
      color: #5a4010;
      border-bottom: 2px solid #c8960a;
    }
    .planet-table td { padding: 4px 6px; border-bottom: 1px solid #f5f0e8; text-align: center; }
    .planet-label { text-align: left !important; font-weight: bold; color: #333; }
    .gate-p { color: #1a1a2e; font-weight: bold; }
    .gate-d { color: #c0392b; font-weight: bold; }
    .lon-p { color: #666; font-size: 10px; }
    .lon-d { color: #b05050; font-size: 10px; }

    /* Gates tags */
    .gates-container { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .gate-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: bold;
    }
    .gate-p-tag { background: #1a1a2e; color: white; }
    .gate-d-tag { background: #c0392b; color: white; }

    /* Variables grid */
    .var-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
    .var-item { background: #f8f4ec; border-left: 3px solid #c8960a; padding: 6px 10px; }
    .var-item .var-key { font-size: 10px; color: #888; text-transform: uppercase; }
    .var-item .var-val { font-size: 12px; font-weight: bold; color: #333; margin-top: 2px; }

    /* Design date */
    .design-date {
      font-size: 11px;
      color: #c0392b;
      margin-top: 6px;
    }

    /* Footer */
    .footer {
      text-align: center;
      font-size: 10px;
      color: #aaa;
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }

    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <h1>${chart.name}</h1>
      <div class="subtitle">Carta de Diseño Humano</div>
      <div class="meta">
        Nacimiento: ${chart.birthdate} a las ${chart.birthtime} &middot; ${chart.birthplace}
      </div>
    </div>

    <!-- Tipo & Estrategia -->
    <div class="section-title">Tipo &amp; Estrategia</div>
    <div style="text-align:center;">
      <span class="type-badge">${chart.type}</span>
    </div>
    <table class="data-table">
      <tr><td>Estrategia</td><td>${chart.strategy}</td></tr>
      <tr><td>Autoridad Interna</td><td>${chart.authority}</td></tr>
      <tr><td>Definición</td><td>${chart.definition}</td></tr>
      <tr><td>Perfil</td><td>${chart.profile}</td></tr>
      <tr><td>Cruz de Encarnación</td><td>${chart.crossOfIncarnation}</td></tr>
      <tr><td>Tema del No-Ser</td><td>${chart.notSelfTheme}</td></tr>
    </table>

    <!-- Centros -->
    <div class="section-title">Centros</div>
    <table class="data-table">
      <tr><td>Definidos</td><td>${chart.definedCenters.join(', ') || '–'}</td></tr>
      <tr><td>Abiertos</td><td>${chart.undefinedCenters.join(', ') || '–'}</td></tr>
    </table>

    <!-- Canales -->
    <div class="section-title">Canales Definidos</div>
    <p style="font-size:12px; color:#333; line-height:1.8;">${channelsList}</p>

    <!-- Variables -->
    <div class="section-title">Variables (PHS)</div>
    <div class="var-grid">
      <div class="var-item"><div class="var-key">Digestión</div><div class="var-val">${chart.variables.digestion}</div></div>
      <div class="var-item"><div class="var-key">Cognición</div><div class="var-val">${chart.variables.cognition}</div></div>
      <div class="var-item"><div class="var-key">Motivación</div><div class="var-val">${chart.variables.motivation}</div></div>
      <div class="var-item"><div class="var-key">Perspectiva</div><div class="var-val">${chart.variables.perspective}</div></div>
      <div class="var-item"><div class="var-key">Ambiente</div><div class="var-val">${chart.variables.environment}</div></div>
    </div>

    <!-- Posiciones Planetarias -->
    <div class="section-title">Posiciones Planetarias</div>
    <table class="planet-table">
      <thead>
        <tr>
          <th class="planet-label">Planeta</th>
          <th colspan="2" style="color:#1a1a2e;">Personalidad (consciente)</th>
          <th colspan="2" style="color:#c0392b;">Diseño (inconsciente)</th>
        </tr>
        <tr>
          <th></th>
          <th>Puerta.Línea</th><th>Grado</th>
          <th>Puerta.Línea</th><th>Grado</th>
        </tr>
      </thead>
      <tbody>${planetRows}</tbody>
    </table>
    ${designDateStr ? `<p class="design-date">Fecha de Diseño (Inconsciente): ${designDateStr} UTC</p>` : ''}

    <!-- Puertas Activadas -->
    <div class="section-title">Puertas Activadas</div>
    <p style="font-size:11px; font-weight:bold; color:#1a1a2e; margin-bottom:6px;">Personalidad:</p>
    <div class="gates-container">
      ${personalityGatesSorted.map(g => `<span class="gate-tag gate-p-tag">${g}</span>`).join('')}
    </div>
    <p style="font-size:11px; font-weight:bold; color:#c0392b; margin:10px 0 6px;">Diseño:</p>
    <div class="gates-container">
      ${designGatesSorted.map(g => `<span class="gate-tag gate-d-tag">${g}</span>`).join('')}
    </div>

    <div class="footer">
      Generado por HD Engine &middot; ${new Date().toLocaleDateString('es-MX')}
    </div>
  </div>
</body>
</html>`;
}
