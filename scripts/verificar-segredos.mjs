import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const forbidden = files.filter(path => /(^|\/)(\.verification|node_modules|\.wrangler|dist)\//.test(path)
  || /(^|\/)(\.dev\.vars(?:\..*)?|\.env(?:\..*)?)$/.test(path) && !path.endsWith('.env.example'));
if (forbidden.length) throw new Error('Arquivos privados foram incluídos no Git. Remova-os do índice antes de publicar.');
const vars = existsSync('.dev.vars') ? parseEnv(readFileSync('.dev.vars', 'utf8')) : {};
const secret = vars.APPS_SCRIPT_SECRET;
if (secret) {
  for (const path of files) {
    const content = execFileSync('git', ['show', ':' + path], { maxBuffer: 30 * 1024 * 1024 });
    if (content.includes(Buffer.from(secret))) throw new Error('A chave privada foi encontrada em um arquivo do Git. Publicação interrompida.');
  }
}
console.log('Arquivos do Git verificados: configurações privadas e chave da integração não serão enviadas.');
