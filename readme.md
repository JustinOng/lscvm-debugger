# LSCVM

This VM runs on an interpreted language that runs against an input string.

There are two stacks:
1. General Purpose Stack: this is the traditional stack where operations like add and subtract work from.
  * It is important to note that other than the standard push and pop, **there is no way to arbitrarily access elements on the stack**
  * There are only opcodes to access the nth element from the *end* of the stack
2. Opcode Stack: this is a stack that can hold only the opcode indexes (ie the current opcode that is being executed)

There is also a Heap:
* This supports random access: there are opcodes provided that can read and write to specific locations on the heap

# Opcodes:

General principle: If an address is needed, it is popped first, then any other value

## Misc

### Nop
Opcodes: `<space>` (`0x20`), `<line feed>` (`0x0A`)

## Opcode Index Manipulation

### Call
Opcode: `C` (`0x43`)

Store the current `opcode_index` and jump to `pop()`

```
pusho(opcode_index)
opcode_index = pop()
```

### Return
Opcode: `R` (`0x52`)

Return from a previous `Call`

```
opcode_index = pop(opcode stack)
```

### Go (Relative)
Opcode: `G` (`0x47`)

Go (Jump) to an instruction relative to the current instruction

```
opcode_index += pop()
```

### Conditional Relative Jump
Opcode: `Z` (`0x5A`)

Jump to an address (`stack[-1]`) if zero (`stack[-2]`)

```
address = pop()
condition = pop()
if (condition == 0) opcode_index += address
```

### Exit
Opcode: `B` (`0x42`)

Exits the VM

## Print

### Print Number
Opcode: `I` (`0x49`)

Prints a number from the stack

```
printf("%d", pop())
```

### Print ASCII
Opcode: `P` (`0x50`)

Prints an ASCII character from the stack

```
putchar(pop() & 0x7F)
```

## Heap Manipulation

### Read
Opcode: `E` (`0x45`)

Read from the heap

```
address = pop()
push(heap[address])
```

### Write
Opcode: `K` (`0x4B`)

Write to the heap

```
address = pop()
heap[i] = address
```

## Stack - Manipulation

### Find
Opcode: `F` (`0x46`)

Clone: Find a value at nth position from the end and push to the stack

```
address = pop()
push(stack[-address])
```

### HelpNameMe
Opcode: `H` (`0x48`)

Same as Find, except that the value is then removed from the stack

```
address = pop()
push(stack[address])
del stack[address]
```

### Compare
Opcode: `J` (`0x4A`)

Compare two values on the stack

```
a = pop()
b = pop()
if (b > a) push(1)
elif (b < a) push(-1)
else push(0)
```

### Drop
Opcode: `D` (`0x44`)

Drops/Destroys the last value on the stack

```
pop()
```

## Stack - Arithmetic

The arithmetic operators use `stack[-2]` first, ie subtract is `stack[-2] - stack[-1]`

### Add
Opcode: `A` (`0x41`)

```
a = pop()
b = pop()
push(b + a)
```

### Subtract
Opcode: `S` (`0x53`)

```
a = pop()
b = pop()
push(b - a)
```

### Multiply
Opcode: `M` (`0x4D`)

```
a = pop()
b = pop()
push(b *+* a)
```

### Divide
Opcode: `V` (`0x56`)

Integer divide.

```
a = pop()
b = pop()
push(b / a)
```
