function opcodeToStr(code) {
  return code.map((i) => {
    return String.fromCharCode(i);
  }).join("");
}

function strToOpcode(str) {
  return str.split("").map((c) => {
    return c.charCodeAt(0);
  });
}

// https://stackoverflow.com/a/40200710
function isPrime(num) {
  for(var i = 2; i < num; i++)
    if(num % i === 0) return false;
  return num > 1;
}

function num(i) {
  return opcodeToStr(gen_num(i));
}

function gen_num(i) {
  const out = [];
  if (i === 0) {
    return [0x61];
  }

  let first = true;
  while (i > 0) {
    if (i < 9) {
      out.push(0x61 + i);
      i = 0;
    }
    else {
      out.push(0x6a);
      i -= 9;
    }

    if (!first) {
      out.push(0x41) // add
    }

    first = false;
  }

  return out
}

function gen_num_padded(i, pad) {
  // generates code to create i padded to pad
  // throws an error if length of the generated number is more than pad
  const out = gen_num(i);
  if (out.length > pad) {
    throw Error(`Failed to generate ${i} in ${cap} chars`);
  }

  const origLength = out.length;
  out.length = pad;
  out.fill(0x20, origLength);

  return out;
}

function loop(posStart, endVal, body) {
  // j bF bF aJ jZ jjMjAiAP bS a fgM  SG
  // posStart: position of counter variable from the end of stack
  // endVal: value at which to stop
  // code to execute in a loop
  // code is assumed to clean up after itself on the stack
  const HEADER_MAX_NUM_LEN = 10;
  const FOOTER_MAX_NUM_LEN = 10;
  // FOOTER_MAX_LEN should be num_opcodes_inside + FOOTER_MAX_NUM_LEN
  const FOOTER_LEN = 15;

  const code = strToOpcode(body);

  // header of the loop
  // compares the counter and endVal, jump past the loop if matches
  const header = [
    ...gen_num(posStart),
    0x46,                     // copy
    ...gen_num(endVal),
    0x4a                      // compare
  ];

  // footer of the loop
  // pushes length of the header + body + footer
  // but i dont know the footer without knowing the length of the footer etc etc
  // so i'm going to make a guess that the footer is at most length 10 
  // and pad with nops
  const footer = [
    0x62,
    0x53,     // subtract 1 from counter
    0x61,
    // +1 is just to solve a off by one error (i think IP incrementing?)
    ...gen_num_padded(1 + header.length + HEADER_MAX_NUM_LEN + code.length + FOOTER_LEN, FOOTER_MAX_NUM_LEN),
    0x53,     // subtract to get negative number to jump with
    0x47      // relative jump
  ];

  const out = [
    ...header,
    // first +1 because of the 0x5a below
    ...gen_num_padded(1 + code.length + footer.length, HEADER_MAX_NUM_LEN),
    0x5a, // conditional jump
    ...code,
    ...footer
  ];

  return opcodeToStr(out);
}
