const fs = require('fs');
let data = fs.readFileSync('js/forms.js', 'utf8');

// 1. Remove button from btnComprobanteHTML
data = data.replace(/\$\s*\{\s*neg\s*&&\s*!neg\.autorizado_promesa\s*\?\s*`\s*<button type="button" id="btn-gerente-autorizar-promesa-ficha"[^`]+`\s*:\s*\(neg\s*&&\s*neg\.autorizado_promesa\s*\?\s*`[^`]+`\s*:\s*''\)\}/g, '');
// Also remove the old broken encoding version just in case
data = data.replace(/\$\s*\{\s*neg\s*&&\s*!neg\.autorizado_promesa\s*\?\s*`\s*<button type="button" id="btn-gerente-autorizar-promesa-ficha"[^`]+`\s*:\s*''\}/g, '');

// 2. Remove the first event listener
data = data.replace(/\/\/\s*Bind event listeners[\s\S]*?btnAuthFicha\.addEventListener\('click', \(\) => \{[\s\S]*?\}\);\s*\}/g, '// Bind event listeners');

// 3. Remove the second button
data = data.replace(/\$\s*\{\s*neg\s*&&\s*!neg\.autorizado_promesa\s*\?\s*"\\n\s*<button type=\\"button\\" id=\\"btn-gerente-autorizar-promesa\\"[^"]+"\s*:\s*''\}/g, '');

// 4. Remove the second event listener
data = data.replace(/\/\/\s*btn-gerente-autorizar-promesa event listener[\s\S]*?if \(role === 'gerente' && neg\) \{[\s\S]*?const btnAuth = container\.querySelector\('#btn-gerente-autorizar-promesa'\);[\s\S]*?if \(btnAuth\) \{[\s\S]*?\}\);\s*\}\s*\}/g, '');

// 5. Unblock the Admin form
data = data.replace(/\$\s*\{\s*neg\s*&&\s*!neg\.autorizado_promesa\s*\?\s*"[^"]+"\s*:\s*"\\n\s*<button type=\\"button\\" id=\\"btn-submit-promesa\\"[^"]+"\}/g, '<button type="button" id="btn-submit-promesa" class="btn btn-primary" style="margin-top: 10px;"><i class="fa-solid fa-file-contract"></i> Firmar Promesa</button>');

fs.writeFileSync('js/forms.js', data);
console.log("Workflow fixed in forms.js");
