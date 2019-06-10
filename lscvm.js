class Heap {
  constructor() {
    this.MAX_LENGTH = 0x3FFF;
    this.heap = [];
  }

  read(i) {
    if (!(i >= 0 && i <= this.MAX_LENGTH)) {
      throw Error(`Memory read access violation: ${i}`);
    }

    return typeof this.heap[i] === "undefined" ? 0 : this.heap[i];
  }

  write(i, data) {
    if (typeof data === "undefined") {
      throw Error(`Write of undefined to heap[${i}]`);
    }
    this.heap[i] = data;
  }

  get() {
    return this.heap;
  }

  clear() {
    this.heap.length = 0;
  }
}

class Stack {
  constructor() {
    this.stack = [];
  }

  read(i) {
    if ((this.stack.length - i - 1) < 0) {
      throw new Error(`Reading out of stack bounds: ${i}`);
    }
    
    return this.stack[this.stack.length - 1 - i];
  }

  pop(i) {
    if (!this.stack.length) {
      throw Error("Stack underflow");
    }

    if (i) {
      if (i >= this.stack.length) {
        throw Error(`Del error: ${i}`);
      }
      return this.stack.splice(i, 1)[0];
    } else {
      return this.stack.pop();
    }
  }

  push(data) {
    if (typeof data === "undefined") {
      throw Error("Stack.push with undefined?");
    }
    this.stack.push(data);
  }

  get() {
    return this.stack;
  }

  clear() {
    this.stack.length = 0;
  }
}

const heap = new Heap();
const stack = new Stack();
const op_stack = new Stack();

let ip = 0;
let breakpoints = [];

function op_describe(op) {
  switch(op) {
    case 10:
    case 0x20:
    default:
      return "nop";
    case 0x41:
      return "add";
    case 0x42:
      return "exit";
    case 0x43:
      return "call";
    case 0x44:
      return "remove top of stack";
    case 0x45:
      return "read heap";
    case 0x46:
      return "copy from end of stack and push";
    case 0x47:
      return "relative jump";
    case 0x48:
      return "remove from end of stack and push";
    case 0x49:
      return "print int";
    case 0x4a:
      return "compare";
    case 0x4b:
      return "write heap"
    case 0x4d:
      return "multiply";
    case 0x50:
      return "print char";
    case 0x52:
      return "return";
    case 0x53:
      return "subtract";
    case 0x56:
      return "int divide";
    case 0x5a:
      return "conditional relative jump"
    case 0x61:
    case 0x62:
    case 0x63:
    case 0x64:
    case 0x65:
    case 0x66:
    case 0x67:
    case 0x68:
    case 0x69:
    case 0x6a:
      return `push ${op - 0x61}`;
  }
}

function op_exec(op) {
  let a, b, c, i;

  switch(op) {
    case 10:
    case 0x20:
    default:
      // nop
      break;
    case 0x41:
      // add ints
      stack.push(stack.pop() + stack.pop());
      break;
    case 0x42:
      vm_exit();
      return "Exit"
    case 0x43:
      // call
      op_stack.push(ip);
      i = stack.pop();
      // i - 1 because this will be incremented after this is executed
      ip = i - 1;
      return `call ${i}`
    case 0x44:
      stack.pop();
      break;
    case 0x45:
      // read from heap
      i = stack.pop();
      stack.push(heap.read(i));
      break;
    case 0x46:
      // clone from end of stack
      i = stack.pop();
      stack.push(stack.read(i));
      break;
    case 0x47:
      // relative jump
      i = ip;
      ip += stack.pop();
      return `jump from ${i} to ${ip}`
    case 0x48:
      // remove from stack and push
      i = stack.pop();
      stack.push(stack.pop(i));
      break;
    case 0x49:
      // print
      i = stack.pop();
      print_output(i);
      break;
    case 0x4a:
      // compare
      a = stack.pop();
      b = stack.pop();
      c = 0;
      if (a == b) {
        c = 0;
      } else if (a < b) {
        c = 1;
      } else {
        c = -1;
      }
      stack.push(c);
      return `compare(${b}, ${a})= ${c}`
    case 0x4b:
      // heap write
      i = stack.pop();
      const data = stack.pop();
      heap.write(i, data);
      break;
    case 0x4d:
      // multiply
      stack.push(stack.pop() * stack.pop());
      break;
    case 0x50:
      // print ascii character
      i = stack.pop();
      print_output(String.fromCharCode(i & 0x7f));
      break;
    case 0x52:
      // return
      ip = op_stack.pop()
      return `return to ${ip}`
    case 0x53:
      // subtract
      a = stack.pop();
      b = stack.pop();
      stack.push(b - a);
      break;
    case 0x56:
      // divide
      a = stack.pop();
      b = stack.pop();
      stack.push(Math.floor(b/a));
      break;
    case 0x5a:
      // conditional relative jump
      a = stack.pop();
      b = stack.pop();
      if (b === 0) {
        i = ip;
        ip += a;
        return `jump from ${i} to ${ip}`
      }
      break;
    case 0x61:
    case 0x62:
    case 0x63:
    case 0x64:
    case 0x65:
    case 0x66:
    case 0x67:
    case 0x68:
    case 0x69:
    case 0x6a:
      stack.push(op - 0x61);
      break;
  }
}
