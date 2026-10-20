---
public: true
---
#DP 
## 板子
[博客](https://www.luogu.com.cn/blog/Sljeuo/post-zong-jie-sos-dp)
```cpp
for(int i=0;i<24;++i)for(int j=0;j<N;++j)
	if(j&(1<<i)) f[j]+=f[j^(1<<i)];
```
## 例题
### [CF165E Compatible Numbers](https://www.luogu.com.cn/problem/CF165E)
对原序列求出高维前缀和，询问取反判断 $f_i$ 是否为空。

[code](https://www.luogu.com.cn/record/79597398)
### [CF449D Jzzhu and Numbers](https://www.luogu.org/problem/CF449D)

定义 $a_i$ 为包含为 $i$ 的个数，那么方案数为 $2^{a[i]}-1$ 。

要求出 $f_0$ ，高维前缀和减回去就可以了。

[code](https://www.luogu.com.cn/record/123453049)
