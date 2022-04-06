package main

import "core:fmt"
import "core:math/linalg"
import "core:inttrinsics"

ANOTHER :: 123
CONST :: 2
ONE, TWO :int : 1, 2

foreign import libc "system:libc"
foreign libc {
    add_nums :: proc(one: i32, two: i32) ---
}

/*
This struct is cool
*/
Pepega :: struct {
    using name: string,
    age: int,
}

Map :: struct(Key: typeid, Value: typeid) {
    inner: map[Key]Value,
}

// This enum is too
Error :: enum {
    None,
    Parse_Fail,
    Parse_Crash,
}

Variant :: union {
    int,
    f32,
    Vec2i,
    Error,
}

Other :: Pepega
Const :: "awd"
Const2 :: Other[2]
Man :: int

Vec2i :: [2]f32

pepegas := make([dynamic]Pepega)
arr := [?]int {1, 2, 3}
name: string

name_awd := map[string]i32{
    "joawh" = 2,
}

john, awd: string = "Hello", "awd"

array: [dynamic]Type

main :: #force_inline proc() {

    inner_proc :: proc() -> bool {
        return false
    }

    fmt.println("")
    append(&name, "awd")
    #load("stuff.txt")

    #no_bounds_check {
    }

    for i in 0..10 {
        
    }

    for tile in &tiles {
        
    }

    for i := 0; i < 10; i+=1 {
        
    }

    var := Variant(int)
    i, ok := var.(int)
    if ok {
        fmt.println(i)
    }
}

with_err :: proc() -> (err: Error) {
    return .Parse_Fail
}

with :: proc(using vec: Vec2i) -> i32 {
    if vec.x > 2 {
        return 42
    }
    n := cast(i32)vec
    y := transmute(string)[?]u8{1, 2, 3}
}

variadic_proc :: proc(args: ..any) {
    fmt.println("KEKW")
}

polymorphic_proc :: proc(num: $T)
where fmt.len(2) > 2 -> bool {
    if fmt.len(2) > 2 {
    }
}

awdawd :: proc(what: $T/[]int) {
}

proc_with_defaults :: proc(var: int, num := 2) {
    
}

group :: proc {
    awdawd,
    polymorphic_proc,
}
