---
public: true
---
#DP  #矩阵 
## 概述
DDP，即动态DP，就是一个正常的DP问题再加上动态修改条件的操作。

动态DP的一个套路是把DP转移方程写成矩阵乘法，然后用线段树（树上的话就是树剖）维护矩阵。
## 例题
### [P4719 【模板】"动态 DP"&动态树分治](https://www.luogu.com.cn/problem/P4719)
正常的 dp： $f_{u,0}=\sum \max(f_{v,0},f_{v,1})$，$f_{u,1}=\sum f_{v,0}$。

加上修改，可以发现改变一个值只会影响其到根的路径。树上一条链的修改让我们想到树链剖分，但关键是如何把dp转移方程变成符合结合律的。

定义 $g_{i,0/1}$ 为 $i$ 子树内 $i$ 选或不选时除去 $i$ 重儿子的方案数，则 $f_{u,0}=\max(g_{u,0}+f_{son_u,0},g_{u,0}+f_{son_u,1})$，$f_{u,1}=g_{u,1}+f_{son_u,0}$。

我们重新定义矩阵乘法：
```cpp
for(int i=0;i<n;++i)for(int j=0;j<n;++j)for(int k=0;k<n;++k)
	c.s[i][j]=max(c.s[i][j],a.s[i][k]+b.s[k][j]);
```

于是可以把原dp转移方程写成矩阵乘法的形式：
$$\left(\begin{matrix}
f_{u,0}\\f_{u,1}
\end{matrix}\right)=
\left(\begin{matrix}
g_{u,0}&g_{u,0}\\g_{u,1}&inf
\end{matrix}\right)*
\left(\begin{matrix}
f_{v,0}\\f_{v,1}
\end{matrix}\right)
$$

用线段树维护区间矩阵积，每次修改时更新 $x$ 到根的所有重链。

**注意：**

1. **叶子节点的矩阵应为 $\left(\begin{matrix}f_{u,0}\\f_{u,1}\end{matrix}\right)$。**
2. **线段树做矩阵乘法时注意顺序，矩阵乘法不满足交换律。**

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ls k<<1
#define rs k<<1|1
const int N=1e5+5,inf=-1e9;
int n,m,a[N],x,y,fa[N],d[N],sz[N],son[N],tim,dfn[N],id[N],tp[N],bot[N],f[N][2];
vector<int>e[N];
struct mat{
	int s[2][2];
	mat operator *(const mat &b){
		mat t;t.s[0][0]=t.s[0][1]=t.s[1][0]=t.s[1][1]=inf;
		for(int i=0;i<2;++i)for(int j=0;j<2;++j)for(int k=0;k<2;++k)
			t.s[i][j]=max(t.s[i][j],s[i][k]+b.s[k][j]);
		return t;
	}
}g[N],tr[N<<2],de,ad;
void dfs1(int u,int F){
	fa[u]=F,d[u]=d[F]+1,sz[u]=1;
	for(int v:e[u])if(v!=F){
		dfs1(v,u),sz[u]+=sz[v];
		if(sz[v]>sz[son[u]]) son[u]=v;
	}
}
void dfs2(int u,int top){
	bot[top]=dfn[u]=++tim,id[tim]=u,tp[u]=top;
	if(son[u]) dfs2(son[u],top),f[u][1]+=f[son[u]][0],f[u][0]+=max(f[son[u]][0],f[son[u]][1]); 
	for(int v:e[u])if(v!=fa[u]&&v!=son[u])
		dfs2(v,v),f[u][1]+=f[v][0],f[u][0]+=max(f[v][0],f[v][1]);
	f[u][1]+=a[u],g[u].s[0][0]=g[u].s[0][1]=f[u][0]-max(f[son[u]][0],f[son[u]][1]);
	g[u].s[1][0]=f[u][1]-f[son[u]][0],g[u].s[1][1]=inf;
}
void build(int k,int l,int r){
	if(l==r){tr[k]=g[id[l]];return ;}
	int mi=(l+r)>>1;
	build(ls,l,mi),build(rs,mi+1,r);
	tr[k]=tr[ls]*tr[rs];
}
void upd(int k,int l,int r,int x){
	if(l==r){tr[k]=g[id[l]];return ;}
	int mi=(l+r)>>1;
	if(x<=mi) upd(ls,l,mi,x);
	else upd(rs,mi+1,r,x);
	tr[k]=tr[ls]*tr[rs];
}
mat ask(int k,int l,int r,int x,int y){
	if(x<=l&&r<=y) return tr[k];
	int mi=(l+r)>>1;
	if(x<=mi&&y>mi) return ask(ls,l,mi,x,y)*ask(rs,mi+1,r,x,y);
	if(x<=mi) return ask(ls,l,mi,x,y);
	return ask(rs,mi+1,r,x,y);
}
int main(){
	scanf("%d%d",&n,&m);
	for(int i=1;i<=n;++i) scanf("%d",&a[i]);
	for(int i=1;i<n;++i) scanf("%d%d",&x,&y),e[x].push_back(y),e[y].push_back(x);
	dfs1(1,0),dfs2(1,1),build(1,1,n);
	while(m--){
		scanf("%d%d",&x,&y),g[x].s[1][0]+=y-a[x],a[x]=y;
		while(x){
			de=ask(1,1,n,dfn[tp[x]],bot[tp[x]]),upd(1,1,n,dfn[x]);
			ad=ask(1,1,n,dfn[tp[x]],bot[tp[x]]),x=fa[tp[x]];
			g[x].s[0][0]+=max(ad.s[0][0],ad.s[1][0])-max(de.s[0][0],de.s[1][0]);
			g[x].s[0][1]=g[x].s[0][0],g[x].s[1][0]+=ad.s[0][0]-de.s[0][0];
		}
		ad=ask(1,1,n,dfn[1],bot[1]),printf("%d\n",max(ad.s[0][0],ad.s[1][0]));
	}
	return 0;
}
```
### [P6021 洪水](https://www.luogu.com.cn/problem/P6021)
**题意：**
![[Pasted image 20230915153953.png]]

**题解：**

定义 $f_i$ 为 $i$ 子树内的花费，则 $f_u=\min(a_u,\sum f_v)$。

因为带修，要动态维护 dp，把其写成矩阵的形式。

定义 $s_u$ 为 $u$ 子树内除去重儿子的 $f_v$ 之和，则 $\left(\begin{matrix}f_u\\0\end{matrix}\right)=\left(\begin{matrix}s_u&a_u\\0&0\end{matrix}\right)*\left(\begin{matrix}f_v\\0\end{matrix}\right)$，其中 $*$ 表示相加取 $\min$。

[code](https://www.luogu.com.cn/record/124763237)

![[P8820 [CSP-S 2022] 数据传输](https //www.luogu.com.cn/problem/P8820)](CSP-S.md#[P8820%20[CSP-S%202022]%20数据传输](https%20//www.luogu.com.cn/problem/P8820))
