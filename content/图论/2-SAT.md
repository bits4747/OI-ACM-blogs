---
public: true
---
#图论 #Tarjan
## 定义
2-SAT，简单的说就是给出 $n$ 个集合，每个集合有两个元素，已知若干个 $<a,b>$，表示 $a$ 与 $b$ 矛盾（其中 $a$ 与 $b$ 属于不同的集合）。然后从每个集合选择一个元素，判断能否一共选 $n$ 个两两不矛盾的元素。显然可能有多种选择方案，一般题中只需要求出一种即可。（[转自](https://oiwiki.com/graph/2-sat/)）
## 常用解法
~~暴搜~~和Tarjan缩点
### Tarjan缩点
1. 如何判断：通常将一点分为两点（选与不选），再将矛盾条件转化成充分条件，连边（$u\to v$ 表示若 $u$ 则 $v$）用 Tarjan 缩点，若矛盾的点在同一强连通分量则无解，反之。
1. 如何构造方案：由于 Tarjan 强连通是通过 dfs 来求的，每个强连通分量的序号从小到大是反向的拓扑序（越后遍历到的点越早被缩点），所以选**序号较小**的强连通分量会影响到更少的点。 

理解后重在建图！

## [2-SAT题单](https://www.luogu.com.cn/training/20236)
## [P4782 【模板】2-SAT 问题](https://www.luogu.com.cn/problem/P4782)
```cpp
const int N=2e6+5;
int n,m,x,a,y,b,dfn[N],low[N],vis[N],tot,sum,co[N];
vector<int>vec[N],tu[N];
stack<int>st;
int get(int u,int ty){return (u<<1)-ty;}
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
			co[v]=sum,vis[v]=0;
		}while(v!=u);
	}
}
int main() {
	n=read(),m=read(),n<<=1;
	for(int i=1;i<=m;++i){
		x=read(),a=read(),y=read(),b=read();
		vec[get(x,a^1)].push_back(get(y,b)),vec[get(y,b^1)].push_back(get(x,a));
	}
	for(int i=1;i<=n;++i) if(!dfn[i]) tarjan(i);
	for(int i=1;i<=n;i+=2) if(co[i]==co[i+1]){printf("IMPOSSIBLE\n");exit(0);}
	printf("POSSIBLE\n");
	for(int i=1;i<=n;i+=2) printf("%d ",co[i]<co[i+1]?1:0);
    return 0;
}
```
## 计数[P3513 [POI2011] KON-Conspiracy](https://www.luogu.com.cn/problem/P3513)
构造一个新的方案可以从一个可行解中**替换一个人的阵营**或**对调两个不同阵营的人**。

定义**冲突点对**为若把 $x$ 放到 $y$ 点所在部分去后会矛盾的点（$x,y$ 属于两部分）。

先根据前线互不认识和后勤互相认识建图跑 2-SAT ，把原图按反拓扑序先后划分为前线和后勤两部分（常规处理出一个正解），再处理出每个点的**冲突点对数**和其中**一个冲突点**。

一种新的方案只能通过以下两种操作之一构造：

- 替换一个人的阵营：冲突点对数为 $0$ 且原阵营人数大于 $1$。
- 对调两个不同阵营的人：冲突点对数为 $1$ 且对应的冲突点的冲突点对数为 $0$。

理由：

1. 后勤任意两人互相认识，所以不能换两个到前线，同理前线也不能同时换两个到后勤。所以每个阵营最多改变一个（可互换、可增减）。
2. 若存在冲突点对数为 $0$ 的点，这些点一定都在同一个阵营里(想想看，如果一个后勤和所有前线都不认识，起冲突点对数为 $0$，但必然不存在一个前线和所有后勤都认识，反之亦然)。所以不存在两个 $0$ 互换，只能把冲突点对数为 $0$ 扔到另一边，或对调冲突点对数为 $1$ 且对应的冲突点的冲突点对数为 $0$ 的两点。
```cpp
void tarjan(int u){
	dfn[u]=low[u]=++tot,vis[u]=1,st.push(u);
	int len=vec[u].size(),v;
	for(int i=len-1;i>=0;--i){
		v=vec[u][i];
		if(!dfn[v]) tarjan(v),low[u]=min(low[u],low[v]);
		else if(vis[v]) low[u]=min(low[u],dfn[v]);
	}
	if(low[u]==dfn[u]){
		++sum;
		do{
			v=st.top(),st.pop();
			co[v]=sum,vis[v]=0;
		}while(v!=u);
	}
}
int main() {
	n=read();//x前线，x+n后勤
	for(int i=1;i<=n;++i){
		k=read();
		for(int j=1;j<=k;++j) x=read(),b[i][x]=1;
	}
	for(int i=1;i<=n;++i)
		for(int j=1;j<=n;++j){
			if(b[i][j]) vec[i].push_back(j+n);//b--是否为熟人
			else if(i!=j) vec[i+n].push_back(j);
		}
	for(int i=n+n;i>=1;--i) if(!dfn[i]) tarjan(i);
	//bel--属于前线(0)/后勤(1)
	for(int i=1;i<=n;++i){//按反拓扑序分类
		if(co[i]==co[i+n]){printf("0");return 0;}
		if(co[i]<co[i+n]) q[0][++num[0]]=i;
		else q[1][++num[1]]=i,bel[i]=1;
	}
	if(num[0]&&num[1]) ans=1;
	for(int i=1;i<=num[0];++i){
		for(int j=1;j<=num[1];++j){//处理冲突点 
			if(!b[q[0][i]][q[1][j]]) ++cnt[q[0][i]],id[q[0][i]]=q[1][j];
			if(b[q[0][i]][q[1][j]]) ++cnt[q[1][j]],id[q[1][j]]=q[0][i];
		}
	}
	for(int i=1;i<=n;++i){
		if(!cnt[i]&&num[bel[i]]>1) ++ans;//冲突点对数为0且原阵营人数大于1，可替换这个人的阵营
		if(cnt[i]==1&&!cnt[id[i]]) ++ans; //冲突点对数为1，且对应的冲突点的冲突点对数为0，可对调这两个人
	}
	printf("%d",ans);
    return 0;
}
```
## 前后缀优化建图[P6378 [PA2010] Riddle](https://www.luogu.com.cn/problem/P6378)
每个部分内单个元素的选点要和其他所有元素的不选点连边，边数可达 $n^2$ 级别。

由于连边时往左往右各连连续一段区间，考虑前后缀优化建图。

[有图详解](https://www.luogu.com.cn/blog/dadaozhijian/p6378-pa2010riddle-ti-xie)

![[Pasted image 20230922214022.png]]

```cpp
//i表示选，i+3*n表示不选，i+n表示后缀（不包括自己）都不选，i+2*n表示前缀（包括自己）都不选 
n=read(),m=read(),k=read();
for(int i=1;i<=m;++i){
	x=read(),y=read();
	vec[x+3*n].push_back(y),vec[y+3*n].push_back(x);
}
for(int i=1;i<=k;++i){
	w=read();
	for(int j=1;j<=w;++j){
		a[j]=read();
		vec[a[j]].push_back(a[j]+n);
		if(j>1) vec[a[j]].push_back(a[j-1]+2*n);//连前后缀 
		vec[a[j]+2*n].push_back(a[j]+3*n);//前缀（包括自己）
		if(j>1){
			vec[a[j]+2*n].push_back(a[j-1]+2*n);//连前一个前缀 
			vec[a[j-1]+n].push_back(a[j]+3*n);//后缀（不包括自己）
			vec[a[j-1]+n].push_back(a[j]+n);//后一个后缀往前连 
		}
	}
}
```
## 建图好题[CF1215F Radio Stations](https://www.luogu.com.cn/problem/CF1215F)
**题意：**

有 $p$ 种电站，需要选择一种电站序列使其满足：

1. $n$ 对 $(x,y)$，$x$ 电站或 $y$ 电站中至少有一个
2. $m$ 对 $(x,y)$，$x$ 电站或 $y$ 电站中最多有一个
3. 第 $i$ 种电站有两个参数 $li$ 和 $ri$ $(1<=li<=ri<=M)$，表示其覆盖的区间为$[li,ri]$。若选定一个电站序列，序列中所有电站覆盖区间的交集不能为空。

$2 \le n, p, M, m \le 4 \cdot 10^5$，要求若求得一种合法电站序列，输出交集中任意一个点。

**题解：**

对于1、2，老套路。

对于3，可将 $0-M$ 的频率建成虚拟点， $i$ 表示 $f<=i$ ， $i+k$ 表示 $f>i$ ，用类似前后缀优化建边的方式处理。

- 相邻的频率点

```cpp
++k;//统一向右平移1
for(int i=p+p+1;i<p+p+k;++i) vec[i].push_back(i+1),vec[i+k+1].push_back(i+k);
vec[p+p+1].push_back(p+p+1+k);//频率为0不能选
```
- 不同频率的电台

```cpp
for(int i=1;i<=p;++i){
	x=read(),y=read(),++x,++y;
	vec[i].push_back(p+p+x-1+k),vec[i].push_back(p+p+y);//选：满足>x-1   <=y
	vec[p+p+x-1].push_back(i+p),vec[p+p+y+k].push_back(i+p);//若<=x-1或>y则不选
}
```
- 注意：一个坑点！

```cpp
//	for(int i=(p+p+k+k);i>=1;--i) 	错误写法，因为后面2*k个点是虚拟点，
//									而拓扑序只需考虑前2*p个点，从后往前会导致出错！！！ 
	for(int i=1;i<=(p+p+k+k);++i) if(!dfn[i]) tarjan(i);
```

[完整code](https://www.luogu.com.cn/record/89330622)
