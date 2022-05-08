# Tiny Lisp

A minimal Lisp interpreter and REPL written in Typescript with support for mutation, lambda functions, conditionals and lists.

## Running the REPL

1. Install required dependencies (`typescript` and `ts-node`):
   ```
   npm install
   ```
2. Run `main.ts` file with `ts-node`:
   ```
   npx ts-node main.ts
   ```

## Sample Program(s)

Simple bank

```lisp
> (define balance 0)
> (define deposit (lambda (amt) (set! balance (+ balance amt))))
> (define withdraw (lambda (amt) (if (>= balance amt) (set! balance (- balance amt)) (quote Unsuccessful))))
> balance
0
> (deposit 100)
> balance
100
> (withdraw 200)
Unsuccessful
> (withdraw 50)
> balance
50
```

Tail recursive nth fibonacci

```lisp
> (define fib-tr (lambda (n next result) (if (= n 0) result (fib-tr (- n 1) (+ next result) next))))
> (define fib (lambda (n) (fib-tr n 1 0)))
> (fib 47)
2971215073
evaluate: 1.431ms
```

## Language Features

### Variables

(define _variable-name_ _value_)

```lisp
> (define x 5)
> x
5
```

(set! _existing-variable_ _new-value_)

```lisp
> (set! x 10)
> x
10
```

### Lambda functions

(define _function-name_ (lambda (_params_) (_body_)))

```lisp
> (define sum (lambda (a b) (+ a b)))
> (sum 5 3)
8
```

### Conditionals

(if (_condition_) (_then_) (_else_))

```lisp
> (if (> 5 3) (quote Greater) (quote Less))
Greater
> (if (> 5 10) (quote Greater) (quote Less))
Less
```

### Lists

Empty list

```lisp
> (define L (list ))
> L
[]
```

`list` notation

```lisp
> (define L (list 5 3 1))
> (car L)
5
> (cdr L)
[ 3, 1 ]
```

`cons` notation

```lisp
> (define L (cons 5 (cons 3 (cons 1 (list )))))
```

### Begin

```lisp
> (begin (define L 5) (+ L 10))
15
```

## References

Inspired by [Peter Norvig's Lisp in 90 lines of Python](http://norvig.com/lispy.html)
