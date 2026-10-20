---
public: true
---
#图论 #Tarjan
## 强连通分量
### 定义
- 在**有向图** $G$ 中，如果两个顶点 $u,v$ 间有 $u\to v$ 的有向路径，同时还有 $v\to u$ 的有向路径，则称两个顶点强连通。如果有向图 $G$ 的每两个顶点都强连通，称 $G$ 是一个强连通图。有向图的极大强连通子图，称为强连通分量。

### 用处
我们可以将一张图的每个强连通分量都缩成一个点。

然后这张图会变成一个 DAG，可以进行拓扑排序、DP、搜索等。

### 模板
```cpp
void Tarjan(int u){
	dnf[u]=low[u]=++cnt,vis[u]=1;  //初始化 
	st.push(u);  //压栈 
	int len=vec[u].size();
	for(int i=0;i<len;i++){   //遍历每条边 
		if(!dnf[vec[u][i]]){  //未入过栈 
			Tarjan(vec[u][i]);//入栈 
			low[u]=min(low[u],low[vec[u][i]]);  //更新low 
		}
		else if(vis[vec[u][i]]) low[u]=min(low[u],dnf[vec[u][i]]);  //已入过栈，找还在栈里的点作为该连通量的根
	}
	if(dnf[u]==low[u]){  //若为该连通量的根
		sum++;  //强连通分量数量++ 
		int t;
		do{
			t=st.top();
			st.pop();
			vis[t]=0;  //出栈+标记 
			co[t]=sum;  //染色 
		}while(u!=t);
	}
} 
for(int i=1;i<=n;i++) if(!dnf[i]) Tarjan(i);
```
### [#10091. 「一本通 3.5 例 1」受欢迎的牛](https://loj.ac/p/10091)
记录各个强连通分量的出度，有出度证明不是明星（并非所有奶牛都喜欢它）。

若 $0$ 个出度为 $0$ 的强连通分量--无明星奶牛；

只有 $1$ 个出度为 $0$ 的强连通分量，则这个强连通分量内的奶牛被所有奶牛喜欢；

$n$ 个出度为 $0$ 的强连通分量--奶牛被分成互不喜欢的 n 组 。

### [#10093. 「一本通 3.5 练习 1」网络协议](https://loj.ac/p/10093)
任务A：入度为 $0$ 需要提供新软件。

任务B：要求整张图形成一个环，而环中所有节点入度和出度都不为 $0$，那么最少的方案应为把出度为 $0$ 的点连上入度为 $0$ 的点，所以任务 B 的答案就是入度为 $0$ 与出度为 $0$ 的点的较大值。

### [#10095. 「一本通 3.5 练习 3」间谍网络](https://loj.ac/p/10095)
YES：每个入度为 $0$ 的强连通分量里最小花费的和。

NO：由于不能被控制的间谍可能再入度不为 $0$ 的联通分量中，所以缩点后搜索，标记可收买的间谍。

### [#10096. 「一本通 3.5 练习 4」抢掠计划](https://loj.ac/p/10096)
标记每个强连通分量是否有酒吧及其总价值，同时找出起始点所在的强连通分量，缩点后记忆化搜索/ DP 一下即可。

