package main

import "core:fmt"

ANOTHER :: 123
CONST :: 2
ONE, TWO :: 1, 2

/*
This struct is cool
*/
Pepega :: struct {
    name: string,
    age: int,
}

// This enum is too
Error :: enum {
    None,
}

Variant :: union {
    int,
}

Other :: Pepega
Const :: "awd"
Const2 :: Other[2]
Man :: int

pepegas := make([dynamic]Pepega)
arr := [?]int {1, 2, 3}
name: string

array: [dynamic]Type

main :: proc() {
    fmt.println("")
    append(&name, "awd")
}

with :: proc() -> i32 {
    if false {
        return 42
    }
}
