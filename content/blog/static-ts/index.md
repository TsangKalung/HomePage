---
title: 译文：Static TypeScript
date: "2020-11-23T07:26:03.284Z"
description: "TypeScript 的一种静态编译器实现"
categories: [code]
comments: true
---

译者声明：本译文获得原作者授权翻译。

作者：

1. **Thomas Ball**，微软研究院，美国华盛顿州雷德蒙，tball@microsoft.com

2. **Peli de Halleux**，微软研究院，美国华盛顿州雷德蒙，jhalleux@microsoft.com

3. **Michał Moskal**，微软研究院，美国华盛顿州雷德蒙，mimoskal@microsoft.com

## 综述

基于单片机的嵌入式设备通常使用 C 语言进行编程。这类设备正在进入计算机科学教学的课堂，甚至一些中学也开办了相关课程。于是，用于单片机编程的脚本语言（如 JavaScript 和 Python）使用也逐渐增加。

我们研发了 Static TypeScript（STS），它是 TypeScript 的一种子集（而 TypeScript 本身是 JavaScript 的超集），还研发了相关的编译/链接工具链，它们全部使用 TypeScript 进行开发并且在浏览器中运行。STS 为实践而设计（特别是实践教学），适合针对小型设备的静态编译。用户编写的 STS 程序将在浏览器中被编译成机器码，并链接预编译的 C++运行时，生成比普通的嵌入式解释器更高效的可执行文件，从而延长电池寿命并可以在 RAM 低达 16kB 的设备上运行（例如 BBC micro:bit）。本论文主要对实现 STS 系统和适用于课堂教学的嵌入式编程平台的技术挑战进行综述。

**关键词：**JavaScript，TypeScript，编译器，解释器，单片机，虚拟机

## 1 简介

## 2 Static TypeScript(STS)

## 3 编译器和运行时

STS 的编译器和工具链（链接器等）完全使用 TypeScript 编写。现在尚不支持单独编译 STS 文件，STS 是一个完整的程序编译器（支持缓存预编译的包，其中包含了 C++ 运行时）。STS 的设备运行时主要是由 C++ 编写的，包含定制的垃圾回收器。正如前文提到的，STS 并不计划支持 JavaScript 的全部功能。

### 3.1 编译工具链

TypeScript 源程序由常规 TypeScript 编译器处理，执行包块类型检查在内的语法和语义分析；这个过程产出有类型注释的抽象语法树（AST），然后检查是否有 STS 范围之外的构造（类似`eval`和`arguments`等）。抽象语法树随后会转化为具有语言构造的自定义 IR 用以调用运行时函数。这种 IR 之后回北转换为下列的三种形式之一：

1. 继续传递 JavaScript 运行到浏览器中（在单独的 iframe“模拟器”里）。

2. 与预编译的 C++ 运行时链接的 ARM Thumb 机器码，用以在裸机（A 'bare-metal server' is a computer server that is a 'single-tenant physical server'. The term is used nowadays to distinguish it from modern forms of virtualisation and cloud hosting.）硬件和操作系统内部运行。

3. 自定义虚拟机的字节码，用于无法加载或生成动态语言的平台（例如 XBox 和 iOS）。

ARM Thumb 机器码和自定义的字节码全都被生成为汇编代码，再由定制的汇编器转换为机器码。在本节中我们主要讨论原生 32-bit ARM Thumb 的转化过程（我们会在 4.2 节对比虚拟机的性能）。

本段提到的常规的 TypeScript 编译器、STS 代码生成器、汇编器（assembler）、链接器（linker）均由 TypeScript 实现并且全部运行在浏览器或命令行中。

### 3.2 链接期

生成的机器码将与一个预编译的 C++ 运行时链接。C++ 的编译在云上运行，编译生成的运行时缓存在 CDN 和浏览器中（可以选择使用所有 C++源码的强哈希算法进行缓存）。通常来说，用户编写他们的程序时，C++ 运行时不会更改，从而让离线操作成为可能[5]。

生成的机器码通常会附加在预编译 C++ 运行时代码的后面，根据目标设备要求的文件格式（特别是 ELF）对生成文件进行一些修补。为了生成代码，汇编器需要运行时函数的地址，这些地址从运行时的二进制文件提取。

包可能还要包含从运行时中继承出来的 C++ 代码。包含 C++ 的包组合都必须分别进行编译和缓存，这些也都是在云上运行的。到目前为止，这些可能是天量数字的包组合方式还没有出现大问题，因为学生一般不会一次使用很多外部的包，而且我们的经验是，为 MakeCode 编写的包很少使用原生 C++。

### 3.5 算术运算符

一些算术运算符被编写为快速整数路径的汇编提高运行速度；以下是运算符`+`的实现：

```assembly
_numops_adds:
    ands r2, r0, r1 ; r2 := r0 & r1
    ands r2, #1 ; r2 &= 1
    beq .boxed ; last bit clear?
    subs r2, r1, #1 ; r2 := r1 - 1
    adds r2, r0, r2 ; r2 := r0 + r2
    bvs .boxed ; overflow?
    mov r0, r2 ; r0 := r2
    bx lr ; return
.boxed:
    mov r4, lr ; save return address
    bl numops::adds ; call into runtime
    bx r4 ; return
```

其它由特别实现的算术运算符有`-`、`|`、`&`、`^`和整数转换（调用 C++ 运行时函数时使用）。这些特别的汇编程序比始终调用 C++ 函数要快约两倍。我们在 4.3 节对乘法的性能做了比较。
除此之外的运算符则用 C++ 实现为使用整数、限制范围的数值和其它类型的抽象值的函数。

### 3.6 内置对象（built-in）的表示

**数组（Arrays）** 和 C++标准向量（vector）类似，但有相对保守的增长策略并且不支持稀疏数组（sparse array）。包括范围检查在内的简单数组访问操作用用汇编实现。设计索引转换和数组增长的情况用 C++ 运行时处理。缓冲区只是具有汇编字节访问器和用 C ++ 实现的许多实用程序函数的内存连续块。

**字符串（Strings）** 会有四种不同的表示，它们的开头都毁有一个虚函数表（v-table）指针。所有的字符串当前被限制为最大占用 65,535 字节的空间。ASCII 字符串（所有在 0-127 范围内的字符）用长度前缀加 NUL 中止的字符数据表示（其内部仍然可以有 NUL，只是为了方便 C++ 函数使用所以添加最后的 NUL）。较短的 Unicode 字符串使用 UTF-8 的可变长度编码，它们拥有不同的虚函数表。索引方法可以即时解码 UTF-8。

### 3.7 窥孔优化

### 3.8 垃圾回收器

## 4 性能评估

## 5 相关工作

## 6 总结

---

[1]:

[2]:

[5]: 尽管我们可以使用 Emscripten 或类似的技术在本地对 C++ 进行编译，但编译工具链、头文件和相关的库可能需要数十兆的下载请求，导致浏览器的离线缓存空间紧张。

---
