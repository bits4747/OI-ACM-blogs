---
public: true
---
## [P8819 [CSP-S 2022] 星战](https://www.luogu.com.cn/problem/P8819)
**题意：**

$n$ 个点 $m$ 条边的有向图，每条边都有激活和失活两种状态，初始时均为激活状态，进行以下四种操作 $q$ 次：

1.  失活某条边；
2.  失活以某个点为终点的所有边；
3.  激活某条边；
4.  激活以某个点为终点的所有边。

每次操作后，问如果只考虑激活的边，是否满足所有的点出度均为 $1$。

$1\le n,m,q\le 5e5$

**题解：**

操作 $1,3$ 很好处理，但操作 $2,4$ 单次需要 $O(n)$。

> Tricks：
> 
> 给每个点赋权值 $w_u$，可以通过权值和判断所有值是否都出现且仅出现 $1$ 次，这种操作被称为 “**和哈希**”（sum hash）。

因此，我们只需要维护 $s_i=\sum_{E(u,v),E(u,v)\text{存在}}w_u$，及所有点的 $s$ 之和，判断是否为 $\sum w_i$ 即可。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ll long long
const int N=5e5+5;
int n,m,x,y,q,ty;
vector<int>e[N];
ll w[N],s[N],ss[N],tot,sum;
int work(){
	scanf("%d%d",&ty,&x);
	if(ty==1) scanf("%d",&y),sum-=w[x],s[y]-=w[x];
	if(ty==3) scanf("%d",&y),sum+=w[x],s[y]+=w[x];
	if(ty==2) sum-=s[x],s[x]=0;
	if(ty==4) sum+=ss[x]-s[x],s[x]=ss[x];
	return sum==tot;
}
int main(){
	scanf("%d%d",&n,&m);mt19937 rng(time(0));
	for(int i=1;i<=n;++i) w[i]=rng(),tot+=w[i];
	for(int i=1;i<=m;++i)
		scanf("%d%d",&x,&y),e[x].push_back(y),sum+=w[x],s[y]+=w[x];
	for(int i=1;i<=n;++i) ss[i]=s[i];
	scanf("%d",&q);
	while(q--) printf(work()?"YES\n":"NO\n");
	return 0;
}
```
## [P8820 [CSP-S 2022] 数据传输](https://www.luogu.com.cn/problem/P8820)
**题意：**

一棵 $n$ 个点的树，如果两个点在树上的距离不超过 $k$，我们称这两个点可以互相传送信息。现在 $q$ 次询问 $s,t$，选出 $h=\{h_1=s,h_2,h_3,\cdots,h_{c-1},h_c=t\}$ 这 $c$ 个点，满足相邻两个点可以互相传送信息，请最小化 $\sum_{i\in h}v_i$。

$1\le n,q\le2e5,k\le3$

**题解：**

可以发现，当 $k\le2$ 时，经过的点一定在 $path(u,v)$ 上。

![](Pasted%20image%2020231011100548.png)

当 $k=3$ 时，可以借道儿子：

![](Pasted%20image%2020231011100547.png)

定义 $f_{i,j}$ 为到距离 $i$ 点 $j$ 处的最小花费，则从 $v$ 转移到 $u$ 为：

$$\begin{cases}f_{u,0}=\min(f_{v,0},f_{v,1},f_{v,2})+V_u\\f_{u,1}=\min(f_{v,0},mn_u+f_{v,1}),mn_u\text{为 u 最小的儿子}\\f_{u,2}=f_{v,1}\end{cases}$$

写成取 $\min$ 的矩阵为：

$$\begin{bmatrix} f_{u,0}\\ f_{u,1}\\ f_{u,2} \end{bmatrix} = \begin{bmatrix} V_u & V_u &V_u \\ 0 & mn_u & \infty \\ \infty & 0 & \infty \end{bmatrix} \times \begin{bmatrix} f_{v,0}\\ f_{v,1}\\ f_{v,2} \end{bmatrix}$$

这是 [DDP](DDP.md) 的弱化本本（不带修）。因此，我们维护一个上行、一个下行的倍增数组即可。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define ll long long
const int N=2e5+5;
const ll inf=1e18;
int n,a[N],lg[N],d[N],f[N][18],q,m,x,y,lca;
vector<int>e[N];
struct mat{
	ll s[3][3];
	mat operator *(const mat &b){
		mat t;for(int i=0;i<m;++i)for(int j=0;j<m;++j) t.s[i][j]=inf;
		for(int k=0;k<m;++k)for(int i=0;i<m;++i)for(int j=0;j<m;++j)
			t.s[i][j]=min(t.s[i][j],s[i][k]+b.s[k][j]);
		return t;
	}
}ee,e1,e2,up[N][18],dn[N][18];
void dfs(int u,int fa){
	d[u]=d[fa]+1,f[u][0]=fa;
	for(int i=1;i<m;++i)for(int j=0;j<m;++j) up[u][0].s[i][j]=dn[u][0].s[i][j]=inf;
	up[u][0].s[1][0]=dn[u][0].s[1][0]=0,up[u][0].s[2][1]=dn[u][0].s[2][1]=0;
	for(int i=0;i<m;++i) up[u][0].s[0][i]=a[fa],dn[u][0].s[0][i]=a[u];
	if(m==3){
		if(fa) up[u][0].s[1][1]=a[e[fa][0]];
		dn[u][0].s[1][1]=a[e[u][0]];
	}
	for(int i=1;i<=lg[d[u]];++i) f[u][i]=f[f[u][i-1]][i-1],
		up[u][i]=up[f[u][i-1]][i-1]*up[u][i-1],dn[u][i]=dn[u][i-1]*dn[f[u][i-1]][i-1];
	for(int v:e[u])if(v!=fa) dfs(v,u);
}
int LCA(int x,int y){
	if(d[x]<d[y]) swap(x,y);
	while(d[x]^d[y]) x=f[x][lg[d[x]-d[y]]];
	if(x==y) return x;
	for(int i=lg[d[x]];~i;--i)if(f[x][i]^f[y][i]) x=f[x][i],y=f[y][i];
	return f[x][0];
}
ll work(){
	scanf("%d%d",&x,&y),lca=LCA(x,y);
	for(int i=0;i<m;++i)for(int j=0;j<m;++j) e1.s[i][j]=e2.s[i][j]=(i==j?0:inf);
	ee.s[0][0]=a[x],ee.s[1][0]=ee.s[2][0]=inf;
	while(x^lca) e1=up[x][lg[d[x]-d[lca]]]*e1,x=f[x][lg[d[x]-d[lca]]];
	while(y^lca) e2=e2*dn[y][lg[d[y]-d[lca]]],y=f[y][lg[d[y]-d[lca]]];
	return (e2*e1*ee).s[0][0];
}
int main(){
	scanf("%d%d%d",&n,&q,&m);
	for(int i=1;i<=n;++i) scanf("%d",&a[i]);
	for(int i=1;i<n;++i) scanf("%d%d",&x,&y),e[x].push_back(y),e[y].push_back(x);
	for(int i=2;i<=n;++i) lg[i]=lg[i>>1]+1;
	for(int i=1;i<=n;++i)
		sort(e[i].begin(),e[i].end(),[](int x,int y){return a[x]<a[y];});
	dfs(1,0);
	while(q--) printf("%lld\n",work());
	return 0;
}
```
## [P7916 [CSP-S 2021] 交通规划](https://www.luogu.com.cn/problem/P7916)
**题意**

