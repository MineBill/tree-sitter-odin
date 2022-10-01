// NOTE: For right now '::' and ':=' are treated as sigle tokens.
// That however is not true: https://odin-lang.org/docs/overview/#assignment-statements
const
PREC = {
    primary: 7,
    unary: 6,
    multiplicative: 5,
    additive: 4,
    comparative: 3,
    and: 2,
    or: 1,
    composite_literal: -1,
},

    multiplicative_operators = ['*', '/', '%', '<<', '>>', '&', '&^'],
    additive_operators = ['+', '-', '|', '^'],
    comparative_operators = ['==', '!=', '<', '<=', '>', '>='],
    assignment_operators = multiplicative_operators.concat(additive_operators).map(operator => operator + '=').concat('='),

    unicodeLetter = /\p{L}/,
    unicodeDigit = /[0-9]/,
    unicodeChar = /./,
    unicodeValue = unicodeChar,
    letter = choice(unicodeLetter, '_'),

    newline = '\n',
    terminator = choice(newline, ';'),

    hexDigit = /[0-9a-fA-F]/,
    octalDigit = /[0-7]/,
    decimalDigit = /[0-9]/,
    binaryDigit = /[01]/,

    hexDigits = seq(hexDigit, repeat(seq(optional('_'), hexDigit))),
    octalDigits = seq(octalDigit, repeat(seq(optional('_'), octalDigit))),
    decimalDigits = seq(decimalDigit, repeat(seq(optional('_'), decimalDigit))),
    binaryDigits = seq(binaryDigit, repeat(seq(optional('_'), binaryDigit))),

    hexLiteral = seq('0', choice('x', 'X'), optional('_'), hexDigits),
    octalLiteral = seq('0', optional(choice('o', 'O')), optional('_'), octalDigits),
    decimalLiteral = choice('0', seq(/[1-9]/, optional(seq(optional('_'), decimalDigits)))),
    binaryLiteral = seq('0', choice('b', 'B'), optional('_'), binaryDigits),

    intLiteral = choice(binaryLiteral, decimalLiteral, octalLiteral, hexLiteral),

    decimalExponent = seq(choice('e', 'E'), optional(choice('+', '-')), decimalDigits),
    decimalFloatLiteral = choice(
        seq(decimalDigits, '.', optional(decimalDigits), optional(decimalExponent)),
        seq(decimalDigits, decimalExponent),
        seq('.', decimalDigits, optional(decimalExponent)),
    ),

    hexExponent = seq(choice('p', 'P'), optional(choice('+', '-')), decimalDigits),
    hexMantissa = choice(
        seq(optional('_'), hexDigits, '.', optional(hexDigits)),
        seq(optional('_'), hexDigits),
        seq('.', hexDigits),
    ),
    hexFloatLiteral = seq('0', choice('x', 'X'), hexMantissa, hexExponent),

    floatLiteral = choice(decimalFloatLiteral, hexFloatLiteral),

    imaginaryLiteral = seq(choice(decimalDigits, intLiteral, floatLiteral), 'i')

