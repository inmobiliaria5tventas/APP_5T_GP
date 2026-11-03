const fs = require('fs');
let data = fs.readFileSync('js/forms.js', 'utf8');

const regex = /Notar.a: Autorizar Promesa<\/button>\s*` : ''}/;
const replacement = `Notaría: Autorizar Promesa</button>
          \` : (neg && neg.autorizado_promesa ? \`
          <button type="button" class="btn btn-warning" style="width: 100%; padding: 8px; opacity: 0.5; cursor: not-allowed;" disabled><i class="fa-solid fa-check-double"></i> Promesa Autorizada</button>
          \` : '')}`;

data = data.replace(regex, replacement);

fs.writeFileSync('js/forms.js', data);
console.log("Fixed!");
