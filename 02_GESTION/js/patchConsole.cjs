const fs = require('fs');
let code = fs.readFileSync('forms.js', 'utf8');

code = code.replace(
    /function _renderFichaGerencial\(container, propiedad, neg\) \{/,
    "function _renderFichaGerencial(container, propiedad, neg) {\n      console.log('RENDERIZANDO FICHA GERENCIAL', estado, role, neg);"
);

fs.writeFileSync('forms.js', code);
