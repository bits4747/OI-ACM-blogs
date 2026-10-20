---
public: true
---
#图论 #网络流

## 复杂度
$O(n^2m)$，但实际上经常跑不满。（[证明](https://www.zhihu.com/question/34374412/answer/2306847964)）

> 如果需要令 Dinic 算法的实际运行时间接近其 **理论上界**，我们需要构造有 **特殊性质的网络** 作为输入。由于在算法竞赛实践中，对于网络流知识相关的考察常侧重于将原问题 **建模** 为网络流问题的技巧。此时，我们的建模通常不包含令 Dinic 算法执行缓慢的特殊性质；恰恰相反，Dinic 算法在大部分图上效率非常优秀。因此，网络流问题的数据范围通常较大，直接 $O(n^2m)$ 估计运行时间这一方式并不适用。

特殊图的复杂度：
> -   在单位容量的网络上，Dinic 算法的总时间复杂度是 $O(|E| \min(|E|^\frac{1}{2}, |V|^{\frac{2}{3}}))$。

> -   在单位容量的网络上，如果除源汇点外每个结点 $u$ 都满足 $\mathit{deg}_{\mathit{in}}(u) = 1$ 或 $\mathit{deg}_{\mathit{out}}(u) = 1$，Dinic 算法的总时间复杂度是 $O(|E||V|^{\frac{1}{2}})$。（eg. 二分图最大匹配）

^735c76

## 模板：[P3376 【模板】网络最大流](https://www.luogu.com.cn/problem/P3376)
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=205,M=1e4+5,inf=(1<<31)-1;
int n,m,s,t,x,y,w,no[N],tot=1,h[N],nxt[M],to[M],v[M],d[N];
long long ans;
void add(int x,int y,int va){nxt[++tot]=h[x],h[x]=tot,to[tot]=y,v[tot]=va;}
queue<int>q;
void bfs(){
	for(int i=1;i<=n;++i) d[i]=-1;
	d[s]=0,q.push(s);
	while(!q.empty()){
		int u=q.front();q.pop();
		for(int i=h[u];i;i=nxt[i])
			if(v[i]&&d[to[i]]==-1) d[to[i]]=d[u]+1,q.push(to[i]);
	}
}
long long dfs(int u,long long f){
	if(u==t) return f;
	for(int &i=no[u];i;i=nxt[i]){
		if(d[to[i]]!=d[u]+1||!v[i]) continue;
		long long ff=dfs(to[i],min(f,(long long)v[i]));
		if(ff>0){v[i]-=ff,v[i^1]+=ff;return ff;}
	}
	return 0;
}
void dinic(){
	while(1){
		bfs();
		if(d[t]==-1) return ;
		for(int i=1;i<=n;++i) no[i]=h[i];
		long long f;
		while((f=dfs(s,inf))>0) ans+=f;
	}
}
int main(){
	scanf("%d%d%d%d",&n,&m,&s,&t);
	for(int i=1;i<=m;++i) scanf("%d%d%d",&x,&y,&w),add(x,y,w),add(y,x,0);
	dinic();
	printf("%lld",ans);
	return 0;
}
```
## 构造方案
擅用残余网络。
## 退流
![[Pasted image 20230321124537.png]]
## 最大流
### [P2766 最长不下降子序列问题](https://www.luogu.com.cn/problem/P2766)

^3d4105

首先树状数组求 LIS，求出 $dp_i$ 和 $S$（最长不下降子序列的长度）。

关注 $dp$ 的转移过程，发现可以按 $dp$ 值把图分层。

![[Pasted image 20230926192708.png]]

网络流建模：
1. 每个 $i$ 向 $i+n$ 连边，流量为 $1$，保证每个数最多选一次；
2. 从源点向每个 $dp[i]=1$ 的​点 $i$ 建边，流为 $1$；
3. 对于每对 $i,j(i<j)$，当 $a[i]\le a[j]$ 且 $dp[i]+1=dp[j]$ 时，$i+n$ ​向 $j$ 建边，流为$1$；
4. 从 $dp[i]=S$ 的 $i+n$ 向汇点建边，流为$1$。

跑一边 Dinic 可求出第二问。

第三问把 $1$ 和 $n$ 的点的相关流量设为 $INF$ 即可。

[code](https://www.luogu.com.cn/record/98568187)
### [P2754 [CTSC1999]家园 / 星际转移问题](https://www.luogu.com.cn/problem/P2754)
看到周期，一开始想着按 $1\to15$ 的最小公倍数划分，结果发现要 $360360$，绝对 T 飞。

仔细想想有解情况的上界，发现大概 $1000~days$ 左右：

![[Pasted image 20230313162748.png]]

于是先用并查集判断是否有解（地月不连通则无解）。

对于有解的情况，考虑按照时间分层，每次在之前的残量网络上加边：对飞船 $i$ 当前时间存在的转移路线 $u\to v$，连 $now_u\stackrel{p_i}\longrightarrow nxt_v$ 。当最大流大于人数时当前时间即为答案。

建图大概长这样：
![[Pasted image 20230313164232.png]]
### [P3163 [CQOI2014]危桥](https://www.luogu.com.cn/problem/P3163)
[题解](https://www.luogu.com.cn/blog/user39887/solution-p3163)

因为要求往返，可以把桥的容量除以 $2$，变往返为单程。基本网络流建模后跑 Dinic。

但是，会出现两个问题：
1. 一些（设为 $x$ 个） $a_1\to a_2$ 变成了 $a_1\to b_2$，同时 $x$ 个 $b_1\to b_2$ 变成了 $b_1\to a_2$。
2. 危桥只能走一次，但可能会正反走两次。

因此，我们交换 $b_1​,b_2$​ 后再判断是否满流。

![[Pasted image 20230313200040.png]]

![[Pasted image 20230313200054.png]]

[code](https://www.luogu.com.cn/record/104616365)
### [P5029 T'ill It's Over](https://www.luogu.com.cn/problem/P5029)
考虑只有操作一，就是基本的建图 $a+k\stackrel{l}\longrightarrow b$。

加上操作 $2,3,4$，建立小源点 $a',b'$ 代表整个区间 $a_i+k,b_i$，连边 $a'\stackrel{l}\longrightarrow b’$，再把 $a',b'$ 和 $a_i+k,b_i$ 连边。

但是直接连边是 $M*K$ 的，会炸。发现要连一段区间，可以用线段树优化建图。
#### 线段树优化建图
建两棵线段树，叶子节点共用，一棵为入树，一棵为出树。

![[Pasted image 20230926192715.png]]
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=34e4,M=4e6;
int n,m,X,op,t,x,y,rt1,rt2,nd=1,ls[N],rs[N],cnt=1,en,h[N],no[N],nx[M],v[M],w[M],d[N],ans;
void add(int x,int y,int W){nx[++cnt]=h[x],h[x]=cnt,v[cnt]=y,w[cnt]=W;}
void adde(int x,int y,int W){add(x,y,W),add(y,x,0);}
queue<int>q;
void bfs(){
	for(int i=0;i<=nd;++i) d[i]=-1;
	d[0]=0,q.push(0);int u;
	while(!q.empty()){
		u=q.front(),q.pop();
		for(int i=h[u];i;i=nx[i])if(w[i]&&d[v[i]]==-1) d[v[i]]=d[u]+1,q.push(v[i]);
	}
}
int dfs(int u,int f){
	if(u==1) return f;
	for(int &i=no[u];i;i=nx[i])if(w[i]&&d[u]+1==d[v[i]]){
		int ff=dfs(v[i],min(w[i],f));
		if(ff) return w[i]-=ff,w[i^1]+=ff,ff;
	}
	return 0;
}
void dinic(){
	while(1){
		bfs();
		if(d[1]==-1) break;
		for(int i=0;i<=nd;++i) no[i]=h[i];
		int f;
		while((f=dfs(0,n))) ans+=f;
	}
}
void build(int &k1,int &k2,int l,int r){//k1入树up-->down  k2出树down-->up
	if(l==r){
		k1=k2=++nd;
		if(l==1) adde(0,nd,n);
		if(l==X) adde(nd,1,n);
		return ;
	}
	k1=++nd,k2=++nd;int mi=(l+r)>>1;
	build(ls[k1],ls[k2],l,mi),build(rs[k1],rs[k2],mi+1,r);
	adde(k1,ls[k1],n),adde(k1,rs[k1],n),adde(ls[k2],k2,n),adde(rs[k2],k2,n);
}
void link(int k,int l,int r,int ty){
	if(x<=l&&r<=y){
		if(ty==1) adde(nd,k,n);
		else adde(k,nd,n);
		return ;
	}
	int mi=(l+r)>>1;
	if(x<=mi) link(ls[k],l,mi,ty);
	if(y>mi) link(rs[k],mi+1,r,ty);
}
int main(){
	scanf("%d%d%d",&n,&m,&X);
	build(rt1,rt2,1,X);
	for(int i=1;i<=m;++i){
		scanf("%d%d%d",&op,&t,&x),y=x,++nd;
		if(op==2||op==4) scanf("%d",&y);
		link(rt2,1,X,2);
		scanf("%d",&x),y=x,++nd;
		if(op==3||op==4) scanf("%d",&y);
		link(rt1,1,X,1);
		adde(nd-1,nd,t);
	}
	dinic();
	printf("%d",ans);
	return 0;
}
```
## [[最小割]]
## 模拟最大流/最小割
### [CF724E Goods transportation](https://www.luogu.com.cn/problem/CF724E)
![[Pasted image 20230316111702.png]]

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e4+5;
int n,p[N],s[N],o;
long long c,f[2][N],ans=1e18;
int main(){
	scanf("%d%lld",&n,&c);
	for(int i=1;i<=n;++i) scanf("%d",&p[i]);
	for(int i=1;i<=n;++i) scanf("%d",&s[i]);
	for(int i=1;i<=n;++i){
		o=i&1,f[o][0]=f[o^1][0]+p[i],f[o][i]=f[o^1][i-1]+s[i];
		for(int j=1;j<i;++j) f[o][j]=min(f[o^1][j-1]+s[i],f[o^1][j]+p[i]+j*c);
	}
	o=n&1;
	for(int i=0;i<=n;++i) ans=min(ans,f[o][i]);
	printf("%lld",ans);
	return 0;
}
```

$O(n~log~n)$ 的贪心做法：

![[Pasted image 20230316111529.png]]
## 染色网络流
染色网络流在网络流各方面都有很多应用，其中黑白染色在二分图、相邻网格上的应用最为典型。

以下仅列举一些典型例题。

### [P3355 骑士共存问题](https://www.luogu.com.cn/problem/P3355)
黑白染色后忽略障碍点，源连黑，白连汇，容量为 $1$；黑点向可攻击到的白点连边，容量 $+∞$，最大流即为答案。
### [P5458 [BJOI2016]水晶](https://www.luogu.com.cn/problem/P5458)
对六边形三色染色后可以发现，要保证不引发共振，相邻的三色不能同时选。

1. 对于绿点：$S\stackrel{c}\longrightarrow i$。
2. 对于橙点：$i\stackrel{c}\longrightarrow T$。
3. 对于白点：$i\stackrel{c*1.1}\longrightarrow i'$，相邻的绿点连入白点，白点连入相邻橙点，容量 $+∞$。

![[Pasted image 20230926192710.png]]

由于这题在二维平面上给出三个坐标轴，会导致多个三元组表示的位置相同。（eg. $(0,0,0)=(1,1,1)$ ）

可以发现，$x,y,z$ 同时走一步相当于没走，可以把 $(x,y,z)$ 变成 $(x-z,y-z)$。

转换坐标后，可以按 $(x+y)$ 的余数染色，但由于负数取模会出现神奇的 bug，统一把 $x,y$ 加上 $1002$ 平移为正数。

[code](https://www.luogu.com.cn/record/104867800)
### [P3756 [CQOI2017]老C的方块](https://www.luogu.com.cn/problem/P3756)
![[Pasted image 20230926192711.png]]

![[Pasted image 20230316135419.png]]

建边细节看代码。 建完模后跑最小割。

[code](https://www.luogu.com.cn/record/104855458)
## [[二分图]]
## 最小路径覆盖
**图的路径覆盖：** 在 DAG 上用（边）不相交的简单路径覆盖所有的节点。
### 定理：最小路径覆盖 = 总点数 - 拆点二分图最大匹配
![[Pasted image 20230323203738.png]]
### [P2764 最小路径覆盖问题](https://www.luogu.com.cn/problem/P2764)


路径输出可以用并查集在残量网络上维护 “串联” 的边，找出每条路径的起始点，再不断往满流的地方跑即可构造出路径。

[code](https://www.luogu.com.cn/record/98483137)
### [P2765 魔术球问题](https://www.luogu.com.cn/problem/P2765)
如果问 $n$ 个球最小需要多少柱子就是裸的最小路径覆盖问题。但题目求的是  $n$ 个柱子最多 **依次** 能放几个球。

感觉答案不会太大，实际上跑一跑 $55$ 个柱子大约能放 $1500$。

因此，我们可以一个一个加点，在上一次的残量网络上跑 Dinic。当匹配数为 $0$ 时说明要新增一个柱子了。

构造答案时可以记录每根柱子第一个放的球，再不断往满流的地方跑。

[code](https://www.luogu.com.cn/record/98616817)
### [P5769 [JSOI2016]飞机调度](https://www.luogu.com.cn/problem/P5769)
![[Pasted image 20230324100642.png]]
```cpp
#include<bits/stdc++.h>
using namespace std;
const int X=505,N=1005,M=5e5+5;
int n,m,en,p[X],C[X][X],D[X][X],x[X],y[X],t[X],d[N],cnt=1,h[N],no[N],nx[M],v[M],w[M],ans;
void add(int x,int y,int W){nx[++cnt]=h[x],h[x]=cnt,v[cnt]=y,w[cnt]=W;}
void adde(int x,int y,int W){add(x,y,W),add(y,x,0);}
queue<int>q;
void bfs(){
	for(int i=0;i<=en;++i) d[i]=-1;
	d[0]=0,q.push(0);int u;
	while(!q.empty()){
		u=q.front(),q.pop();
		for(int i=h[u];i;i=nx[i])if(d[v[i]]==-1&&w[i]) d[v[i]]=d[u]+1,q.push(v[i]);
	}
}
int dfs(int u,int f){
	if(u==en) return f;
	for(int &i=no[u];i;i=nx[i])if(w[i]&&d[v[i]]==d[u]+1){
		int ff=dfs(v[i],min(f,w[i]));
		if(ff) return w[i]-=ff,w[i^1]+=ff,ff;
	}
	return 0;
}
void dinic(){
	while(1){
		bfs();
		if(d[en]==-1) return ;
		for(int i=0;i<=en;++i) no[i]=h[i];
		int f;
		while((f=dfs(0,m))) ans+=f;
	}
}
int main(){
	scanf("%d%d",&n,&m),en=m+m+1;
	for(int i=1;i<=n;++i) scanf("%d",&p[i]);
	for(int i=1;i<=n;++i)for(int j=1;j<=n;++j) scanf("%d",&C[i][j]),D[i][j]=C[i][j]+(i!=j)*p[j];
	for(int k=1;k<=n;++k)for(int i=1;i<=n;++i)for(int j=1;j<=n;++j)
		if(D[i][j]>D[i][k]+D[k][j]) D[i][j]=D[i][k]+D[k][j];
	for(int i=1;i<=m;++i) scanf("%d%d%d",&x[i],&y[i],&t[i]),adde(0,i,1),adde(i+m,en,1);
	for(int i=1;i<=m;++i)for(int j=1;j<=m;++j)
		if(t[i]+C[x[i]][y[i]]+p[y[i]]+D[y[i]][x[j]]<=t[j]) adde(i,j+m,1);//!!!
	dinic();
	printf("%d",m-ans);
	return 0;
}
```
## 最小链覆盖
![[Pasted image 20230324123212.png]]

最小链覆盖在 DAG 上就是最小可交路径覆盖。

![[Pasted image 20230324112056.png]]
### [P4589 [TJOI2018]智力竞赛](https://www.luogu.com.cn/problem/P4589)
考虑二分，将价值 $\le mid$ 的点视作关键点，求所有关键点的最小可交路径覆盖。

考虑如何处理非关键点。当 $p_i>mid$ 时，可以连 $i,i+m$，使得 $i$ 无论如何都能贡献 $1$ 个匹配，如果关键点的最小可交路径覆盖不会经过 $i$ 也不会对答案产生影响。

[code](https://www.luogu.com.cn/record/105674300)
## 最长反链
最长反链在 DAG 上体现为最多可选几个不相连（不能直接或间接到达）的点。

### Dilworth 定理：
<font color="#ff0000" size=5><center>最小链覆盖 = 最长反链</center></font>
### 构造：
记跑最小链覆盖后得到的二分图的匹配数为最大独立集为 $I$，对于一个点 $u$ 如果满足出入点都在 $I$ 内，则将其加入最长反链答案集合 $A$。

由于 $A$ 任意点 $u$ 的出入点都在最大独立集 $I$ 内，任意两点不连通，满足反链限制。

代码实现上只需找出二分图的最大独立集（最小点覆盖的补集[[二分图#二分图最小点覆盖#构造]]）即可。
### Dilworth 定理证明：

首先 $最长反链\le 最小链覆盖$，因为每个最小链划分的链上最多能选一个元素放到反链里。

接着，需要证明 $最长反链\ge 最小链覆盖$，可从构造的角度理解。

记原图点数为 $n$，跑最小链覆盖后得到的二分图的匹配数为 $m$，最大独立集为 $I$，最长反链的点集为 $A$。

![[Pasted image 20230324152447.png]]
### [P4298 [CTSC2008]祭祀](https://www.luogu.com.cn/problem/P4298)
求最长反链及构造一种方案见上，现在考虑如何判断一点能否出现在最长反链上。

考虑强制选取一点 $i$ 放入反链中（把 $i$ 及与 $i$ 连通的点都删掉），判断还可放入反链中的点的个数是否为最长反链 $-1$，是则可以，反之。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int X=105,N=205,M=5e5+5;
int n,m,en,x,y,p,b[N],c[X][X],d[N],cnt=1,h[N],no[N],nx[M],v[M],w[M],ans,mx,vis[N];
void add(int x,int y,int W){nx[++cnt]=h[x],h[x]=cnt,v[cnt]=y,w[cnt]=W;}
void adde(int x,int y,int W){add(x,y,W),add(y,x,0);}
queue<int>q;
void bfs(){
	for(int i=0;i<=en;++i) d[i]=-1;
	d[0]=0,q.push(0);int u;
	while(!q.empty()){
		u=q.front(),q.pop();
		for(int i=h[u];i;i=nx[i])if(d[v[i]]==-1&&w[i]) d[v[i]]=d[u]+1,q.push(v[i]);
	}
}
int dfs(int u,int f){
	if(u==en) return f;
	for(int &i=no[u];i;i=nx[i])if(w[i]&&d[v[i]]==d[u]+1){
		int ff=dfs(v[i],min(f,w[i]));
		if(ff) return w[i]-=ff,w[i^1]+=ff,ff;
	}
	return 0;
}
void dinic(){
	while(1){
		bfs();
		if(d[en]==-1) return ;
		for(int i=0;i<=en;++i) no[i]=h[i];
		int f;
		while((f=dfs(0,n))) ans+=f;
	}
}
void dfs2(int u){
	vis[u]=1;
	for(int i=h[u];i;i=nx[i])if(v[i]&&v[i]!=en&&!w[i]&&!vis[v[i]]) dfs2(v[i]);
}
int check(int k){
	cnt=1,ans=0,p=0;
	for(int i=0;i<=en;++i) h[i]=0;
	for(int i=1;i<=n;++i) b[i]=0;
	for(int i=1;i<=n;++i)if(c[i][k]||c[k][i]||i==k) b[i]=1;
	for(int i=1;i<=n;++i)if(!b[i]) adde(0,i,1),adde(i+n,en,1),++p;
	for(int i=1;i<=n;++i)if(!b[i])for(int j=1;j<=n;++j)if(!b[j]&&c[i][j]) adde(i,j+n,1);
	dinic();
	return p-ans;
}
int main(){
	scanf("%d%d",&n,&m),en=n+n+1;
	for(int i=1;i<=m;++i) scanf("%d%d",&x,&y),c[x][y]=1;
	for(int o=1;o<=n;++o)for(int i=1;i<=n;++i)for(int j=1;j<=n;++j) c[i][j]|=c[i][o]&c[o][j];
	mx=check(0),printf("%d\n",mx);
	for(int i=n*4;i>=4;i-=4)if(w[i]) dfs2(i/4+n);
	for(int i=1;i<=n;++i) printf("%d",(!vis[i])&vis[i+n]);
	printf("\n");
	for(int i=1;i<=n;++i){
		if(check(i)==mx-1) putchar('1');
		else putchar('0');
	}
	return 0;
}
```
### [CF590E Birthday](https://www.luogu.com.cn/problem/CF590E)
我们只需找出一个字符串的所有子串并将他们连边，再求最小反链。

但数据范围过大，直接在一个字符串的每个节点上跳 $fail$ 边显然会寄。考虑偏序集可以通过 floyd 传递闭包，只需找出一个串的 “最大子串”（即当前串是最小的包含它的串）即可。

因此，需维护当前点 $u$ 前最后出现的串 $b_u$，可在建 $fail$ 树时通过 $fail$ 边顺便转移。

重新遍历每一个串，将 $u$ 和 $b_u$ 连边（当 $u=pos_i$ 时，将 $u$ 和 $b_{nxt_u}$ 连边）。

由于 AC 自动机的点数高达 $1e7$ 不可采用任何递归（深搜）写法，否则爆栈。

AC 自动机建图部分：
```cpp
for(int i=1;i<=n;++i){
	scanf("%s",s),m=strlen(s),u=1;
	for(int j=0;j<m;++j){
		x=s[j]-'a';
		if(!ch[u][x]) ch[u][x]=++tot,fa[tot]=u;
		u=ch[u][x];
	}
	b[u]=i,pos[i]=u;
}
ch[0][0]=ch[0][1]=1,q.push(1);
while(!q.empty()){
	u=q.front(),q.pop();
	for(int i=0;i<2;++i){
		if(!ch[u][i]) ch[u][i]=ch[nxt[u]][i];
		else{
			nxt[ch[u][i]]=ch[nxt[u]][i],q.push(ch[u][i]);
			if(!b[ch[u][i]]) b[ch[u][i]]=b[nxt[ch[u][i]]];
		}
	}
}
for(int i=1;i<=n;++i){
	c[i][b[nxt[pos[i]]]]=1;
	for(int j=fa[pos[i]];j!=1;j=fa[j])if(b[j]) c[i][b[j]]=1;
}
```
[code](https://www.luogu.com.cn/record/105761877)
