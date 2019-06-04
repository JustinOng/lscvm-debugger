let ops = [];
let display_loaded;
let display_ip;
let display_print;
let display_heap;
let display_stack;
let display_instructions;

window.onload = () => {
  load_input(document.querySelector("#input"));
  display_loaded = document.querySelector("#display-loaded");
  display_ip = document.querySelector("#display-ip");
  display_print = document.querySelector("#display-print");
  display_heap = document.querySelector("#display-heap");
  display_stack = document.querySelector("#display-stack");
  display_instructions = document.querySelector("#display-instructions");
}

function load() {
  const code = document.querySelector("#input").value;
  
  ops = code.split("").map((chr) => {
    return chr.charCodeAt(0);
  });

  display_loaded.innerText = ops.length;
  display_ip.innerText = ip;
  print_instructions();
}

function vm_reset() {
  ip = 0;
  display_ip.innerText = ip;
  display_print.innerHTML = "";
  stack.clear();
  heap.clear();
  dump_mem(display_heap, heap.get());
  dump_mem(display_stack, stack.get());
}

function vm_start() {
  vm_reset();
  nextTick(continue_op);
}

function vm_continue() {
  nextTick(continue_op);
}

function vm_single_step() {
  continue_op(true);
}

function continue_op(step) {
  let error;

  if (ip >= ops.length) {
    return;
  }

  try {
    op_exec(ops[ip]);
    ip ++;
    display_ip.innerText = ip;
  } catch(err) {
    console.error(`Failed to execute ${ip}: ${err}`)
    error = err;
  }
  
  const breakpoint = breakpoints.indexOf(ip) !== -1;
  if (error || ip >= ops.length || breakpoint || step) {
    dump_mem(display_heap, heap.get());
    dump_mem(display_stack, stack.get());

    if (error) {
      display_ip.innerText += " (Error)";
    } else if (breakpoint) {
      display_ip.innerText += " (Breakpoint)";
    } else if (step) {
      display_ip.innerText += " (Single Step)";
    }else {
      display_ip.innerText += " (Done)";
    }

    if (error || breakpoint) {
      print_instructions();
    }

    return;
  } else {
    nextTick(continue_op);
  }
}

function dump_mem(ele, mem) {
  // ele: table element
  // mem: array
  let html = "";
  for (const i in mem) {
    const data = mem[i];
    html += `<tr><td>${i}</td><td>${data}</td><td>${data.toString(16)}</td><td>${data >= 0x20 && data <= 0x7f ? String.fromCharCode(data):"."}</td></tr>`;
  }
  ele.querySelector("tbody").innerHTML = html;
}

function print_output(data) {
  let str = false;

  if (data.length === 1) {
    if (
      // if its a invalid ascii character return the hex representation
      (data.charCodeAt(0) < 0x20 || data.charCodeAt(0) > 0x7F)
      // and if its not a LF/CR
       && data.charCodeAt(0) !== 0x0A
       && data.charCodeAt(0) !== 0x0D
    ) {
      console.log(data.charCodeAt(0), data.toString(16));
      str = "0x" + data.toString(16);
    }
  }

  if (str === false) {
    console.log(`"${data}"`)
    str = data.toString();
  }

  display_print.innerText += str;
}

function print_instructions() {
  let html = "";
  for (const i in ops) {
    const op = ops[i];

    if (breakpoints.indexOf(parseInt(i)) !== -1) {
      html += `<tr><td class="bp-set" title="Clear Breakpoint" onclick="clear_breakpoint(this.innerText)">${i}</td><td>${op.toString(16).padStart(2, "0")}</td><td>${op_describe(op)}</td></tr>`;
    } else {
      html += `<tr><td title="Set Breakpoint" onclick="set_breakpoint(this.innerText);">${i}</td><td>${op.toString(16).padStart(2, "0")}</td><td>${op_describe(op)}</td></tr>`;
    }
  }

  display_instructions.querySelector("tbody").innerHTML = html;
}

function set_breakpoint(ip) {
  ip = parseInt(ip);
  if (breakpoints.indexOf(ip) === -1) {
    breakpoints.push(ip);
  }

  console.log(`Added breakpoint at ${ip}`);
  print_instructions();
  console.log(breakpoints);
}

function clear_breakpoint(ip) {
  ip = parseInt(ip);
  const index = breakpoints.indexOf(ip);
  if (index === -1) return;

  breakpoints.splice(index, 1);

  console.log(`Cleared breakpoint at ${ip}`);
  print_instructions();
}

function load_input(ele) {
  ele.value = localStorage.getItem("code") || "";
}

function save_input(ele) {
  localStorage.setItem("code", ele.value);
}

// hack for faster setTimeout
// https://github.com/medikoo/next-tick/blob/master/index.js
const nextTick = (function() {
  var ensureCallable = function (fn) {
    if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
    return fn;
  };
  
  var byObserver = function (Observer) {
    var node = document.createTextNode(''), queue, currentQueue, i = 0;
    new Observer(function () {
      var callback;
      if (!queue) {
        if (!currentQueue) return;
        queue = currentQueue;
      } else if (currentQueue) {
        queue = currentQueue.concat(queue);
      }
      currentQueue = queue;
      queue = null;
      if (typeof currentQueue === 'function') {
        callback = currentQueue;
        currentQueue = null;
        callback();
        return;
      }
      node.data = (i = ++i % 2); // Invoke other batch, to handle leftover callbacks in case of crash
      while (currentQueue) {
        callback = currentQueue.shift();
        if (!currentQueue.length) currentQueue = null;
        callback();
      }
    }).observe(node, { characterData: true });
    return function (fn) {
      ensureCallable(fn);
      if (queue) {
        if (typeof queue === 'function') queue = [queue, fn];
        else queue.push(fn);
        return;
      }
      queue = fn;
      node.data = (i = ++i % 2);
    };
  };

  if ((typeof document === 'object') && document) {
    if (typeof MutationObserver === 'function') return byObserver(MutationObserver);
    if (typeof WebKitMutationObserver === 'function') return byObserver(WebKitMutationObserver);
  }
})();