module.exports = grammar({
    name: 'odin',

    extras: $ => [
        $.comment,
        /\s/
    ],

    inline: $ => [
        $._type,
        $._type_identifier,
        $._field_identifier,
        $._package_identifier,
        $._top_level_declaration,
        $._string_literal,
    ],

    word: $ => $.identifier,

    conflicts: $ => [
        [$._simple_type, $._expression],
        [$.qualified_type, $._expression],
        [$.generic_type, $._expression],
        [$.generic_type, $._simple_type],
        [$.parameter_declaration, $.type_arguments],
        [$.parameter_declaration, $._simple_type, $._expression],
        [$.parameter_declaration, $.generic_type, $._expression],
        [$.parameter_declaration, $._expression],
        [$.parameter_declaration, $._simple_type],
        [$._simple_type, $.qualified_type],
        [$.const_declaration_with_type, $.var_declaration],
        [$.block_with_directive, $.literal_value],
        [$.block, $.literal_value],
        // [$.var_declaration_and_assignment, $.literal_value],
        [$._simple_statement, $.literal_element],
        // [$.assignment_statement, $._expression],
    ],

    supertypes: $ => [
        $._expression,
        $._type,
        $._simple_type,
        $._statement,
        $._simple_statement,
    ],

    rules: {
        source_file: $ => repeat(choice(
            // Unlike a Go compiler, we accept statements at top-level to enable
            // parsing of partial code snippets in documentation (see #63).
            seq($._statement, terminator),
            seq($._top_level_declaration, optional(terminator)),
        )),

        _top_level_declaration: $ => choice(
            $.package_clause,
            $.function_declaration,
            $.proc_group,
            $.import_declaration,
            $.foreign_block,
        ),

        foreign_block: $ => seq(
            'foreign',
            field('name',$._foreign_lib_identifier),
            field('body', $.block)
        ),

        package_clause: $ => seq(
            'package',
            $._package_identifier
        ),

        import_declaration: $ => seq(
            optional('foreign'),
            'import',
            $.import_spec,
        ),

        import_spec: $ => seq(
            optional(field('name', choice(
                $.identifier
            ))),
            field('path', $._string_literal)
        ),

        _declaration: $ => prec(2, choice(
            $.type_alias,
            $.struct_declaration,
            $.enum_declaration,
            $.union_declaration,
            $.const_declaration,
            $.const_declaration_with_type,
            $.var_declaration,
            $.function_declaration,
            $.var_declaration_and_assignment,
            $.import_declaration,
        )),

        const_declaration: $ => prec.left(3, seq(
            /* field('name', commaSep1($.identifier)),
            seq(
                '::',
                field('value', choice($.qualified_identifier, $.const_expression_list))
            ) */
            field('name', commaSep1($.identifier)),
            seq(
                '::',
                field('value', $.expression_list)
            )
        )),

        const_declaration_with_type: $ => prec.left(2, seq(
            field('name', commaSep1($.identifier)),
            seq(
                ':',
                field('type', $._type),
                seq(
                    ':',
                    field('value', choice($.const_expression_list, $.qualified_identifier))
                )
            )
        )),

        var_declaration: $ => prec.right(2, seq(
            field('name', commaSep1($.identifier)),
            seq(
                ':',
                field('type', $._type),
                optional(seq(
                    '=',
                    field('value', $.expression_list)
                ))
            )
        )),

        var_declaration_and_assignment: $ => prec.dynamic(20, seq(
            field('name', commaSep1($.identifier)),
            seq(
                ':=',
                field('value', $.expression_list)
            )
        )),

        struct_declaration: $ => prec(2, seq(
            field('name', $._type_identifier),
            '::',
            'struct',
            optional($.simple_directive),
            field('parameters', optional($.parameter_list)),
            field('body', $.field_declaration_list)
        )),

        enum_declaration: $ => prec(2, seq(
            field('name', $._type_identifier),
            '::',
            'enum',
            field('values', $.enum_value_list)
        )),

        union_declaration: $ => prec(2, seq(
            field('name', $._type_identifier),
            '::',
            'union',
            field('values', $.union_value_list)
        )),

        function_declaration: $ => prec.right(5, seq(
            field('name', $.identifier),
            '::',
            optional($.simple_directive),
            'proc',
            field('calling_convention', optional($._string_literal)),
            field('parameters', $.parameter_list),
            optional($.where_clause),
            optional('->'),
            field('result', optional(choice($.parameter_list, $._simple_type))),
            choice(
                field('body', optional($.block)),
                '---'
            )
        )),

        proc_group: $ => seq(
            field('name', $.identifier),
            '::',
            'proc',
            '{',
                commaSep($.identifier),
            '}',
        ),

        simple_expression: $ => choice(
            $.unary_expression,
            $.binary_expression,
            $.selector_expression,
            $.index_expression,
            $.slice_expression,
            $.call_expression,
            $.function_directive,
            $.type_assertion_expression,
            $.type_conversion_expression,
            $.true,
            $.false,
        ),

        where_clause: $ => prec.left(2, seq(
            optional(terminator),
            'where',
            commaSep1($._expression)
        )),

        parameter_list: $ => seq(
            '(',
                optional(seq(
                    commaSep(choice(
                        $.parameter_declaration,
                        $.variadic_parameter_declaration,
                        $.poly_parameter_declaration,
                    )),
                    optional(',')
                )),
                ')'
        ),

        parameter_declaration: $ => seq(
            optional('using'),
            commaSep1(field('name', seq(optional('$'), $.identifier))),
            /* ':',
            field('type', $._type), */
            choice(
                seq(
                    ':',
                    field('type', $._type),
                    optional(seq(
                        '=',
                        field('value', $.expression_list)
                    ))
                ),
                seq(
                    ':=',
                    field('value', $.expression_list)
                )
            )
        ),

        variadic_parameter_declaration: $ => seq(
            field('name', optional($.identifier)),
            ':',
            '..',
            'any'
        ),

        poly_parameter_declaration: $ => seq(
            field('name', optional($.identifier)),
            ':',
            field('type', $.polymorphic_type)
        ),

        type_alias: $ => seq(
            field('name', $._type_identifier),
            '::',
            'distinct',
            // optional($.selector_expression),
            field('type', $._type)
        ),

        field_name_list: $ => commaSep1($._field_identifier),

        expression_list: $ => prec.right(1, commaSep1($._expression)),
        const_expression_list: $ => commaSep1($._const_expression),

        _type: $ => choice(
            $._simple_type,
            $.parenthesized_type
            // TODO(minebill): This type should only be allowed in proc declarations
            // but i'll allow it anywhere for now because it's easier to implement
            //$.polymorphic_type
        ),

        parenthesized_type: $ => seq('(', $._type, ')'),

        polymorphic_type: $ => seq(
            '$',
            field('type', $._type_identifier),
            optional(seq(
                '/',
                field('specialization', $._type)
            ))
        ),

        _simple_type: $ => choice(
            prec.dynamic(-1, $._type_identifier),
            $.generic_type,
            $.qualified_type,
            $.pointer_type,
            $.struct_type,
            $.union_type,
            $.enum_type,
            $.array_type,
            $.dynamic_array_type,
            $.implicit_length_array_type,
            $.slice_type,
            $.map_type,
        ),

        generic_type: $ => seq(
            field('type', $._type_identifier),
            field('type_arguments', $.type_arguments),
        ),

        type_arguments: $ => prec.dynamic(2, seq(
            '[',
                commaSep1($._type),
                optional(','),
                ']'
        )),

        pointer_type: $ => prec(PREC.unary, seq('^', $._type)),

        array_type: $ => seq(
            '[',field('length', $._expression),']',
            field('element', $._type)
        ),

        dynamic_array_type: $ => seq(
            '[','dynamic',']',
            field('element', $._type)
        ),

        implicit_length_array_type: $ => seq(
            '[','?',']',
            field('element', $._type)
        ),

        slice_type: $ => seq(
            '[',']',
            field('element', $._type)
        ),

        struct_type: $ => seq(
            'struct',
            $.field_declaration_list
        ),

        enum_type: $ => seq(
            'enum',
            $.enum_value_list
        ),

        union_type: $ => seq(
            'union',
            $.union_value_list
        ),

        field_declaration_list: $ => seq(
            '{',
            optional(seq(
                $.field_declaration,
                repeat(seq(',', $.field_declaration)),
                ','
            )),
            '}'
        ),

        enum_value_list: $ => seq(
            '{',
            optional(seq(
                $._enum_value_identifier,
                repeat(seq(',', $._enum_value_identifier)),
                ','
            )),
            '}'
        ),

        union_value_list: $ => seq(
            '{',
            optional(seq(
                $._type,
                repeat(seq(',', $._type)),
                ','
            )),
            '}'
        ),

        field_declaration: $ => seq(
            seq(
                optional('using'),
                commaSep1(field('name', $._field_identifier)),
                ':',
                field('type', $._type)
            ),
            field('tag', optional($._string_literal))
        ),

        constraint_elem: $ => seq(
            $.constraint_term,
            repeat(seq('|', $.constraint_term))
        ),

        constraint_term: $ => prec(-1, seq(
            optional('~'),
            $._type_identifier,
        )),

        method_spec: $ => seq(
            field('name', $._field_identifier),
            field('parameters', $.parameter_list),
            field('result', optional(choice($.parameter_list, $._simple_type)))
        ),

        map_type: $ => seq(
            'map',
            '[',
                field('key', $._type),
                ']',
            field('value', $._type)
        ),


        block: $ => seq(
            '{',
                    optional($._statement_list),
                    '}'
        ),

        block_with_directive: $ => seq(
            optional($.simple_directive),
            '{',
                    field('body', optional($._statement_list)),
                    '}'
        ),

        simple_directive: $ => prec(1, seq(
            '#',
            $._directive_identifier,
            field('argument', optional(choice($.int_literal, $.float_literal)))
        )),

        function_directive: $ => prec.right(2, seq(
            '#',
            $._directive_identifier,
            $.argument_list,
        )),

        _statement_list: $ => choice(
            seq(
                $._statement,
                repeat(seq(terminator, $._statement)),
                optional(seq(
                    terminator,
                    optional(alias($.empty_labeled_statement, $.labeled_statement))
                ))
            ),
            alias($.empty_labeled_statement, $.labeled_statement)
        ),

        _statement: $ => choice(
            $._declaration,
            $._simple_statement,
            $.return_statement,
            $.defer_statement,
            $.if_statement,
            $.when_statement,
            $.for_statement,
            $.switch_statement,
            $.type_switch_statement,
            $.labeled_statement,
            $.fallthrough_statement,
            $.break_statement,
            $.continue_statement,
            $.block_with_directive,
            $.empty_statement
        ),

        empty_statement: $ => ';',

        _simple_statement: $ => choice(
            $._expression,
            $.assignment_statement,
            $.var_declaration_and_assignment,
        ),

        assignment_statement: $ => prec(1, seq(
            // field('left', $.expression_list),
            field('name', commaSep1($.identifier)),
            field('operator', choice(...assignment_operators)),
            field('right', $.expression_list)
            /* field('name', commaSep1($.identifier)),
            '=',
            field('value', $.expression_list) */
        )),

        labeled_statement: $ => seq(
            field('label', alias($.identifier, $.label_name)),
            ':',
            choice(
                $.for_statement,
                $.block,
            )
        ),

        empty_labeled_statement: $ => seq(
            field('label', alias($.identifier, $.label_name)),
            ':'
        ),

        // This is a hack to prevent `fallthrough_statement` from being parsed as
        // a single token. For consistency with `break_statement` etc it should
        // be parsed as a parent node that *contains* a `fallthrough` token.
        fallthrough_statement: $ => prec.left('fallthrough'),

        break_statement: $ => seq('break', optional(alias($.identifier, $.label_name))),

        continue_statement: $ => seq('continue', optional(alias($.identifier, $.label_name))),

        return_statement: $ => seq('return', optional($.expression_list)),

        defer_statement: $ => seq('defer', $._statement),

        if_statement: $ => seq(
            'if',
            optional(seq(
                field('initializer', $._simple_statement),
                ';'
            )),
            field('condition', $._expression),
            field('consequence', $.block),
            optional(seq(
                'else',
                field('alternative', choice($.block, $.if_statement))
            ))
        ),

        when_statement: $ => seq(
            'when',
            field('condition', $._expression),
            field('consequence', $.block),
            optional(seq(
                'else',
                field('alternative', choice($.block, $.when_statement))
            ))
        ),

        for_statement: $ => seq(
            'for',
            optional(choice($.for_clause, $._expression, $.iterator_clause)),
            field('body', $.block)
        ),

        for_clause: $ => prec.left(4, seq(
            field('initializer', optional($._simple_statement)),
            ';',
            field('condition', optional($._expression)),
            ';',
            field('update', optional($._simple_statement))
        )),

        // for i in 0...10.
        iterator_clause: $ => seq(
            field('variable', $.identifier),
            optional(
                seq(
                    ',',
                    field('index', $.identifier),
                )
            ),
            'in',
            choice(
                seq(
                    field('lower', $._expression),
                    choice('..', '..<', '..='),
                    field('upper', $._expression),
                ),
                seq(
                    optional('&'),
                    field('iterator', $.identifier)
                ),
            ),
        ),

        switch_statement: $ => prec(1, seq(
            optional($.simple_directive),
            'switch',
            optional(seq(
                field('initializer', $._simple_statement),
                ';'
            )),
            field('value', optional($._expression)),
            '{',
            repeat(choice($.expression_case, $.default_case)),
            '}'
        )),
        expression_case: $ => seq(
            'case',
            field('value', $.expression_list),
            ':',
            optional($._statement_list)
        ),

        type_switch_statement: $ => prec(1, seq(
            optional($.simple_directive),
            'switch',
            optional(field('variable', $.identifier)),
            'in',
            field('value', $._simple_statement),
            '{',
                repeat(choice($.type_expression_case, $.default_case)),
            '}'
        )),

        type_expression_case: $ => seq(
            'case',
            field('type', $._type),
            ':',
            optional($._statement_list)
        ),


        default_case: $ => seq(
            'case',
            ':',
            optional($._statement_list)
        ),

        _expression: $ => prec(5, choice(
            $.unary_expression,
            $.binary_expression,
            $.selector_expression,
            $.index_expression,
            $.slice_expression,
            $.call_expression,
            $.function_directive,
            $.type_assertion_expression,
            $.type_conversion_expression,
            $.cast_expression,
            $.transmute_expression,
            $.identifier,
            alias(choice('new', 'make'), $.identifier),
            $.composite_literal,
            $._string_literal,
            $.int_literal,
            $.float_literal,
            $.imaginary_literal,
            $.rune_literal,
            $.nil,
            $.true,
            $.false,
            $.undefined,
            $.parenthesized_expression
        )),

        _const_expression: $ => choice(
            $.unary_expression,
            $.binary_expression,
            $.index_expression,
            $.type_assertion_expression,
            $.type_conversion_expression,
            $.composite_literal,
            $._string_literal,
            $.int_literal,
            $.float_literal,
            $.imaginary_literal,
            $.rune_literal,
            $.nil,
            $.true,
            $.false,
            $.undefined,
            $.parenthesized_expression,
        ),

        cast_expression: $ => seq(
            choice(
                seq(
                    'cast',
                    '(',
                    field('type', $._type),
                    ')',
                ),
                'auto_cast'
            ),
            field('operand', $._expression)
        ),

        transmute_expression: $ => seq(
            'transmute',
            '(',
                field('type', $._type),
                ')',
            field('operand', $._expression)
        ),

        parenthesized_expression: $ => prec(1, seq(
            '(',
                $._expression,
                ')'
        )),

        call_expression: $ => prec(PREC.primary, choice(
            seq(
                field('function', alias(choice('new', 'make'), $.identifier)),
                field('arguments', alias($.special_argument_list, $.argument_list))
            ),
            seq(
                field('function', $._expression),
                field('type_arguments', optional($.type_arguments)),
                field('arguments', $.argument_list)
            )
        )),

        variadic_argument: $ => prec.right(seq(
            $._expression,
            '...'
        )),

        special_argument_list: $ => seq(
            '(',
                $._type,
                repeat(seq(',', $._expression)),
                optional(','),
                ')'
        ),

        argument_list: $ => seq(
            '(',
                optional(seq(
                    choice($._expression, $.variadic_argument),
                    repeat(seq(',', choice($._expression, $.variadic_argument))),
                    optional(',')
                )),
                ')'
        ),

        selector_expression: $ => prec(PREC.primary, seq(
            optional(field('operand', $._expression)),
            '.',
            field('field', $._field_identifier)
        )),

        index_expression: $ => prec(PREC.primary, seq(
            field('operand', $._expression),
            '[',
            field('index', $._expression),
            ']'
        )),

        slice_expression: $ => prec(PREC.primary, seq(
            field('operand', $._expression),
            '[',
                choice(
                    seq(
                        field('start', optional($._expression)),
                        ':',
                        field('end', optional($._expression))
                    ),
                    seq(
                        field('start', optional($._expression)),
                        ':',
                        field('end', $._expression),
                        ':',
                        field('capacity', $._expression)
                    )
                ),
                ']'
        )),

        type_assertion_expression: $ => prec(PREC.primary, seq(
            field('operand', $._expression),
            '.',
            '(',
                field('type', $._type),
                ')'
        )),

        type_conversion_expression: $ => prec.dynamic(-1, seq(
            field('type', $._type),
            '(',
                field('operand', $._expression),
                optional(','),
                ')'
        )),

        composite_literal: $ => prec(PREC.composite_literal, seq(
            optional(field('type', choice(
                $.map_type,
                $.slice_type,
                $.array_type,
                $.dynamic_array_type,
                $.implicit_length_array_type,
                $.struct_type,
                $._type_identifier,
                $.generic_type,
                $.qualified_type
            ))),
            field('body', $.literal_value)
        )),

        literal_value: $ => seq(
            '{',
            optional(
                seq(
                    commaSep(choice($.literal_element, $.keyed_element)),
                    optional(',')
                )
            ),
            '}',
        ),

        literal_element: $ => choice($._expression, $.literal_value),

        // In T{k: v}, the key k may be:
        // - any expression (when T is a map, slice or array),
        // - a field identifier (when T is a struct), or
        // - a literal_element (when T is an array).
        // The first two cases cannot be distinguished without type information.
        keyed_element: $ => seq($.literal_element, '=', $.literal_element),

        unary_expression: $ => prec(PREC.unary, seq(
            field('operator', choice('+', '-', '!', '^', '*', '&', '<-')),
            field('operand', $._expression)
        )),

        binary_expression: $ => {
            const table = [
                [PREC.multiplicative, choice(...multiplicative_operators)],
                [PREC.additive, choice(...additive_operators)],
                [PREC.comparative, choice(...comparative_operators)],
                [PREC.and, '&&'],
                [PREC.or, '||'],
            ];

            return choice(...table.map(([precedence, operator]) =>
                prec.left(precedence, seq(
                    field('left', $._expression),
                    field('operator', operator),
                    field('right', $._expression)
                ))
            ));
        },

        qualified_type: $ => seq(
            field('package', $._package_identifier),
            '.',
            field('name', $._type_identifier)
        ),

        qualified_identifier: $ => seq(
            field('package', $._package_identifier),
            '.',
            field('name', $.identifier)
        ),

        identifier: $ => token(seq(
            letter,
            repeat(choice(letter, unicodeDigit))
        )),

        _type_identifier: $ => alias($.identifier, $.type_identifier),
        _enum_value_identifier: $ => alias($.identifier, $.enum_value_identifier),
        _field_identifier: $ => alias($.identifier, $.field_identifier),
        _package_identifier: $ => alias($.identifier, $.package_identifier),
        _directive_identifier: $ => alias($.identifier, $.directive_identifier),
        _foreign_lib_identifier: $ => alias($.identifier, $.foreign_lib_identifier),

        _string_literal: $ => choice(
            $.raw_string_literal,
            $.interpreted_string_literal
        ),

        raw_string_literal: $ => token(seq(
            '`',
            repeat(/[^`]/),
            '`'
        )),

        interpreted_string_literal: $ => seq(
            '"',
            repeat(choice(
                $._interpreted_string_literal_basic_content,
                $.escape_sequence
            )),
            '"'
        ),
        _interpreted_string_literal_basic_content: $ => token.immediate(prec(1, /[^"\n\\]+/)),

        escape_sequence: $ => token.immediate(seq(
            '\\',
            choice(
                /[^xuU]/,
                /\d{2,3}/,
                /x[0-9a-fA-F]{2,}/,
                /u[0-9a-fA-F]{4}/,
                /U[0-9a-fA-F]{8}/
            )
        )),

        int_literal: $ => token(intLiteral),

        float_literal: $ => token(floatLiteral),

        imaginary_literal: $ => token(imaginaryLiteral),

        rune_literal: $ => token(seq(
            "'",
            choice(
                /[^'\\]/,
                seq(
                    '\\',
                    choice(
                        seq('x', hexDigit, hexDigit),
                        seq(octalDigit, octalDigit, octalDigit),
                        seq('u', hexDigit, hexDigit, hexDigit, hexDigit),
                        seq('U', hexDigit, hexDigit, hexDigit, hexDigit, hexDigit, hexDigit, hexDigit, hexDigit),
                        seq(choice('a', 'b', 'f', 'n', 'r', 't', 'v', '\\', "'", '"'))
                    )
                )
            ),
            "'"
        )),

        nil: $ => 'nil',
        true: $ => 'true',
        false: $ => 'false',
        undefined: $ => '---',

        // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
        comment: $ => token(choice(
            seq('//', /.*/),
            seq(
                '/*',
                /[^*]*\*+([^/*][^*]*\*+)*/,
                '/'
            )
        ))
    }
})

function commaSep1(rule) {
    return seq(rule, repeat(seq(',', rule)))
}

function commaSep(rule) {
    return optional(commaSep1(rule))
}