$n\times m$ 的网格，内部有 $2*mn-m-n$ 个线段，它们都有非负边权，此外还有 $2m+2n$ 条射线露在外面。$T$ 次询问，每次给定 $k$ 个在某几条射线上的染成黑色或白色的点和所在射线到网格的线段的边权，求将整个网格染色后，端点颜色不同的边的最小权值和。

$n,m\le 500$，$T\le\sum k\le 50$。

**题解：**

要把黑白两色分割，问题可以转化为经典最小割模型，但 Dinic 跑不过。

![](Pasted%20image%2020231012134527.png)

考虑 $k=2$ 的情况，可以发现，最小割等同于如下路径：

![](Pasted%20image%2020231012141027.png)

因此，我们对原图建对偶图，跑最短路。

当 $k\ne 2$ 时：

射线上相邻两个同色点不必分割，可以合并。于是原图剩下一个点或偶数个黑白相间点形成的面（即对偶图上剩下偶数个射线点）。

此数据的建图如下：

```
3 2 1
4 16 
4 18 
19 
17 
14 
7
8 1 0
6 3 0
7 4 0
6 5 0
1 6 1
14 8 1
2 9 0

```

![](Pasted%20image%2020231012134528.png)

![](Pasted%20image%2020231012134529.png)

这些点两两配对形成的最短路一定能把原图划分为若干黑白色块，我们要求所有配对方案的最小值。

