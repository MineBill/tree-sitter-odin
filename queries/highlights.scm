(selector_expression
  field: (field_identifier) @property)

(proc_group
  (identifier) @function)

(type_identifier) @type
(identifier) @variable

(field_declaration
  name: (field_identifier) @property)

(const_declaration
  (identifier) @constant)
(const_declaration_with_type
  (identifier) @constant)

; proc declaration
(const_declaration
  name: (identifier) @function
  value: (expression_list (proc_expression)))

; proc call
(call_expression
  function: (identifier) @function)

(call_expression
  function: (selector_expression
    field: (field_identifier) @function))

"any" @type

(directive_identifier) @constant

; ; Operators

[
  "?"
  "-"
  "-="
  ":="
  "!"
  "!="
  "*"
  "*"
  "*="
  "/"
  "/="
  "&"
  "&&"
  "&="
  "%"
  "%="
  "^"
  "+"
  "+="
  "<-"
  "<"
  "<<"
  "<<="
  "<="
  "="
  "=="
  ">"
  ">="
  ">>"
  ">>="
  "|"
  "|="
  "||"
  "~"
  ".."
  "..<"
  "..="
  "::"
] @operator

; ; Keywords

[
  ; "asm"
  "auto_cast"
  ; "bit_set"
  "cast"
  ; "context"
  ; "or_else"
  ; "or_return"
  "in"
  ; "not_in"
  "distinct"
  "foreign"
  "transmute"
  ; "typeid"

  "break"
  "case"
  "continue"
  "defer"
  "else"
  "using"
  "when"
  "where"
  "fallthrough"
  "for"
  "proc"
  "if"
  "import"
  "map"
  "package"
  "return"
  "struct"
  "union"
  "enum"
  "switch"
  "dynamic"
] @keyword

; ; Literals

[
  (interpreted_string_literal)
  (raw_string_literal)
  (rune_literal)
] @string

(escape_sequence) @escape

[
  (int_literal)
  (float_literal)
  (imaginary_literal)
] @number

[
  (true)
  (false)
  (nil)
  (undefined)
] @constant

(comment) @comment
