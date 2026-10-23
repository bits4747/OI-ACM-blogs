---
public: true
---
#DP 
## [单调队列优化DP](单调队列优化DP.md)
## 倍增、数据结构优化
### [P1081 [NOIP2012 提高组] 开车旅行](https://www.luogu.com.cn/problem/P1081)

先用 set 处理出 A,B 下一步到哪，再倍增即可。

[code](https://www.luogu.com.cn/record/124487941)

### [P5024 [NOIP2018 提高组] 保卫王国](https://www.luogu.com.cn/problem/P5024)

不考虑要求就是很简单的树形 dp，父亲不选儿子全选，父亲选了儿子随便。

固定 $a,b$ 的选法，只有 $a,b$ 链上会受到影响，考虑单独处理这条链。

暴力处理 $O(n^2)$，可以树剖或倍增优化。

定义 $f_{u,k,st,ft}$ 表示 $u$（是否选）到其 $2^k$ 级祖先（是否选）的总花费（不包括 $u$）。通过倍增求出链上的花费，再加上 $g[lca][0/1],dp[a][at],dp[b][bt]$ （$g[u][0/1]$ 表示 $u$ 选或不选时 $u$ 子树外的花费）。

注意：
1. $a,b$ 为链时单独处理。
2. $a,b$ 紧挨着 $lca$ 时 $lca$ 未必能不选。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ll long long
const int N=1e5+5;
const ll inf=1e13;
char ty[3];
int n,m,a,b,at,bt,x,y,lg[N],c[N],d[N],fa[N][17],lca;
ll dp[N][2],g[N][2],f[N][17][2][2],s1[2],s2[2],tmp,ans;
vector<int>e[N];
void dfs(int u,int F){
	d[u]=d[F]+1,fa[u][0]=F,dp[u][1]=c[u];
	for(int v:e[u])if(v!=F) dfs(v,u),dp[u][0]+=dp[v][1],dp[u][1]+=min(dp[v][0],dp[v][1]);
	for(int v:e[u])if(v!=F) f[v][0][0][0]=inf,f[v][0][1][0]=dp[u][0]-dp[v][1],
		f[v][0][0][1]=f[v][0][1][1]=dp[u][1]-min(dp[v][0],dp[v][1]);
}
void dfs2(int u,int F){
	for(int i=1;i<=lg[d[u]];++i){
		fa[u][i]=fa[fa[u][i-1]][i-1];
		for(int st=0;st<2;++st)for(int ft=0;ft<2;++ft){
			f[u][i][st][ft]=inf;
			for(int k=0;k<2;++k)
				f[u][i][st][ft]=min(f[u][i][st][ft],f[u][i-1][st][k]+f[fa[u][i-1]][i-1][k][ft]);
		}
	}
	for(int v:e[u])if(v!=F){
		g[v][0]=g[u][1]+dp[u][1]-min(dp[v][0],dp[v][1]);
		g[v][1]=min(g[u][1]+dp[u][1]-min(dp[v][0],dp[v][1]),g[u][0]+dp[u][0]-dp[v][1]);
		dfs2(v,u);
	}
}
void ask(int u,int ty,int ff,ll s[]){
	if(u==ff){s[0]=s[1]=0;return ;}
	s[0]=f[u][0][ty][0],s[1]=f[u][0][ty][1],u=fa[u][0];
	while(d[u]^d[ff]){
		tmp=s[0];
		s[0]=min(s[1]+f[u][lg[d[u]-d[ff]]][1][0],s[0]+f[u][lg[d[u]-d[ff]]][0][0]);
		s[1]=min(s[1]+f[u][lg[d[u]-d[ff]]][1][1],tmp+f[u][lg[d[u]-d[ff]]][0][1]);
		u=fa[u][lg[d[u]-d[ff]]];
	}
}
int main(){
	scanf("%d%d %s",&n,&m,ty);
	for(int i=1;i<=n;++i) scanf("%d",&c[i]);
	for(int i=1;i<n;++i) scanf("%d%d",&x,&y),e[x].push_back(y),e[y].push_back(x);
	for(int i=2;i<=n;++i) lg[i]=lg[i>>1]+1;
	d[0]=-1,dfs(1,0),dfs2(1,0);
	while(m--){
		scanf("%d%d%d%d",&a,&at,&b,&bt),x=a,y=b;
		if(d[x]<d[y]) swap(x,y),swap(a,b),swap(at,bt);
		while(d[x]^d[y]) x=fa[x][lg[d[x]-d[y]]];
		if(x==y){
			ask(a,at,b,s1),printf("%lld\n",((ans=s1[bt]+dp[a][at]+g[b][bt])>=inf?-1ll:ans));
			continue;
		}
		for(int i=lg[d[x]];~i;--i)if(fa[x][i]^fa[y][i]) x=fa[x][i],y=fa[y][i];
		ask(a,at,x,s1),ask(b,bt,y,s2),lca=fa[x][0];
		ans=dp[lca][1]-min(dp[x][0],dp[x][1])-min(dp[y][0],dp[y][1])
			+min(s1[0],s1[1])+min(s2[0],s2[1])+g[lca][1];
		if((a!=x||at)&&(b!=y||bt)) ans=min(ans,dp[lca][0]-dp[x][1]-dp[y][1]+s1[1]+s2[1]+g[lca][0]);
		ans+=dp[a][at]+dp[b][bt],printf("%lld\n",(ans>=inf?-1ll:ans));
	}
	return 0;
}
```
### [P3287 [SCOI2014] 方伯伯的玉米田](https://www.luogu.com.cn/problem/P3287)
每次拔高区间的右端点肯定是 $n$，否则不优。

定义 $f_{i,j}$ 表示到 $i$ 时已使用的拔高次数为 $j$ 的方案数，则 $f_{i,j}=max(f_{x,y})+1,x<i,a_x+y<+a_i+j$。

二维树状数组维护即可。

### [P2605 [ZJOI2010] 基站选址](https://www.luogu.com.cn/problem/P2605)
**题意：**

$n$（$n\le20000$）个村子，最多选 $m$（$m\le100$）个村子建基站，每个村子有一个接受范围，范围内没有基站就要罚款，求最小花费。

**题解：**

定义 $f_{i,j}$ 为在 $i$ 处建第 $j$ 个基站时前 $i$ 个村庄的花费，$val_{i,j}$ 表示在 $i,j$ 建基站时中间的总罚款，则 $f_{i,j}=\min\{f_{k,j-1},k<i\}+val_{i,j}+c_i$。

最后加一个必须建基站的村庄，那么答案就是 $\min\{f_{n,0\ldots m}\}$。

难点在于如何快速求出 $val$。

处理出每个村庄的范围 $l_i,r_i$。在选第 $j$ 个基站建哪里时，若在 $r_i$ 前没有建，则在 $1,l_i-1$ 建第 $j-1$ 个基站的花费就要加上 $w_i$。此过程可以用线段树维护。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ls k<<1
#define rs k<<1|1
const int N=20005;
int n,m,d[N],c[N],p[N],st[N],w[N],f[N],s[N<<2],ad[N<<2],ans;
vector<int>e[N];
void build(int k,int l,int r){
	ad[k]=0;
	if(l==r){s[k]=f[l];return ;}
	int mi=(l+r)>>1;build(ls,l,mi),build(rs,mi+1,r);
	s[k]=min(s[ls],s[rs]);
}
void pd(int k){if(ad[k]) s[ls]+=ad[k],s[rs]+=ad[k],ad[ls]+=ad[k],ad[rs]+=ad[k],ad[k]=0;}
void add(int k,int l,int r,int x,int y,int v){
	if(x<=l&&r<=y){s[k]+=v,ad[k]+=v;return ;}
	int mi=(l+r)>>1;pd(k);
	if(x<=mi) add(ls,l,mi,x,y,v);
	if(y>mi) add(rs,mi+1,r,x,y,v);
	s[k]=min(s[ls],s[rs]);
}
int ask(int k,int l,int r,int x,int y){
	if(x<=l&&r<=y) return s[k];
	int mi=(l+r)>>1,re=1e9;pd(k);
	if(x<=mi) re=min(re,ask(ls,l,mi,x,y));
	if(y>mi) re=min(re,ask(rs,mi+1,r,x,y));
	return re;
}
int main(){
	scanf("%d%d",&n,&m),++n,++m,w[n]=d[n]=1e9;
	for(int i=2;i<n;++i) scanf("%d",&d[i]);
	for(int i=1;i<n;++i) scanf("%d",&c[i]);
	for(int i=1;i<n;++i) scanf("%d",&p[i]);
	for(int i=1;i<n;++i) scanf("%d",&w[i]);
	for(int i=1;i<=n;++i)
		st[i]=lower_bound(d+1,d+1+n,d[i]-p[i])-d,e[upper_bound(d+1,d+1+n,d[i]+p[i])-d-1].push_back(i);
	for(int i=1;i<=n;++i){
		f[i]=ans+c[i];
		for(int j:e[i]) ans+=w[j];
	}
	ans=f[n];
	for(int j=2;j<=m;++j){
		build(1,1,n);
		for(int i=1;i<=n;++i){
			f[i]=(j<=i?ask(1,1,n,j-1,i-1):0)+c[i];
			for(int k:e[i])if(st[k]-1)
				add(1,1,n,1,st[k]-1,w[k]);
		}
		ans=min(ans,f[n]);
	}
	printf("%d",ans);
	return 0;
}
```
## [斜率优化DP](斜率优化DP.md)
## [决策单调性优化DP](决策单调性优化DP.md)
## [矩阵优化DP](矩阵优化DP.md)
## [DDP](DDP.md)
