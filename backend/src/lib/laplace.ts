import { parse, simplify } from 'mathjs';
import type { MathNode } from 'mathjs';

/**
 * Transformada de Laplace simbólica basada en la tabla estándar.
 *
 * Soporta (con linealidad: sumas y múltiplos constantes):
 *   L{ 1 }        = 1/s
 *   L{ t }        = 1/s^2
 *   L{ t^n }      = n! / s^(n+1)          (n entero positivo)
 *   L{ e^(a*t) }  = 1 / (s - a)
 *   L{ sin(b*t) } = b / (s^2 + b^2)
 *   L{ cos(b*t) } = s / (s^2 + b^2)
 *   L{ sinh(b*t)}= b / (s^2 - b^2)
 *   L{ cosh(b*t)}= s / (s^2 - b^2)
 *
 * Más la propiedad de desplazamiento de frecuencia cuando se puede detectar
 * un factor e^(a*t) multiplicando el resto:
 *   L{ e^(a*t) * f(t) } = F(s - a)
 */

export interface LaplaceResult {
  original: string;
  transform: string;
  steps: string[];
}

function num(n: number): MathNode {
  return parse(String(n));
}

/** Desenvuelve paréntesis añadidos por el parser de mathjs. */
function unwrap(node: any): any {
  while (node?.isParenthesisNode) node = node.content;
  return node;
}

/** Devuelve el valor numérico de un nodo si es constante. */
function constValue(node: any): number | null {
  node = unwrap(node);
  if (node?.isConstantNode && typeof node.value === 'number') return node.value;
  if (node?.isOperatorNode && node.fn === 'unaryMinus' && node.args.length === 1) {
    const v = constValue(node.args[0]);
    return v === null ? null : -v;
  }
  if (node?.isOperatorNode && node.op === '-' && node.args.length === 2) {
    const a = constValue(node.args[0]);
    const b = constValue(node.args[1]);
    if (a !== null && b !== null) return a - b;
  }
  return null;
}

/** ¿El nodo es exactamente el símbolo t? */
function isT(node: any): boolean {
  node = unwrap(node);
  return node?.isSymbolNode === true && node.name === 't';
}

/** Construye el nodo s (variable de Laplace). */
function shiftS(expr: MathNode, k: number): MathNode {
  return expr.transform((node: any) =>
    node.isSymbolNode && node.name === 's' ? parse(`(s - ${k})`) : node
  );
}

/** Extrae el exponente a en e^(a*t); null si no aplica. */
function expExponent(node: any): number | null {
  node = unwrap(node);
  // mathjs interpreta e^(x) como OperatorNode ^ con base SymbolNode 'e'
  if (node?.isOperatorNode && node.op === '^' && node.args.length === 2) {
    const base = unwrap(node.args[0]);
    if (base?.isSymbolNode && base.name === 'e') {
      const exponent = node.args[1];
      return linearInT(exponent);
    }
  }
  // También maneja exp(a*t)
  if (node?.isFunctionNode && node.fn?.name === 'exp') {
    return linearInT(node.args[0]);
  }
  return null;
}

/** Si el nodo es de la forma k*t (o t), devuelve k; si es 0 devuelve 0. */
function linearInT(node: any): number | null {
  node = unwrap(node);
  if (isT(node)) return 1;
  // -t  ó  -k*t
  if (node?.isOperatorNode && node.fn === 'unaryMinus' && node.args.length === 1) {
    const inner = linearInT(node.args[0]);
    return inner === null ? null : -inner;
  }
  if (node?.isOperatorNode && node.op === '*' && node.args.length === 2) {
    const [a, b] = node.args;
    const va = constValue(a);
    const vb = constValue(b);
    if (va !== null && isT(b)) return va;
    if (isT(a) && vb !== null) return vb;
  }
  const v = constValue(node);
  if (v !== null) return 0; // e^const → constante
  return null;
}

/** Extrae el argumento b en sin(b*t)/cos(...)/sinh/cosh; null si no aplica. */
function trigArg(fnName: string, node: any): number | null {
  node = unwrap(node);
  if (!(node?.isFunctionNode && node.fn?.name === fnName)) return null;
  const arg = node.args[0];
  const b = linearInT(arg);
  return b === null ? null : b;
}