定义 $f_{i,j}$ 为对偶图上 $i\sim j$ 的射线点匹配的最小花费，则 $f_{i,j}=min(f_{i,k}+f_{k+1,j},f_{i+1,j-1}+dis(i,j))$。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=3e5,M=25e5,K=105;
#define nd(x,y) (x)*(m+1)+(y)
int n,m,nm,eg,W,T,hh[N],lt,tot,h[N],nx[M],v[M],w[M],Q,cnt,cc,id[K],l,r,ww[2005],d[N],val[K][K];
long long f[K][K],ans;
void add(int x,int y,int W){nx[++tot]=h[x],h[x]=tot,v[tot]=y,w[tot]=W;}
void adde(int x,int y,int W){add(x,y,W),add(y,x,W);}
struct qwq{int w,x,c;}s[K];
struct node{
	int x,d;
	bool operator <(const node &b)const{return d>b.d;}
}u;
priority_queue<node>q;
int gid(int x){
	if(x<=m) return nd(0,x);
	if((x-=m)<=n) return nd(x,m);
	if((x-=n)<=m) return nd(n,m-x);
	return x-=m,nd(n-x,0);
}
void dij(int st){
	for(int i=nm+cnt;~i;--i) d[i]=1e9;
	d[st]=0,q.push((node){st,0});
	while(!q.empty()){
		u=q.top(),q.pop();
		if(u.d^d[u.x]) continue;
		for(int i=h[u.x];i;i=nx[i])if(d[v[i]]>u.d+w[i])
			d[v[i]]=u.d+w[i],q.push((node){v[i],d[v[i]]});
	}
}
void work(){
	scanf("%d",&Q);
	for(int i=1;i<=eg;++i) ww[i]=0;
	for(int i=1;i<=Q;++i) scanf("%d%d%d",&s[i].w,&s[i].x,&s[i].c),ww[s[i].x]=s[i].w;
	sort(s+1,s+1+Q,[](qwq a,qwq b){return a.x<b.x;}),cnt=0;
	for(int i=1;i<=Q;++i)if(s[i].c!=s[i%Q+1].c) id[++cnt]=i;
	if(cnt<2){printf("0\n");return;}
	tot=lt,cc=cnt<<1;
	for(int i=0;i<nm;++i) h[i]=hh[i];
	for(int i=1;i<=cnt;++i) h[i+nm]=0;
	for(int i=1;i<=eg;++i) adde(gid(i-1),gid(i),ww[i]);
	for(int i=1;i<=cnt;++i){
		l=s[id[i]].x,r=s[id[i]%Q+1].x;
		if(l>r) r+=eg;
		for(int j=l;j<r;++j) adde(gid((j-1)%eg+1),nm+i,0);
	}
	for(int i=1;i<=cnt;++i){
		dij(nm+i);
		for(int j=1;j<cnt;++j) val[i][(i+j-1)%cnt+1]=d[nm+(i+j-1)%cnt+1];
	}
	memset(f,0x3f,sizeof(f)),ans=f[0][0];
	for(int i=1;i<cc;++i) f[i][i+1]=val[(i-1)%cnt+1][i%cnt+1];
	for(int l=4;l<=cnt;l+=2)for(int i=1,j=i+l-1;j<=cc;++i,++j){
		f[i][j]=f[i+1][j-1]+val[(i-1)%cnt+1][(j-1)%cnt+1];
		for(int k=i+1;k<j;k+=2) f[i][j]=min(f[i][j],f[i][k]+f[k+1][j]);
	}
	for(int i=1;i<=cnt;++i) ans=min(ans,f[i][i+cnt-1]);
	printf("%lld\n",ans);
}
int main(){
	scanf("%d%d%d",&n,&m,&T),nm=(n+1)*(m+1),eg=n+m+n+m;
	for(int i=1;i<n;++i)for(int j=1;j<=m;++j) scanf("%d",&W),adde(nd(i,j-1),nd(i,j),W);
	for(int i=1;i<=n;++i)for(int j=1;j<m;++j) scanf("%d",&W),adde(nd(i-1,j),nd(i,j),W);
	lt=tot;
	for(int i=1;i<nm;++i) hh[i]=h[i];
	while(T--) work();
	return 0;
}
```
## [P7077 [CSP-S2020] 函数调用](https://www.luogu.com.cn/problem/P7077)
**题意：**

有一个长度为 $n$ 的序列，$m$ 个操作，操作有如下三种：

1. 单点加
2. 全局乘
3. 以一定顺序调用其他 $c_i$ 个操作，保证不直接或间接调用自身

$n,m\le1e5,\sum c_i\le1e6$

**题解：**

因为有操作 3，暴力处理的话操作个数可达到 $C^2$ 级别。

可以发现，所有操作最终作用到的底层操作都是单点加，所有乘法可以转换为加法，不妨考虑如何求单点加。

所有单点加的操作次数为操作序列在其后面的全局乘的积（多次同一单点操作分别算）。

由于操作 3 "保证不直接或间接调用自身"，操作为 DAG，我们先 dfs 算出进行操作 $i$ 会乘多少，再通过拓扑序算出单点加的次数。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e5+5,p=998244353;
int n,m,q,a[N],ty,x,y,vis[N],in[N],f[N],sm=1,ad[N];
struct qwq{int x,sum,mul;}s[N];
vector<int>e[N];
void dfs(int u){
	vis[u]=1;
	for(int v:e[u]){
		if(!vis[v]) dfs(v);
		s[u].mul=1ll*s[u].mul*s[v].mul%p;
	}
}
queue<int>Q;
int main(){
	scanf("%d",&n);
	for(int i=1;i<=n;++i) scanf("%d",&a[i]);
	scanf("%d",&m);
	for(int i=1;i<=m;++i){
		scanf("%d%d",&ty,&x),s[i].mul=1;
		if(ty==1) scanf("%d",&s[i].sum),s[i].x=x;
		if(ty==2) s[i].mul=x;
		if(ty==3) for(int j=1;j<=x;++j) scanf("%d",&y),e[i].push_back(y),++in[y];
	}
	for(int i=1;i<=m;++i) reverse(e[i].begin(),e[i].end());
	for(int i=1;i<=m;++i)if(!in[i]) dfs(i);
	scanf("%d",&q);
	for(int i=1;i<=q;++i) scanf("%d",&f[i]);
	for(int i=q;i;--i) (ad[f[i]]+=sm)%=p,sm=1ll*sm*s[f[i]].mul%p;
	for(int i=1;i<=n;++i) a[i]=1ll*a[i]*sm%p;
	for(int i=1;i<=m;++i)if(!in[i]) Q.push(i);
	while(!Q.empty()){
		x=Q.front(),Q.pop(),(a[s[x].x]+=1ll*ad[x]*s[x].sum%p)%=p;
		for(int v:e[x]){
			ad[v]=(ad[v]+ad[x])%p,ad[x]=1ll*ad[x]*s[v].mul%p;
			if(!(--in[v])) Q.push(v);
		}
	}
	for(int i=1;i<=n;++i) printf("%d ",a[i]);
	return 0;
}
```
## [P7078 [CSP-S2020] 贪吃蛇](https://www.luogu.com.cn/problem/P7078)
**题意：**

