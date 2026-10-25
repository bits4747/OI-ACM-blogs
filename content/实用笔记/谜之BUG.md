---
public: true
---
## 万能头是左斜杠！！！
`#include<bits/stdc++.h`
## Treap 和线段树 pushup 的区别
treap 不只叶子节点有值，每个点都有！
## 关于 FHQ Treap 的分裂
**注意：分裂后相当于变成了两棵树，后一棵树的 $siz$ 要加上前一棵树的才是原来的 $siz$。**

例如分出第 $x$ 个数要：

```cpp
split(u,x-1,t1,t2),split(t2,1,t0,t2);//第x个数在t0
//错误写法：split(u,x-1,t1,t2),split(t2,x,t0,t2);
```
分区间 $[x,y]$ 要：

```cpp
split(u,x-1,t1,t0),split(t0,y-x+1,t0,t2);
//错误写法：split(u,x-1,t1,t0),split(t0,y,t0,t2);
```
当然，为了避免麻烦可以从后往前分。
## 对多个 vector 排序
对多个 vector 排序的复杂度不是 $n\log n$，可以标号对 $id$ 数组排序。

[TLE](https://codeforces.com/contest/1802/submission/196655932)

[AC](https://codeforces.com/contest/1802/submission/196724204)
## multiset删除的误用
期望删除一个值为 $1$ 的元素，但实际运行结果显示删除了所有值为 $1$ 的元素。
```cpp
multiset<int>q;
//插入 1 1 4 5 1 4
q.erase(1);
//剩下 4 4 5
```
正确用法：
```cpp
multiset<int>q;
//插入 1 1 4 5 1 4
q.erase(q.find(1));
//剩下 1 1 4 4 5
```
## set/multiset 遍历删除正确写法
```cpp
set<int>q;
set<int>::iterator it;
for(it=q.begin();it!=q.end();++it)if((*it)&1) it=q.erase(it);
```
## define
define 传值要加括号！

`#define nd(i,j,k) (i)*n*m+(j)*m+(k)+1`
## 网络流建边
`void adde(int x,int y,int W,int C){add(x,y,W,C),add(y,x,0,-C);}`

仔细看，什么建了连个 $(x,y)$ 的别再犯了。
## 费用流 SSP 多路增广
注意 DFS 时要标记起点到当前的路线，避免进入 $0$ 环。
```cpp
int dfs(int u,int f){
	if(u==en) return f;
	vis[u]=1;//避免0环 
	for(int &i=no[u];i;i=nx[i])if(!vis[v[i]]&&w[i]&&d[u]+c[i]==d[v[i]]){
		int ff=dfs(v[i],min(w[i],f));
		if(ff) return w[i]-=ff,w[i^1]+=ff,val+=c[i]*ff,ff;
	}
	vis[u]=0;
	return 0;
}
```
## SA 多测清空
清空时要清空到 $n+1$！
## 动态开点与可持久化
动态开点只需在 $!k$ 时开新点，而可持久化每次都要开新点。
## 全局与局部变量
c++ 中局部变量与全局变量重名时，若不加限制，全局变量将被忽略而优先使用局部变量。
## 关于 Tarjan 各种用法的区别
- 在有向图上：

	要开 $vis$ 标记是否在栈中，因为边有向，$u\to v$ 且 $v$ 遍历过不代表存在 $v\to u$，不能直接 `low[u]=min(low[u],dfn[v])`。而无向图不用。
- 在无向图上：
	- 点双、割点：无需记录 $fa$，`low[u]=min(low[u],dfn[fa])` 对判断 `low[v]>=dfn[u]` 没有影响。
	- 边双、割边：要判断 `v!=fa` 或标记走过的边（有重边只能标记），因为一条边只能走一次，对判断 `low[v]>dfn[u]` 有影响。
	- 圆方树：

		通常可以省略 $fa$ 及 `v!=fa` 的判断，因为对判断 `low[v]>=dfn[u]` 没有影响。
		
		在仙人掌上 `v==fa` 是环上连接的两点，需要进行一些操作；有时需要区分儿子和自己是否在一个环里时不能执行 `low[u]=min(low[u],dfn[fa])`，则需要判断 `v!=fa`。

	 所以最好是都记录上一条边 $la$（避免有重边），当 $i^1==la$ 时都跳过，不进行`low[u]=min(low[u],dfn[v])`；除非在圆方树仙人掌连环时，特判记录 $u$ 点前的边。
## 注意各种 STL 为空的情况
空时不能用什么 `pop`、`front` 之类的
## 点分治、点分树找重心时子树大小的正确写法
```cpp
int tot=SZ;
for(int v:e[u])if(!vis[v])
	SZ=mx=(sz[v]>sz[u]?tot-sz[u]:sz[v]),grt(v,v),solve(rt);
```
## 关于 char
`scanf("%s",c)` 时，结尾会有结束符，`char` 要多开一位（下标从 $1$ 开始要多开两位）。

## main
不要写成 `mian`

## hash
hash 时不能让 `a` 的值为 $0$，否则 `aaaa` = `a`。

## 线性求 i! 逆元
不能直接现算现乘！后面要用到 `inv`
