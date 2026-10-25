---
public: true
---
1. 关闭同步流
`ios::sync_with_stdio(0),cin.tie(0),cout.tie(0);`
2. sort 和 stable_sort 的区别：
    
    sort是快速排序实现，因此是不稳定的；stable_sort是归并排序实现，因此是稳定的；
3. `__builtin_popcount()` `__builtin_popcountll()` 二进制 $1$ 的个数，复杂度 $O(1)$。
4. `nth_element(s+l,s+mid,s+r+1,cmp)` 在线性时间内找到 `s[l]` 和 `s[r]` 之间的值按照排序规则 `cmp` 排序后在 `s[mid]` 位置上的值，并保证 `s[mid]` 左边的值小于 `s[mid]`，右边的值大于 `s[mid]`。
5. `-std=c++14 -Wl,--stack=102400000000000 -Wshadow -Wconversion`