$n(n\le1e6)$ 条蛇，蛇按权为第一关键字编号为第二关键字排序。每次最大的蛇可以选择吃最小的蛇，并把权减去最小的蛇作为新权；或者选择结束游戏。蛇希望在活着的前提下吃更多的蛇，并且蛇足够聪明，求最后剩几条蛇。多组测试数据（$T\le10$）。

**题解：**

首先，如果吃掉最小的蛇后自己不是最小或只剩下自己，可以放心吃。因为后面比你小的蛇吃掉比你吃掉的蛇大的蛇，一定会比你小，后面的蛇会帮你做决策，自己一定不会被吃掉。

当吃掉最小的蛇后变成了最小的蛇后，要判断里下一个可以放心吃的蛇与自己的距离（指当前排序后的坐标差），为奇数不能吃，偶数可以吃（下一条蛇为了活命不会吃）。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define mp make_pair
#define pii pair<int,int>
#define fi first
#define se second
const int N=1e6+5;
int t,n,k,x,y,s[N],fl,ans;
pii a,b,c;
void init(){
	scanf("%d",&k);
	for(int i=1;i<=k;++i) scanf("%d%d",&x,&y),s[x]=y;
}
deque<pii>q1,q2;
pii F(){
	pii e;
	if(q2.empty()) e=q1.front(),q1.pop_front();
	else if(q1.empty()) e=q2.front(),q2.pop_front();
	else if(q2.front()<q1.front()) e=q2.front(),q2.pop_front();
	else e=q1.front(),q1.pop_front();
	return e;
}
pii B(){
	pii e;
	if(q2.empty()) e=q1.back(),q1.pop_back();
	else if(q1.empty()) e=q2.back(),q2.pop_back();
	else if(q2.back()>q1.back()) e=q2.back(),q2.pop_back();
	else e=q1.back(),q1.pop_back();
	return e;
}
void work(){
	q1.clear(),q2.clear(),fl=0;
	for(int i=1;i<=n;++i) q1.push_back(mp(s[i],i));
	while(q1.size()+q2.size()>1){
		a=F(),b=B(),c=mp(b.fi-a.fi,b.se);
		if((!q1.empty()&&c>q1.front())||(q1.empty()&&q2.empty())) q2.push_front(c);
		else{a=c,fl=1;break;}
	}
	ans=q1.size()+q2.size();
	if(!fl){printf("%d\n",ans);return;}
	while(q1.size()+q2.size()>0){
		b=B(),c=mp(b.fi-a.fi,b.se);
		if(q1.size()+q2.size()&&(q1.empty()||c<q1.front())&&(q2.empty()||c<q2.front()))
			a=c,fl^=1;
		else break;
	}
	printf("%d\n",ans+1+fl);
}
int main(){
	scanf("%d%d",&t,&n),--t;
	for(int i=1;i<=n;++i) scanf("%d",&s[i]);
	work();
	while(t--) init(),work();
	return 0;
}
```