/** L{ f(t) } para casos base. Devuelve null si no puede resolver. */
function laplaceBase(node: any, steps: string[]): MathNode | null {
  node = unwrap(node);
  // Constante
  const c = constValue(node);
  if (c !== null) {
    steps.push(`L{ ${c} } = ${c}/s`);
    if (c === 0) return num(0);
    return simplify(parse(`${c}/s`)) as MathNode;
  }

  // t^n
  if (isT(node)) {
    steps.push('L{ t } = 1/s^2');
    return parse('1/s^2');
  }
  if (node?.isOperatorNode && node.op === '^' && node.args.length === 2) {
    const base = node.args[0];
    const exp = constValue(node.args[1]);
    if (isT(base) && exp !== null && Number.isInteger(exp) && exp >= 0) {
      const fact = factorial(exp);
      steps.push(`L{ t^${exp} } = ${exp}! / s^(${exp}+1) = ${fact} / s^${exp + 1}`);
      return parse(`${fact} / s^${exp + 1}`);
    }
    // e^(a*t)
    const a = expExponent(node);
    if (a !== null) {
      steps.push(`L{ e^(${a}t) } = 1 / (s - (${a}))`);
      return parse(`1 / (s - (${a}))`);
    }
  }

  // exp(a*t)
  if (node?.isFunctionNode && node.fn?.name === 'exp') {
    const a = linearInT(node.args[0]);
    if (a !== null) {
      steps.push(`L{ e^(${a}t) } = 1 / (s - (${a}))`);
      return parse(`1 / (s - (${a}))`);
    }
  }

  // sin / cos / sinh / cosh
  for (const [fn, formula] of [
    ['sin', 'b / (s^2 + b^2)'],
    ['cos', 's / (s^2 + b^2)'],
    ['sinh', 'b / (s^2 - b^2)'],
    ['cosh', 's / (s^2 - b^2)']
  ] as const) {
    const b = trigArg(fn, node);
    if (b !== null) {
      steps.push(`L{ ${fn}(${b}t) } = ${formula.replace(/b/g, `(${b})`)}`);
      return parse(formula.replace(/b/g, `(${b})`));
    }
  }

  return null;
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** L{ f(t) } con linealidad y desplazamiento de frecuencia. */
function laplace(node: any, steps: string[]): MathNode | null {
  node = unwrap(node);
  // Sumas y restas: linealidad
  if (node?.isOperatorNode && (node.op === '+' || node.op === '-') && node.args.length === 2) {
    const left = laplace(node.args[0], steps);
    const right = laplace(node.args[1], steps);
    if (left === null || right === null) return null;
    return simplify(parse(`(${left}) ${node.op} (${right})`)) as MathNode;
  }

  // Producto: separa factor constante y factor exponencial (desplazamiento)
  if (node?.isOperatorNode && node.op === '*' && node.args.length === 2) {
    const [a, b] = node.args;

    // k * f(t)
    const ka = constValue(a);
    if (ka !== null) {
      const inner = laplace(b, steps);
      if (inner === null) return null;
      return simplify(parse(`(${ka}) * (${inner})`)) as MathNode;
    }
    const kb = constValue(b);
    if (kb !== null) {
      const inner = laplace(a, steps);
      if (inner === null) return null;
      return simplify(parse(`(${kb}) * (${inner})`)) as MathNode;
    }

    // e^(a*t) * f(t)
    const ea = expExponent(a);
    if (ea !== null) {
      const inner = laplace(b, steps);
      if (inner === null) return null;
      steps.push(`Desplazamiento de frecuencia: F(s) → F(s - (${ea}))`);
      return simplify(shiftS(inner, ea)) as MathNode;
    }
    const eb = expExponent(b);
    if (eb !== null) {
      const inner = laplace(a, steps);
      if (inner === null) return null;
      steps.push(`Desplazamiento de frecuencia: F(s) → F(s - (${eb}))`);
      return simplify(shiftS(inner, eb)) as MathNode;
    }
  }

  // División por constante: (1/k) * f(t)
  if (node?.isOperatorNode && node.op === '/' && node.args.length === 2) {
    const denom = constValue(node.args[1]);
    if (denom !== null && denom !== 0) {
      const inner = laplace(node.args[0], steps);
      if (inner === null) return null;
      return simplify(parse(`(${inner}) / (${denom})`)) as MathNode;
    }
  }

  return laplaceBase(node, steps);
}

/** Formatea el nodo como string limpio usando el parser de mathjs. */
function toLatexLike(node: MathNode): string {
  return node.toString();
}

export function laplaceTransform(expression: string): LaplaceResult {
  const cleaned = expression.replace(/\s+/g, '');
  if (!cleaned) throw new Error('Expresión vacía');

  const tree = parse(cleaned);
  const steps: string[] = [`Expresión: ${expression}`];

  const result = laplace(tree as any, steps);
  if (result === null) {
    throw new Error(
      'No se pudo calcular la transformada. Esta implementación soporta polinomios en t, ' +
        'e^(a*t), sin(b*t), cos(b*t), sinh(b*t), cosh(b*t) y sus combinaciones lineales.'
    );
  }

  const simplified = simplify(result) as MathNode;
  steps.push(`Resultado: F(s) = ${toLatexLike(simplified)}`);

  return {
    original: expression,
    transform: toLatexLike(simplified),
    steps
  };
}
