"""Bounded static reader for generated Lua 5.4 table chunks; NEVER runs Lua.

Supports only straight-line literal table construction. Calls, branches, closures,
arithmetic and arbitrary globals fail closed. This is not a general Lua VM.
"""
import struct

HEADER = b"\x1bLua\x54\x00\x19\x93\r\n\x1a\n\x04\x08\x08" + struct.pack("<qd", 0x5678, 370.5)
MAX_BYTES = 16 * 1024 * 1024
MAX_ITEMS = 500_000
# Lua 5.4 instruction numbers, not executable runtime bindings.
OPS = {0: "MOVE", 1: "LOADI", 2: "LOADF", 3: "LOADK", 4: "LOADKX",
       5: "LOADFALSE", 7: "LOADTRUE", 8: "LOADNIL", 11: "GETTABUP",
       14: "GETFIELD", 16: "SETTABLE", 17: "SETI", 18: "SETFIELD",
       19: "NEWTABLE", 70: "RETURN", 71: "RETURN0", 72: "RETURN1",
       78: "SETLIST", 81: "VARARGPREP", 82: "EXTRAARG"}


def restore(data):
    """Reverse build-344's observed sparse mask; leave the input unchanged."""
    if not 39 <= len(data) <= MAX_BYTES or not data.startswith(HEADER):
        raise ValueError("unsupported Lua header/size")
    out = bytearray(data)
    span = len(out) - 31
    for index in range(8):
        out[31 + span * index // 8] ^= (span + 29 * index) % 255 + 1
    return bytes(out)


class Reader:
    def __init__(self, data):
        self.data = data
        self.pos = 0

    def take(self, count):
        if not 0 <= count <= len(self.data) - self.pos:
            raise ValueError("truncated chunk")
        result = self.data[self.pos:self.pos + count]
        self.pos += count
        return result

    def byte(self):
        return self.take(1)[0]

    def uint(self):
        value = 0
        for _ in range(5):
            part = self.byte()
            value = value * 128 + (part & 127)
            if value > MAX_ITEMS:
                raise ValueError("chunk count exceeds bound")
            if part & 128:
                return value
        raise ValueError("invalid chunk integer")

    def string(self):
        size = self.uint()
        if not size:
            return None
        return self.take(size - 1).decode("utf-8")


def parse(data):
    """Parse one unmasked chunk with no nested functions or dynamic expressions."""
    if not 32 <= len(data) <= MAX_BYTES or not data.startswith(HEADER):
        raise ValueError("unsupported Lua header/size")
    r = Reader(data)
    r.take(31)
    if r.byte() != 1:
        raise ValueError("expected only the environment upvalue")
    r.string()  # optional debug source identity, never used as a path
    r.uint()
    r.uint()
    params, vararg, slots = r.take(3)
    if params != 0 or vararg != 1:
        raise ValueError("not a generated top-level table chunk")
    count = r.uint()
    code = struct.unpack("<" + "I" * count, r.take(count * 4))
    constants = []
    for _ in range(r.uint()):
        tag = r.byte()
        if tag == 0:
            value = None
        elif tag in (1, 17):
            value = tag == 17
        elif tag == 3:
            value = struct.unpack("<q", r.take(8))[0]
        elif tag == 19:
            value = struct.unpack("<d", r.take(8))[0]
        elif tag in (4, 20):
            value = r.string()
        else:
            raise ValueError("unsupported constant tag")
        constants.append(value)
    if r.uint() != 1 or r.take(3) != b"\x01\x00\x00":
        raise ValueError("unsupported upvalues")
    if r.uint() != 0:
        raise ValueError("nested functions are forbidden")
    r.take(r.uint())  # line information
    for _ in range(r.uint()):
        r.uint()
        r.uint()
    for _ in range(r.uint()):
        r.string()
        r.uint()
        r.uint()
    names = r.uint()
    if names not in (0, 1):
        raise ValueError("invalid upvalue debug count")
    for _ in range(names):
        r.string()
    if r.pos != len(data):
        raise ValueError("trailing chunk bytes")
    registers = {}
    config = {}
    pc = 0
    budget = MAX_ITEMS
    returned = False

    def extra():
        nonlocal pc
        if pc >= len(code) or code[pc] & 127 != 82:
            raise ValueError("missing EXTRAARG")
        value = code[pc] >> 7
        pc += 1
        return value

    try:
        while pc < len(code):
            word = code[pc]
            pc += 1
            op = OPS.get(word & 127)
            a, k, b, c = (word >> 7) & 255, (word >> 15) & 1, (word >> 16) & 255, word >> 24
            bx = word >> 15
            if a >= slots:
                raise ValueError("register outside stack")
            if op == "VARARGPREP":
                if pc != 1:
                    raise ValueError("unexpected VARARGPREP")
            elif op == "LOADK":
                registers[a] = constants[bx]
            elif op == "LOADKX":
                registers[a] = constants[extra()]
            elif op in ("LOADI", "LOADF"):
                registers[a] = bx - 65535
            elif op in ("LOADTRUE", "LOADFALSE"):
                registers[a] = op == "LOADTRUE"
            elif op == "LOADNIL":
                for index in range(a, a + b + 1):
                    registers[index] = None
            elif op == "MOVE":
                registers[a] = registers[b]
            elif op == "GETTABUP":
                if b != 0 or constants[c] != "Config":
                    raise ValueError("only Config global is allowed")
                registers[a] = config
            elif op == "GETFIELD":
                registers[a] = registers[b][constants[c]]
            elif op == "NEWTABLE":
                extra()
                registers[a] = {}
            elif op in ("SETFIELD", "SETTABLE", "SETI"):
                key = constants[b] if op == "SETFIELD" else (registers[b] if op == "SETTABLE" else b)
                registers[a][key] = constants[c] if k else registers[c]
                budget -= 1
            elif op == "SETLIST":
                if b == 0 or a + b >= slots:
                    raise ValueError("unsupported variable/out-of-bounds SETLIST")
                offset = c + (extra() * 256 if k else 0)
                for index in range(1, b + 1):
                    registers[a][offset + index] = registers[a + index]
                budget -= b
            elif op in ("RETURN", "RETURN0", "RETURN1"):
                if pc != len(code):
                    raise ValueError("instructions after return")
                returned = True
            else:
                raise ValueError("nonliteral or unsupported opcode: " + str(word & 127))
            if budget < 0:
                raise ValueError("table write budget exhausted")
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError("invalid literal-table instruction") from exc
    if not returned:
        raise ValueError("missing return")
    return config


def rows(table):
    """Resolve generated keys2Index/defaults without running table metatables."""
    keys = table["keys2Index"]
    defaults = table["defaults"]
    return {key: {name: defaults.get(name) if row.get(index) in (None, "DEFAULT") else row[index]
                  for name, index in keys.items()}
            for key in table["keys"].values()
            for row in (table[key],)}
