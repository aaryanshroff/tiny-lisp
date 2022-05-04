const DEBUG = false;
const TIME = false;

import * as readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";

type Sym = string;
type Num = number;
type Atom = Sym | Num;
type List = Array<Exp>;
type Exp = Atom | List;

class Env extends Map<string, Exp | Proc | Function> {
  outer: Env | null;

  constructor(params: Sym[] = [], args = [], outer = null) {
    super();
    params.forEach((p, i) => {
      this.set(p, args[i]);
    });
    this.outer = outer;
  }

  find(variable: string): Env | null {
    if (this.has(variable)) return this;
    else if (this.outer) return this.outer.find(variable);
    else return null;
  }
}

class Proc extends Function {
  params: List;
  body: Exp;
  env: Env;

  constructor(params: List, body: Exp, env: Env) {
    super();
    this.params = params;
    this.body = body;
    this.env = env;
    return new Proxy(this, {
      // @ts-ignore
      apply: (target, thisArg, argArray) => target.call(...argArray),
    });
  }

  call(args: List) {
    /* TODO: Handle invalid (non-string) params */
    // @ts-ignore
    return evaluate(this.body, new Env(this.params, args, this.env));
  }
}

function tokenize(chars: string): Array<string> {
  /* Convert a string of characters into a list of tokens */
  return chars
    .replaceAll("(", " ( ")
    .replaceAll(")", " ) ")
    .split(" ")
    .filter((r) => r != "");
}

function parse(program: string): Exp {
  /* Read a Scheme expression from a string. */
  return readFromTokens(tokenize(program));
}

function readFromTokens(tokens: Array<string>): Exp {
  /* Read an expression from a sequence of tokens */
  if (tokens.length == 0) {
    throw new SyntaxError("Unexpected EOF.");
  }
  const token = tokens.shift();
  if (token == "(") {
    let L: List = [];
    while (tokens[0] != ")") {
      L.push(readFromTokens(tokens));
    }
    tokens.shift();
    return L;
  } else if (token == ")") {
    throw new SyntaxError("Unexpected )");
  } else {
    return atom(token!);
  }
}

function atom(token: string): Atom {
  /* Numbers become numbers, every other token is a symbol. */
  const i = parseInt(token);
  if (isNaN(i)) {
    const f = parseFloat(token);
    if (isNaN(f)) {
      return token;
    }
    return f;
  }
  return i;
}

function standardEnv(): Env {
  /* An environment with some Scheme standard procedures */
  const env = new Env();
  /* TODO */
  // @ts-ignore
  const globals: Array<[string, Exp | Function]> = [
    ["+", (x: Array<Num>) => x.reduce((p, c) => p + c)],
    ["-", (x: Array<Num>) => x.reduce((p, c) => p - c)],
    ["*", (x: Array<Num>) => x.reduce((p, c) => p * c)],
    ["/", (x: Array<Num>) => x.reduce((p, c) => p / c)],
    [">", ([a, b]: Array<Num>) => a > b],
    [">=", ([a, b]: Array<Num>) => a >= b],
    ["<", ([a, b]: Array<Num>) => a < b],
    ["<=", ([a, b]: Array<Num>) => a <= b],
    ["=", ([a, b]: Array<Num>) => a == b],
    ["abs", ([x]: Array<Num>) => Math.abs(x)],
    ["apply", (proc: Function, args: List) => proc(args)],
    ["car", ([x]: [Array<Num>]) => x[0]],
    ["cdr", ([x]: [Array<Num>]) => x.slice(1)],
    ["cons", ([x, y]: [Num, Array<Num>]) => [x, ...y]],
    ["equal?", ([x, y]: [Atom, Atom]) => x == y],
    ["list", (x: Array<Num>) => x],
    ["pi", Math.PI],
    ["pow", ([a, b]: Array<Num>) => Math.pow(a, b)],
    ["begin", (x: List) => x.at(-1)],
  ];
  globals.forEach((t) => {
    env.set(t[0], t[1]);
  });
  return env;
}

const globalEnv = standardEnv();

function evaluate(x: Exp, env: Env = globalEnv): Exp | Proc {
  /* Evaluate an expression in an environment */
  DEBUG && console.log({ x });
  DEBUG && console.log({ env });
  while (true) {
    if (typeof x === "string") {
      DEBUG && console.log(env.find(x));
      const closestEnv = env.find(x);
      /* Safe because closestEnv exists iff x belongs to closestEnv  */
      // @ts-ignore
      if (closestEnv) return env.find(x)?.get(x);
      else throw new Error(`Undefined symbol '${x}'`);
    } else if (!Array.isArray(x)) {
      return x;
    }

    const [op, ...args] = x;
    DEBUG && console.log({ op }, { args });

    if (op === "quote") {
      return args[0];
    } else if (op === "if") {
      // @ts-ignore
      const [test, conseq, alt] = args;
      DEBUG && console.log({ test }, { conseq }, { alt });
      const pred = evaluate(test, env);
      DEBUG && console.log({ pred });
      if (Array.isArray(pred)) {
        /* [] is falsey in Lisp but truthy in JS */
        x = pred.length ? conseq : alt;
      } else {
        x = pred ? conseq : alt;
      }
    } else if (op === "define") {
      const [symbol, exp] = args;
      if (typeof symbol === "string") {
        env.set(symbol, evaluate(exp, env));
      } else {
        throw new SyntaxError(`Invalid identifier ${symbol}`);
      }
      return ""; // Ignored
    } else if (op === "set!") {
      const [symbol, exp] = args;
      if (typeof symbol === "string") {
        env.find(symbol)?.set(symbol, evaluate(exp, env));
      } else {
        throw new Error(`Undefined symbol '${symbol}'`);
      }
      return ""; // Ignored
    } else if (op === "lambda") {
      const [params, body] = args;
      if (Array.isArray(params)) {
        return new Proc(params, body, env);
      } else {
        throw new Error(`Invalid params '${params}'`);
      }
    } else {
      const proc = evaluate(op, env);
      DEBUG && console.log({ args });
      const vals = args.map((arg) => evaluate(arg, env));

      DEBUG && console.log({ vals });
      DEBUG && console.log({ proc });

      if (proc instanceof Proc) {
        DEBUG && console.log(proc.toString());
        DEBUG && console.log(proc(vals));
        x = proc.body;
        // TODO
        // @ts-ignore
        env = new Env(proc.params, vals, proc.env);
      } else if (proc instanceof Function) {
        // TODO
        // @ts-ignore
        return proc(vals);
      } else {
        throw new Error(`Undefined symbol '${proc}'`);
      }
    }
  }
}

const rl = readline.createInterface({ input, output });

function repl(rl: readline.Interface): void {
  /* A prompt-read-eval-print loop */
  rl.question("> ", (answer) => {
    TIME && console.time("evaluate");
    try {
      const val = evaluate(parse(answer));
      if (val !== "") console.log(val);
    } catch (e) {
      if (e instanceof Error) {
        console.error(`Error: ${e.message}`);
      }
    }
    TIME && console.timeEnd("evaluate");
    repl(rl);
  });
}

repl(rl);
