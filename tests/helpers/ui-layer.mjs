// Bis zum Zusammenzug trug jede Oberflaechen-Datei ihr Stylesheet als Textblock bei sich, und die
// Tests konnten eine Ebene komplett pruefen, indem sie die eine Datei lasen. Die Stile stehen jetzt
// in promptai-ui-layers.css, nach Herkunft beschriftet. layer() holt beides wieder zusammen: den
// Programmteil aus der Datei und genau den Stil-Abschnitt, der aus ihr stammt - nicht die ganze
// Sammlung, sonst wuerde ein Test gruen, weil irgendeine andere Ebene die Regel mitbringt.
import {readFile} from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const cache=new Map();

export async function text(file){
  if(!cache.has(file))cache.set(file,readFile(new URL(file,root),'utf8'));
  return cache.get(file);
}

export async function layerCss(file){
  const css=await text('promptai-ui-layers.css');
  const start=css.indexOf(`/* ===== ${file} ·`);
  if(start<0)return '';
  const next=css.indexOf('/* ===== ',start+9);
  return css.slice(start,next<0?css.length:next);
}

export async function layer(file){
  return `${await text(file)}\n${await layerCss(file)}`;
}