[code](https://www.luogu.com.cn/record/89226695)

```cpp
void dfs(int u){
	int len=tu[u].size(),v;
	vi[u]=1;
	for(int i=0;i<len;++i){
		v=tu[u][i];
		if(!vi[v]) dfs(v);
		dp[u]=max(dp[u],val[u]+dp[v]);
	}
}
```

### [#10092. 「一本通 3.5 例 2」最大半连通子图](https://loj.ac/p/10092)
**题意：**

一个有向图 $G=\left(V,E\right)$ 称为半连通的 (Semi-Connected)，如果满足：$\forall u,v\in V$，满足 $u\to v$ 或 $v\to u$，即对于图中任意两点 $u,v$，存在一条 $u$ 到 $v$ 的有向路径或者从 $v$ 到 $u$ 的有向路径。

若 $G'=\left(V',E'\right)$ 满足 $V'\subseteq V$，$E'$ 是 $E$ 中所有跟 $V'$ 有关的边，则称 $G'$ 是 $G$ 的一个导出子图。若 $G'$ 是 $G$ 的导出子图，且 $G'$ 半连通，则称 $G'$ 为 $G$ 的半连通子图。若 $G'$ 是 $G$ 所有半连通子图中包含节点数最多的，则称 $G'$ 是 $G$ 的最大半连通子图。

给定一个有向图 $G$，请求出 $G$ 的最大半连通子图拥有的节点数 $K$，以及不同的最大半连通子图的数目 $C$。由于 $C$ 可能比较大，仅要求输出 $C$ 对 $X$ 的余数。

**题解：**

缩点后求最长链并计数。

注意：由于本题需要计数，**缩点后建的新图不能有重边**，否则就 WA 了。

[code](https://www.luogu.com.cn/record/89232898)

```cpp
const int N=1e5+5,M=1e6+5;
int n,m,x,y,mod,dfn[N],low[N],vis[N],tot,sum,co[N],siz[N],b[N],dp[N],cnt[N],in[N],maxx,ans,bs;
vector<int>vec[N],tu[N];
stack<int>st;
struct edge{
	int x,y;
}c[M];
bool cmp(edge aa,edge bb){
	return aa.x==bb.x?aa.y<bb.y:aa.x<bb.x;
}
void tarjan(int u){
	dfn[u]=low[u]=++tot,vis[u]=1,st.push(u);
	int len=vec[u].size(),v;
	for(int i=0;i<len;++i){
		v=vec[u][i];
		if(!dfn[v]) tarjan(v),low[u]=min(low[u],low[v]);
		else if(vis[v]) low[u]=min(low[u],dfn[v]);
	}
	if(low[u]==dfn[u]){
		++sum;
		do{
			v=st.top(),st.pop();
			co[v]=sum,vis[v]=0,++siz[sum];
		}while(v!=u);
	}
}
void dfs(int u){
	int len=tu[u].size(),v;
	dp[u]=siz[u],b[u]=1,cnt[u]=1;
	for(int i=0;i<len;++i){
		v=tu[u][i];
		if(!b[v]) dfs(v);
		if(dp[u]<dp[v]+siz[u]) dp[u]=dp[v]+siz[u],cnt[u]=cnt[v];
		else if(dp[u]==dp[v]+siz[u]) cnt[u]=(cnt[u]+cnt[v])%mod;
	}
}
int main() {
	n=read(),m=read(),mod=read();
	for(int i=1;i<=m;++i) x=read(),y=read(),vec[x].push_back(y);
	for(int i=1;i<=n;++i) if(!dfn[i]) tarjan(i);
	for(int i=1;i<=n;++i){
		int len=vec[i].size();
		for(int j=0;j<len;++j){
			int v=vec[i][j];
			if(co[i]!=co[v]) c[++bs].x=co[i],c[bs].y=co[v];
		}
	}
	sort(c+1,c+1+bs,cmp);
	for(int i=1;i<=bs;++i)
		if(c[i].x!=c[i-1].x||c[i].y!=c[i-1].y) tu[c[i].x].push_back(c[i].y),++in[c[i].y];
	for(int i=1;i<=sum;++i)
		if(!in[i]){
			dfs(i);
			if(dp[i]>maxx) maxx=dp[i],ans=cnt[i];
			else if(dp[i]==maxx) ans=(ans+cnt[i])%mod;
		}
	printf("%d\n%d",maxx,ans);
    return 0;
}
```
## [[2-SAT]]
*以上是在有向图中的* 

------------

*以下是在无向图中的，四者搭配食用互相理解*
 
*存图还是用链式前向星好，他快且用途广，比如割边、边双用他方便找出反向边。不过无向图注意**双倍** ！*

## 割点（割顶）
### 定义
- 对于一个**无向图**，如果把一个**点**删除后这个图的极大连通分量数增加了，那么这个点就是这个图的**割点**（又称**割顶**）。
- **割点是数个点双的交点。**

### 模板：求割点
```cpp
void tarjan(int u,int rt){
	dfn[u]=low[u]=++tot;
	int len=vec[u].size(),v,son=0;
	for(int i=0;i<len;++i){
		v=vec[u][i];
		if(!dfn[v]){
			++son,tarjan(v,rt),low[u]=min(low[u],low[v]);
			if(low[v]>=dfn[u]&&(rt!=u||son>1)) b[u]=1;//（此句重点）标记割点   >=   !!!!!!
		}
		else low[u]=min(low[u],dfn[v]);
	}
}
int main() {
	for(int i=1;i<=n;++i) if(!dfn[i]) tarjan(i,i);
	for(int i=1;i<=n;++i) if(b[i]) ++ans;
	printf("%d\n",ans);
}
```
### 求删除一点后连通块最大数量
把标点的标记改成计数，同时把初始值赋为 $1$ 。
- ### [#10103. 「一本通 3.6 练习 4」电力](https://loj.ac/p/10103)
```cpp
if(low[v]>=dfn[u]&&(rt!=u||son>1)) ++b[u];
```
[code](https://loj.ac/s/1602507)

### 求删点后不能互通的点对数
1. 非割点：$2*(n-1)$
1. 割点：正难则反，考虑求删点后仍能互通的点对数。以割点 $u$ 的儿子 $v$ 为根的子树内任意两点可互通，以割点 $u$ 的为根的子树外任意两点可互通。

- #### [#10104. 「一本通 3.6 练习 5」Blockade](https://loj.ac/p/10104)
[code](https://loj.ac/s/1602782)

### 必经点
 $a\to b$ 的必经点：以 $a$ 为根求出割点 $u$ ，判断割点 $u$ 所在的子树是否包含 $b$ 。若包含，则 $u$ 为必经点；反之。
- #### [#10101. 「一本通 3.6 练习 2」嗅探器](https://loj.ac/p/10101)
```cpp
if(low[v]>=dfn[u]&&u!=a&&dfn[b]>=dfn[v]) ans[u]=1;
```
[code](https://loj.ac/s/1602279)

## 割边（桥）
### 定义
- 对于一个**无向图**，如果删掉一条边后图中的连通分量数增加了，则称这条边为**桥**或者**割边**。
- **割边连接两个边双。**

### 模板
```cpp
void tarjan(int u,int fa){
	dfn[u]=low[u]=++tot;
	int v;
	for(int i=h[u];i;i=nxt[i]){
		v=to[i];
		if(v==fa) continue;
		//重点，无向图割边边双要判断v!=fa或标记走过的边（有重边只能标记），因为一条边只能走一次，而割点点双没有关系
		if(!dfn[v]){
			tarjan(v,u),low[u]=min(low[u],low[v]);
			if(low[v]>dfn[u]) b[i]=b[i^1]=1;//> !!!
		}
		else low[u]=min(low[u],dfn[v]);
	}
}
int main() {
	for(int i=1;i<=n;++i) if(!dfn[i]) tarjan(i,i);
	for(int i=1;i<=bs;++i) if(b[i]) ++ans;
	printf("%d\n",ans>>1);//无向变两有向，注意除2
}
```
### 必经边
 $a\to b$ 的必经边：以 $a$ 为根求出割边 $e$ ，判断割点 $e$ 远离 $a$ 的端点所在的子树是否包含 $b$ 。若包含，则 $e$ 为必经边；反之。

## 点双连通（点双）
### 定义
- 若一个**无向图中**的去掉任意一个**点**都不会改变此图的连通性，即**不存在割点**，则称作**点双连通图**。一个无向图中的每一个极大点双连通子图称作此无向图的**点双连通分量**。
- 注意**一个割点属于多个点双连通分量。**

### 模板
[P8435 【模板】点双连通分量](https://www.luogu.com.cn/problem/P8435)
```cpp
void tarjan(int u,int rt){
	dfn[u]=low[u]=++tot,st.push(u);
	int v,son=0;
	for(int i=h[u];i;i=nxt[i]){
		v=to[i];
		if(!dfn[v]){
			tarjan(v,rt),low[u]=min(low[u],low[v]),++son;
			if(low[v]>=dfn[u]){
				++sum;
				int x;
				do{
					x=st.top(),st.pop(),ans[sum].push_back(x);
				}while(x!=v);
				ans[sum].push_back(u);
			}
		}
		else low[u]=min(low[u],dfn[v]);
	}
	if(u==rt&&!son) ans[++sum].push_back(u);
}
int main() {
	n=read(),m=read();
	for(int i=1;i<=m;++i) x=read(),y=read(),add(x,y),add(y,x);
	for(int i=1;i<=n;++i) if(!dfn[i]) tarjan(i,i);
	printf("%d\n",sum);
	for(int i=1;i<=sum;++i){
		len=ans[i].size();
		printf("%d ",len);
		for(int j=0;j<len;++j) printf("%d ",ans[i][j]);
		printf("\n");
	}
    return 0;
}
```
### [P3225 [HNOI2012]矿场搭建](https://www.luogu.com.cn/problem/P3225)
**题意：**

在一个无向图上选择尽量少的点涂黑，使得删除任意一个点后，每个连通分量里都至少有一个黑点。

输出最少需要涂黑的点数以及当点数最少时的涂黑方案总数。

**题解：**

考虑只删去点 $u$ ，需要点数为剩余连通块数。

但由于删掉的是任意点，考虑点双缩点，每一个点双分量里无论怎么删都连通。

~~凭直觉考虑每个点双分量都涂黑一个点。~~

~~典型错误~~

对于每一个点双分量：

1. 没有割点：这个点双分量与世隔绝，要涂 $2$ 个（任意），互相保证，以防其中之一被删。
2. 有一个割点：割点是与外界沟通的唯一桥梁，要涂 $1$ 个（割点除外），因为若割点被删其余点就独立成一个连通块了。
3. 有两个及以上割点：不用涂，无论怎么删都无法独立出去，可以与其它共用黑点。

[code](https://loj.ac/s/1603161)
### [KNIGHTS - Knights of the Round Table](https://www.luogu.com.cn/problem/SP2878)
观察到 $n^2=m$，且有连边的不能相邻很难处理，考虑建补图。

**本题最关键的结论是：点双中若包含一个奇环，则其中所有点都在至少一个简单奇环上。**

证明：

最初的奇环上，任意点对 $u,v$ 间存在长为奇数的路径和长为偶数的路径。

对于点双内不在最初奇环上的点 $x$，将它与奇环上的任意两点 $u,v$ 相连，若两条路径和为奇数，则  $u,v$ 选偶长路径，反之。

求出每一个点双后黑白染色判奇环即可。

[code](https://www.luogu.com.cn/record/105601942)
## 边双连通（边双）
### 定义
- 若一个**无向图**中的去掉任意一条**边**都不会改变此图的连通性，即**不存在桥**，则称作**边双连通图**。一个无向图中的每一个极大边双连通子图称作此无向图的**边双连通分量**。
- 感性理解：就是无向图版的强连通分量。
- 连接**两个边双连通分量**的边即是**桥**。

### 模板
[P8436 【模板】边双连通分量](https://www.luogu.com.cn/problem/P8436)
```cpp
void tarjan(int u){
	dfn[u]=low[u]=++tot,st.push(u);
	int v;
	for(int i=h[u];i;i=nxt[i]){
		if(b[i]) continue;
		v=to[i],b[i]=b[i^1]=1;
		if(!dfn[v]) tarjan(v),low[u]=min(low[u],low[v]);
		else low[u]=min(low[u],dfn[v]);
	}
	if(low[u]==dfn[u]){
		++sum;
		do{
			v=st.top(),st.pop(),ans[sum].push_back(v);
		}while(v!=u);
	}
}
```
## [[圆方树]]
