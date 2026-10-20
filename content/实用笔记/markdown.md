---
public: true
---
`\quad`：空格

`\lceil \rceil \lfloor \rfloor \lbrace \rbrace \langle \rangle`:
$\lceil \rceil \lfloor \rfloor \lbrace \rbrace \langle \rangle$

`\sqrt[3] x`：$\sqrt[3] x$

`{\ldots} \quad {\cdots}`：${\ldots} \quad {\cdots}$

`\prod \limits_{i=0}^n`：$\prod \limits_{i=0}^n$

`\sim`：$\sim$

`\oplus`：$\oplus$

`a \equiv b \pmod p`：$a \equiv b \pmod p$

`\pm, \times, \cdot, \div, \mid`：$\pm, \times, \cdot, \div, \mid$

未定义函数：`\operatorname{lcm}` $\operatorname{lcm}$

`60^{\circ}`：$60^{\circ}$

`{\exists}`：${\exists}$

`\forall`：$\forall$

`\pm`：$\pm$

## 箭头
`a\stackrel{l}\longrightarrow b`：$a\stackrel{l}\longrightarrow b$

![](Pasted%20image%2020231004101653.png)

## 矩阵
```
\begin{bmatrix} f_{i + 1} \\ f_i \end{bmatrix} = 
\begin{bmatrix} 1 & 1 \\ 1 & 0 \end{bmatrix}\times 
\begin{bmatrix} f_i \\ f_{i - 1} \end{bmatrix}
```

$$\begin{bmatrix} f_{i + 1} \\ f_i \end{bmatrix} = \begin{bmatrix} 1 & 1 \\ 1 & 0 \end{bmatrix} \times \begin{bmatrix} f_i \\ f_{i - 1} \end{bmatrix}$$

```cpp
  A_{2\times2} =
  \left[ {\begin{array}{cc}
    a_{11} & a_{12} \\
    a_{21} & a_{22} \\
  \end{array} } \right]
```

$$
  A_{2\times2} =
  \left[ {\begin{array}{cc}
    a_{11} & a_{12} \\
    a_{21} & a_{22} \\
  \end{array} } \right]
$$

## 分段函数
```
\lvert 2x - 1 \rvert = 
\begin{cases} 
2x - 1 & x > \frac{1}{2} 
\\ 0 & x = \frac{1}{2} 
\\ 1 - 2x & x < \frac{1}{2} 
\end{cases}
```

$$\lvert 2x - 1 \rvert = \begin{cases} 2x - 1 & x > \frac{1}{2} \\ 0 & x = \frac{1}{2} \\ 1 - 2x & x < \frac{1}{2} \end{cases}$$

## 连等
用 `\aligned` 环境

## 希腊字母

![](Pasted%20image%2020231005182516.png)
