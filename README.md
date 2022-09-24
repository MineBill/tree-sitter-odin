# Unmaintained
This treesitter parser was a result of me just messing arround with the go treesitter parser until i got it somewhat working for odin. It's error prone and doesn't correctly parse some features. I've zero interest in creating a proper parser because i don't find it fun. However, from what i've seen this provides (for me at least) the best highlighting for odin code right now and until a better parser emerges i will accept pull requests and *maybe* fix some errors that i find annoying.

Some alternatives to consider:
- https://github.com/ap29600/tree-sitter-odin

If you still want to use this:
After integrating to your preffered editor, don't forget to copy the content of the queries folder to where your editor expects it. 

tree-sitter-odin
===========================

[![Build/test](https://github.com/tree-sitter/tree-sitter-go/actions/workflows/ci.yml/badge.svg)](https://github.com/tree-sitter/tree-sitter-go/actions/workflows/ci.yml)

A [tree-sitter][] grammar for [Odin](https://odin-lang.org/docs/).

[tree-sitter]: https://github.com/tree-sitter/tree-sitter
